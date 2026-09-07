// lib/csrf.js

export function sameOriginResponse(request) {
  const origin = request.headers.get('origin');

  // Some requests may not contain Origin header.
  if (!origin) return null;

  try {
    const requestOrigin = new URL(request.url).origin;

    // Production app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const allowedOrigins = new Set([
      requestOrigin,
      ...(appUrl ? [new URL(appUrl).origin] : []),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);

    if (!allowedOrigins.has(new URL(origin).origin)) {
      return Response.json(
        { error: 'Cross-site request blocked' },
        { status: 403 }
      );
    }
  } catch {
    return Response.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  return null;
}
