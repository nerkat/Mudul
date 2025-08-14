import { z } from "zod";

export const ProtocolVersion = "1.0.0";

// ----- Core shapes -----
export const WidgetSlug = z.enum([
  "summary",
  "sentiment", 
  "booking",
  "objections",
  "actionItems",
  "keyMoments",
  "entities",
  "compliance",
  "pieChart" // example chart
]);

export type WidgetSlug = z.infer<typeof WidgetSlug>;

// ----- Widget Configuration -----
export const WidgetConfig = z.object({
  slug: WidgetSlug,
  params: z.record(z.any()).optional().default({})
});

export type WidgetConfig = z.infer<typeof WidgetConfig>;

// ----- Dashboard Layout -----
export const DashboardLayout = z.object({
  columns: z.number().int().min(1).max(24).default(12)
});

export type DashboardLayout = z.infer<typeof DashboardLayout>;

// ----- Dashboard Template -----
export const DashboardTemplate = z.object({
  version: z.literal(ProtocolVersion),
  layout: DashboardLayout.optional().default({ columns: 12 }),
  widgets: z.array(WidgetConfig)
});

export type DashboardTemplate = z.infer<typeof DashboardTemplate>;

// ----- AI Contract -----
export const AIDashboardPayload = z.object({
  version: z.literal(ProtocolVersion),
  dashboard: DashboardTemplate.omit({ version: true })
});

export type AIDashboardPayload = z.infer<typeof AIDashboardPayload>;