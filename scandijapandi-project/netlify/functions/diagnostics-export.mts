import type { Config, Context } from "@netlify/functions";
import { desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { diagnosticLogs } from "../../db/schema.js";
import { buildDiagnostic, logDiagnostic } from "../../lib/diagnostics.mjs";

const FUNCTION_NAME = "diagnostics-export";

export default async (req: Request, context: Context) => {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedKey = Netlify.env.get("DIAGNOSTICS_API_KEY");

    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 1000);
    const severity = url.searchParams.get("severity");

    let query = db.select().from(diagnosticLogs).orderBy(desc(diagnosticLogs.createdAt)).limit(limit);

    if (severity) {
      const { eq } = await import("drizzle-orm");
      query = query.where(eq(diagnosticLogs.severity, severity)) as typeof query;
    }

    const logs = await query;

    return Response.json({
      count: logs.length,
      exportedAt: new Date().toISOString(),
      logs,
    });
  } catch (error) {
    const diagnostic = buildDiagnostic(FUNCTION_NAME, error, {
      requestId: context.requestId,
    });
    await logDiagnostic(diagnostic);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/diagnostics",
  method: "GET",
};
