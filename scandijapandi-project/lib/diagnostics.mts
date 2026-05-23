import { db } from "../db/index.js";
import { diagnosticLogs } from "../db/schema.js";

export interface DiagnosticPayload {
  functionName: string;
  severity: "error" | "warn" | "info";
  message: string;
  errorStack?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export function buildDiagnostic(
  functionName: string,
  error: unknown,
  extra?: { requestId?: string; metadata?: Record<string, unknown> }
): DiagnosticPayload {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    functionName,
    severity: "error",
    message: err.message,
    errorStack: err.stack,
    requestId: extra?.requestId,
    metadata: extra?.metadata,
  };
}

export async function logDiagnostic(payload: DiagnosticPayload): Promise<void> {
  try {
    await db.insert(diagnosticLogs).values({
      functionName: payload.functionName,
      severity: payload.severity,
      message: payload.message,
      errorStack: payload.errorStack,
      requestId: payload.requestId,
      metadata: payload.metadata,
    });
  } catch {
    console.error("[Gunnar Diagnostics] Failed to persist log:", JSON.stringify(payload));
  }
}
