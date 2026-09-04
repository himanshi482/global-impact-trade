import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { z } from "zod";
import { validateBody } from "@/lib/validation";
import { sameOriginResponse } from "@/lib/csrf";

const alertSchema = z.object({
  name: z.string().trim().min(1).max(150),
  alertType: z.enum(["HS_CODE", "COUNTRY", "OPPORTUNITY_SCORE", "BUYER_ACTIVITY", "SHIPMENT_ACTIVITY", "RISK_LEVEL"]),
  criteria: z.record(z.string(), z.union([z.string().trim().min(1).max(100), z.number().finite()])).refine((value) => Object.keys(value).length > 0, "Criteria is required"),
  isActive: z.boolean().optional().default(true),
}).strict();

function serialize(row) {
  return { id: row.id, name: row.name, alertType: row.alert_type, criteria: row.criteria, isActive: Boolean(row.is_active), lastTriggeredAt: row.last_triggered_at, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;
  const rows = await query("SELECT id, name, alert_type, criteria, is_active, last_triggered_at, created_at, updated_at FROM market_alerts WHERE user_id = ? ORDER BY created_at DESC", [user.id]);
  return Response.json({ alerts: rows.map(serialize) });
}

export async function POST(request) {
  const csrfError = sameOriginResponse(request);
  if (csrfError) return csrfError;
  const user = await requireUser();
  if (user instanceof Response) return user;
  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const { data, error } = validateBody(alertSchema, body);
  if (error) return Response.json({ error }, { status: 400 });
  const result = await query("INSERT INTO market_alerts (user_id, name, alert_type, criteria, is_active) VALUES (?, ?, ?, ?, ?)", [user.id, data.name, data.alertType, JSON.stringify(data.criteria), data.isActive]);
  return Response.json({ id: result.insertId }, { status: 201 });
}
