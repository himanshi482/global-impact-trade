import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dutyCalculationSchema, validateBody } from "@/lib/validation";
import { calculateDuty } from "@/lib/duty";

export async function POST(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = validateBody(dutyCalculationSchema, body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  try {
    const rows = await query(
      "SELECT code, description, bcd, sws, igst FROM hs_codes WHERE code = ? LIMIT 1",
      [data.hsCode]
    );
    const hsCode = rows[0];

    if (!hsCode) {
      return Response.json(
        { error: `HS code ${data.hsCode} was not found` },
        { status: 404 }
      );
    }

    const result = calculateDuty(data, hsCode);

    return Response.json({
      hsCode: hsCode.code,
      description: hsCode.description,
      ...result,
    });
  } catch (err) {
    console.error("POST /api/hs-codes/calculate-duty error:", err);
    return Response.json({ error: "Failed to calculate duty" }, { status: 500 });
  }
}
