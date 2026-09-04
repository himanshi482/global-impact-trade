export function getLeadIntelligence(lead, now = new Date()) {
  const createdAt = new Date(lead.createdAt || lead.created_at);
  const ageDays = Number.isNaN(createdAt.getTime()) ? null : Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86400000));
  const followUp = lead.nextFollowUpAt || lead.next_follow_up_at;
  const overdue = followUp && new Date(followUp).getTime() < now.getTime();
  let priority = "LOW";
  if (overdue || (lead.status === "NEW" && ageDays !== null && ageDays >= 14)) priority = "URGENT";
  else if (Number(lead.leadScore ?? lead.lead_score) >= 80 || lead.status === "NEGOTIATING") priority = "HIGH";
  else if (lead.status === "QUALIFIED" || lead.status === "CONTACTED") priority = "MEDIUM";
  return { ageDays, priority, overdue: Boolean(overdue), lastActivityAt: lead.updatedAt || lead.updated_at || lead.createdAt || lead.created_at, nextFollowUpAt: followUp || null, lastContactedAt: lead.lastContactedAt || lead.last_contacted_at || null };
}
