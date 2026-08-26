import { query } from "@/lib/db";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, phone, company, preferredDate, message } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }

  // Safely parse date for MySQL DATE column
  let validDate = null;
  if (preferredDate && typeof preferredDate === "string") {
    const parsed = new Date(preferredDate);
    if (!isNaN(parsed.getTime())) {
      validDate = parsed.toISOString().slice(0, 10);
    }
  }

  const combinedMessage = [
    preferredDate && !validDate ? `Preferred Slot: ${preferredDate}` : null,
    message || (body.productLine ? `Product Line: ${body.productLine}` : null),
  ]
    .filter(Boolean)
    .join(" | ");

  try {
    const result = await query(
      `INSERT INTO demo_requests (name, email, phone, company, preferred_date, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'NEW')`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        company || null,
        validDate,
        combinedMessage || null,
      ]
    );

    return Response.json({ id: result.insertId, message: "Demo request booked" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/demo error:", err);
    return Response.json({ error: "Failed to book demo" }, { status: 500 });
  }
}
