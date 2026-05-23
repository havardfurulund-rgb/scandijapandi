import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders } from "../../db/schema.js";
import { buildDiagnostic, logDiagnostic } from "../../lib/diagnostics.mjs";

const FUNCTION_NAME = "stripe-webhook-background";
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 15000];

interface ProducerConfig {
  endpoint: string;
  active: boolean;
  ddpSupported: boolean;
}

function getProducerConfig(curator: string): ProducerConfig | null {
  const configJson = Netlify.env.get("PRODUCER_ENDPOINTS");
  if (!configJson) return null;
  try {
    const producers = JSON.parse(configJson) as Record<string, ProducerConfig>;
    return producers[curator] || null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async (req: Request) => {
  try {
    const orderPayload = await req.json();
    const { curator, stripeSessionId } = orderPayload as {
      curator?: string;
      stripeSessionId?: string;
    };

    if (!curator || !stripeSessionId) {
      await logDiagnostic({
        functionName: FUNCTION_NAME,
        severity: "warn",
        message: "Background retry invoked without curator or stripeSessionId",
        metadata: orderPayload,
      });
      return;
    }

    const producer = getProducerConfig(curator);
    if (!producer?.active) {
      await db
        .update(orders)
        .set({ routingStatus: "manual_processing_required", updatedAt: new Date() })
        .where(eq(orders.stripeSessionId, stripeSessionId));
      return;
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(producer.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Delivery-Terms": producer.ddpSupported ? "DDP" : "DAP",
            "X-Retry-Attempt": String(attempt + 1),
          },
          body: JSON.stringify(orderPayload),
        });

        if (response.ok) {
          await db
            .update(orders)
            .set({
              routingStatus: "routed_to_producer",
              producerEndpoint: producer.endpoint,
              updatedAt: new Date(),
            })
            .where(eq(orders.stripeSessionId, stripeSessionId));
          return;
        }

        lastError = new Error(`Producer responded with ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;
      }

      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }

    await db
      .update(orders)
      .set({ routingStatus: "retry_exhausted", updatedAt: new Date() })
      .where(eq(orders.stripeSessionId, stripeSessionId));

    const diagnostic = buildDiagnostic(FUNCTION_NAME, lastError, {
      metadata: {
        curator,
        stripeSessionId,
        retriesExhausted: true,
        producerEndpoint: producer.endpoint,
      },
    });
    await logDiagnostic(diagnostic);
    console.error(`[${FUNCTION_NAME}]`, JSON.stringify(diagnostic));
  } catch (error) {
    const diagnostic = buildDiagnostic(FUNCTION_NAME, error);
    await logDiagnostic(diagnostic);
    console.error(`[${FUNCTION_NAME}]`, JSON.stringify(diagnostic));
  }
};
