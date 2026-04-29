import { z } from "zod";

export const PlanSchema = z.object({
  school: z.literal("First Step School - Saurabh Vihar"),
  class_name: z.string(),
  date_iso: z.string(),
  weekday: z.string(),
  festival_today: z
    .object({
      name: z.string(),
      note: z.string(),
      closed: z.boolean(),
    })
    .optional(),
  parents: z
    .array(
      z.object({
        subject: z.string(),
        topic: z.string(),
        home_tip: z.string(),
      })
    )
    .min(1),
  homework: z.string(),
  video_activity: z.object({
    title: z.string(),
    duration_sec: z.number().int().positive(),
    curriculum_links: z.array(z.string()).min(2),
    plan_steps: z.array(z.string()).min(4),
    shoot_steps: z.array(z.string()).min(4),
    safety_dos: z.array(z.string()).min(1),
    safety_donts: z.array(z.string()).min(1),
  }),
});

export type Plan = z.infer<typeof PlanSchema>;
