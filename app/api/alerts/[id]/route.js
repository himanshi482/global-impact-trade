import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { z } from "zod";
import { validateBody } from "@/lib/validation";
import { sameOriginResponse } from "@/lib/csrf";

const idSchema = z.string().regex(/^[1-9]\d*$/).transform(Number);
const updateSchema = z.object({ name: z.string().trim().min(1).max(150).optional(), criteria: z.record(z.string(), z.union([z.string().trim().min(1).max(100), z.number().finite()])).optional(), isActive: z.boolean().optional() }).strict();

async function ownedId(params, userId) {
  const parsed = idSchema.safeParse(params.id);
  if (!parsed.success) return null;
  const rows = await query("SELECT id FROM market_alerts WHERE id = ? AND user_id = ?", [parsed.data, userId]);
  return rows.length ? parsed.data : null;
}

export async function PUT(request, { params }) {
  const csrfError = sameOriginResponse(request);
  if (csrfError) return csrfError;
  const user = await requireUser();
  if (user instanceof Response) return user;
  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;
  const id = await ownedId(await params, user.id);
  if (!id) return Response.json({ error: "Alert not found" }, { status: 404 });
  const { data, error } = validateBody(updateSchema, await request.json().catch(() => null));
  if (error) return Response.json({ error }, { status: 400 });
  const fields = []; const values = [];
  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.criteria !== undefined) { fields.push("criteria = ?"); values.push(JSON.stringify(data.criteria)); }
  if (data.isActive !== undefined) { fields.push("is_active = ?"); values.push(data.isActive); }
  if (!fields.length) return Response.json({ error: "No changes provided" }, { status: 400 });
  values.push(id, user.id);
  await query(`UPDATE market_alerts SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);
  return Response.json({ updated: true });
}

export async function DELETE(request, { params }) {
  const csrfError = sameOriginResponse(request);
  if (csrfError) return csrfError;
  const user = await requireUser();
  if (user instanceof Response) return user;
  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;
  const id = await ownedId(await params, user.id);
  if (!id) return Response.json({ error: "Alert not found" }, { status: 404 });
  await query("DELETE FROM market_alerts WHERE id = ? AND user_id = ?", [id, user.id]);
  return Response.json({ deleted: true });
}
