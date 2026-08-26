import { query } from "@/lib/db";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, phone, company, message } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO contact_requests (name, email, phone, company, message, status)
       VALUES (?, ?, ?, ?, ?, 'NEW')`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        company || null,
        message || null,
      ]
    );

    return Response.json({ id: result.insertId, message: "Contact request submitted" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return Response.json({ error: "Failed to submit contact request" }, { status: 500 });
  }
}
