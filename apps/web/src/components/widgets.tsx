import type { SalesCallMinimal } from "../core/types";
import { PaperCard } from "../widgets/shared/PaperCard";

// Explicit minimal widget props - only the fields each widget actually uses
export type SummaryWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "summary">>;
};

export type SentimentWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "sentiment">>;
};

export type BookingWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "bookingLikelihood">>;
};

export type ObjectionsWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "objections">>;
};

export type ActionItemsWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "actionItems">>;
};

export type KeyMomentsWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "keyMoments">>;
};

export type EntitiesWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "entities">>;
};

export type ComplianceWidgetProps = {
  data: Partial<Pick<SalesCallMinimal, "complianceFlags">>;
};

// Legacy type for backward compatibility
export type WidgetProps = { data: SalesCallMinimal };

// PAPER (unstyled)
export const Paper = {
  Summary: ({ data }: SummaryWidgetProps) => (
    <PaperCard title="Summary">
      {data.summary ?? "No summary"}
    </PaperCard>
  ),
  
  Sentiment: ({ data }: SentimentWidgetProps) => (
    <PaperCard title="Sentiment">
      Overall: {data.sentiment?.overall ?? "-"} | Score: {data.sentiment?.score ?? "-"}
    </PaperCard>
  ),
  
  Booking: ({ data }: BookingWidgetProps) => (
    <PaperCard title="Booking Likelihood">
      {data.bookingLikelihood ?? "-"}
    </PaperCard>
  ),
  
  Objections: ({ data }: ObjectionsWidgetProps) => (
    <PaperCard title="Objections">
      {data.objections?.length
        ? data.objections.map((o: { type: string; quote: string; ts: string }, i: number) => (
            <div key={i}>
              <em>{o.type}</em>: "{o.quote}" @ {o.ts}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  ActionItems: ({ data }: ActionItemsWidgetProps) => (
    <PaperCard title="Action Items">
      {data.actionItems?.length
        ? data.actionItems.map((a: { owner: string; text: string; due?: string | null }, i: number) => (
            <div key={i}>
              {a.owner}: {a.text}{a.due ? ` (due ${a.due})` : ""}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  KeyMoments: ({ data }: KeyMomentsWidgetProps) => (
    <PaperCard title="Key Moments">
      {data.keyMoments?.length
        ? data.keyMoments.map((k: { label: string; ts: string }, i: number) => (
            <div key={i}>
              {k.label} @ {k.ts}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  Entities: ({ data }: EntitiesWidgetProps) => (
    <PaperCard title="Entities">
      <div>Prospect: {data.entities?.prospect?.join(", ") || "-"}</div>
      <div>People: {data.entities?.people?.join(", ") || "-"}</div>
      <div>Products: {data.entities?.products?.join(", ") || "-"}</div>
    </PaperCard>
  ),
  
  Compliance: ({ data }: ComplianceWidgetProps) => (
    <PaperCard title="Compliance Flags">
      {data.complianceFlags?.length ? data.complianceFlags.join(", ") : "None"}
    </PaperCard>
  ),
};

// RICH (styled widgets)
export const Rich = {
  Summary: ({ data }: SummaryWidgetProps) => {
    if (!data.summary) return <div className="rounded-xl border p-4 text-slate-500">No summary yet</div>;
    return (
      <div className="rounded-xl border p-4">
        <div className="font-medium">Summary</div>
        <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
      </div>
    );
  },
  
  Sentiment: ({ data }: SentimentWidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Sentiment</div>
      <div className="mt-2 text-sm">
        Overall: {data.sentiment?.overall ?? "-"} | Score: {data.sentiment?.score ?? "-"}
      </div>
    </div>
  ),
  
  Booking: ({ data }: BookingWidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Booking Likelihood</div>
      <div className="mt-2 text-sm">{data.bookingLikelihood ?? "-"}</div>
    </div>
  ),
  
  Objections: ({ data }: ObjectionsWidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Objections</div>
      <div className="mt-2 text-sm space-y-1">
        {data.objections?.length
          ? data.objections.map((o: { type: string; quote: string; ts: string }, i: number) => (
              <div key={i}>
                <em>{o.type}</em>: "{o.quote}" @ {o.ts}
              </div>
            ))
          : "None"}
      </div>
    </div>
  ),
  
  ActionItems: ({ data }: ActionItemsWidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Action Items</div>
      <div className="mt-2 text-sm space-y-1">
        {data.actionItems?.length
          ? data.actionItems.map((a: { owner: string; text: string; due?: string | null }, i: number) => (
              <div key={i}>
                {a.owner}: {a.text}{a.due ? ` (due ${a.due})` : ""}
              </div>
            ))
          : "None"}
      </div>
    </div>
  ),
  
  KeyMoments: ({ data }: KeyMomentsWidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Key Moments</div>
      <div className="mt-2 text-sm space-y-1">
        {data.keyMoments?.length
          ? data.keyMoments.map((k: { label: string; ts: string }, i: number) => (
              <div key={i}>
                {k.label} @ {k.ts}
              </div>
            ))
          : "None"}
      </div>
    </div>
  ),
  
  Entities: ({ data }: EntitiesWidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Entities</div>
      <div className="mt-2 text-sm space-y-1">
        <div>Prospect: {data.entities?.prospect?.join(", ") || "-"}</div>
        <div>People: {data.entities?.people?.join(", ") || "-"}</div>
        <div>Products: {data.entities?.products?.join(", ") || "-"}</div>
      </div>
    </div>
  ),
  
  Compliance: ({ data }: ComplianceWidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Compliance Flags</div>
      <div className="mt-2 text-sm">
        {data.complianceFlags?.length ? data.complianceFlags.join(", ") : "None"}
      </div>
    </div>
  ),
};