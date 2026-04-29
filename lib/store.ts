import type { Plan } from "@/lib/schema";

// In-memory plan store. Replace with Supabase / KV in production.
const store = new Map<string, Plan>();

export function savePlan(id: string, plan: Plan) {
  store.set(id, plan);
}

export function getPlan(id: string): Plan | undefined {
  return store.get(id);
}

export function planId(plan: Plan) {
  const cls = plan.class_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${plan.date_iso}-${cls}`;
}
