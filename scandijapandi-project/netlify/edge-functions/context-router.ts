import type { Context, Config } from "@netlify/edge-functions";

const COOKIE_NAME = "sj_context";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

const VALID_CURATORS = [
  "tokyo-lounge",
  "norwayhome",
  "tokyoliving",
  "sarah-reed",
  "oslo-design",
  "kyoto-craft",
];

interface TrackingContext {
  curator?: string;
  source?: string;
  sessionId: string;
  timestamp: string;
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

function parseExistingCookie(cookieValue: string | null): TrackingContext | null {
  if (!cookieValue) return null;
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return null;
  }
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const curatorParam = url.searchParams.get("curator");
  const sourceParam = url.searchParams.get("source");
  const refParam = url.searchParams.get("ref");

  const existingCookie = context.cookies.get(COOKIE_NAME);
  let trackingContext = parseExistingCookie(existingCookie);

  const hasNewParams = curatorParam || sourceParam || refParam;

  if (hasNewParams || !trackingContext) {
    const curator = curatorParam || refParam || trackingContext?.curator;
    const source = sourceParam || trackingContext?.source;

    trackingContext = {
      curator: curator || undefined,
      source: source || undefined,
      sessionId: trackingContext?.sessionId || generateSessionId(),
      timestamp: new Date().toISOString(),
    };

    context.cookies.set({
      name: COOKIE_NAME,
      value: encodeURIComponent(JSON.stringify(trackingContext)),
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  const response = await context.next();

  if (response.headers.get("content-type")?.includes("text/html")) {
    const body = await response.text();
    const contextScript = `<script>window.__SJ_CONTEXT__=${JSON.stringify(trackingContext)};</script>`;
    const injected = body.replace("</head>", `${contextScript}</head>`);

    return new Response(injected, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
};

export const config: Config = {
  path: "/*",
  excludedPath: ["/api/*", "/.netlify/*", "/images/*", "/_next/*", "/admin/*"],
};
