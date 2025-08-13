import { z } from "zod";

export const SalesCallV1 = z.object({
  version: z.literal("1.0.0"),
  callId: z.string(),
  summary: z.string().min(1),
  sentiment: z.object({
    overall: z.enum(["positive", "neutral", "negative"]),
    score: z.number().min(0).max(1),
  }),
  bookingLikelihood: z.number().min(0).max(1),
  objections: z.array(z.object({
    type: z.string(),
    quote: z.string().optional(),
    ts: z.string().optional(),
  })).default([]),
  actionItems: z.array(z.object({
    owner: z.string(),
    text: z.string(),
    due: z.string().nullable().optional(),
  })).default([]),
  keyMoments: z.array(z.object({
    label: z.string(),
    ts: z.string().optional(),
  })).default([]),
  entities: z.object({
    prospect: z.array(z.string()).optional(),
    people: z.array(z.string()).optional(),
    products: z.array(z.string()).optional(),
  }).partial().default({}),
  complianceFlags: z.array(z.string()).default([]),
});

export type SalesCall = z.infer<typeof SalesCallV1>;

export function validateSalesCall(json: unknown) {
  return SalesCallV1.safeParse(json);
}