export function sameOriginResponse(request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      return Response.json({ error: "Cross-site request blocked" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }
  return null;
}
