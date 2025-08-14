import type { SalesCallMinimal } from "../hooks/useSalesCall";
import { PaperCard } from "./shared/PaperCard";

export type WidgetProps = { data: SalesCallMinimal };

// PAPER (unstyled)
export const Paper = {
  Summary: ({ data }: WidgetProps) => (
    <PaperCard title="Summary">
      {data.summary ?? "No summary"}
    </PaperCard>
  ),
  
  Sentiment: ({ data }: WidgetProps) => (
    <PaperCard title="Sentiment">
      Overall: {data.sentiment?.overall ?? "-"} | Score: {data.sentiment?.score ?? "-"}
    </PaperCard>
  ),
  
  Booking: ({ data }: WidgetProps) => (
    <PaperCard title="Booking Likelihood">
      {data.bookingLikelihood ?? "-"}
    </PaperCard>
  ),
  
  Objections: ({ data }: WidgetProps) => (
    <PaperCard title="Objections">
      {data.objections?.length
        ? data.objections.map((o, i) => (
            <div key={i}>
              <em>{o.type}</em>: "{o.quote}" @ {o.ts}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  ActionItems: ({ data }: WidgetProps) => (
    <PaperCard title="Action Items">
      {data.actionItems?.length
        ? data.actionItems.map((a, i) => (
            <div key={i}>
              {a.owner}: {a.text}{a.due ? ` (due ${a.due})` : ""}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  KeyMoments: ({ data }: WidgetProps) => (
    <PaperCard title="Key Moments">
      {data.keyMoments?.length
        ? data.keyMoments.map((k, i) => (
            <div key={i}>
              {k.label} @ {k.ts}
            </div>
          ))
        : "None"}
    </PaperCard>
  ),
  
  Entities: ({ data }: WidgetProps) => (
    <PaperCard title="Entities">
      <div>Prospect: {data.entities?.prospect?.join(", ") || "-"}</div>
      <div>People: {data.entities?.people?.join(", ") || "-"}</div>
      <div>Products: {data.entities?.products?.join(", ") || "-"}</div>
    </PaperCard>
  ),
  
  Compliance: ({ data }: WidgetProps) => (
    <PaperCard title="Compliance Flags">
      {data.complianceFlags?.length ? data.complianceFlags.join(", ") : "None"}
    </PaperCard>
  ),
};

// RICH (for now reuse paper; swap out later per widget)
export const Rich = {
  Summary: ({ data }: WidgetProps) => {
    if (!data.summary) return <div className="rounded-xl border p-4 text-slate-500">No summary yet</div>;
    return (
      <div className="rounded-xl border p-4">
        <div className="font-medium">Summary</div>
        <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
      </div>
    );
  },
  
  Sentiment: ({ data }: WidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Sentiment</div>
      <div className="mt-2 text-sm">
        Overall: {data.sentiment?.overall ?? "-"} | Score: {data.sentiment?.score ?? "-"}
      </div>
    </div>
  ),
  
  Booking: ({ data }: WidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Booking Likelihood</div>
      <div className="mt-2 text-sm">{data.bookingLikelihood ?? "-"}</div>
    </div>
  ),
  
  Objections: ({ data }: WidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Objections</div>
      <div className="mt-2 text-sm space-y-1">
        {data.objections?.length
          ? data.objections.map((o, i) => (
              <div key={i}>
                <em>{o.type}</em>: "{o.quote}" @ {o.ts}
              </div>
            ))
          : "None"}
      </div>
    </div>
  ),
  
  ActionItems: ({ data }: WidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Action Items</div>
      <div className="mt-2 text-sm space-y-1">
        {data.actionItems?.length
          ? data.actionItems.map((a, i) => (
              <div key={i}>
                {a.owner}: {a.text}{a.due ? ` (due ${a.due})` : ""}
              </div>
            ))
          : "None"}
      </div>
    </div>
  ),
  
  KeyMoments: ({ data }: WidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Key Moments</div>
      <div className="mt-2 text-sm space-y-1">
        {data.keyMoments?.length
          ? data.keyMoments.map((k, i) => (
              <div key={i}>
                {k.label} @ {k.ts}
              </div>
            ))
          : "None"}
      </div>
    </div>
  ),
  
  Entities: ({ data }: WidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Entities</div>
      <div className="mt-2 text-sm space-y-1">
        <div>Prospect: {data.entities?.prospect?.join(", ") || "-"}</div>
        <div>People: {data.entities?.people?.join(", ") || "-"}</div>
        <div>Products: {data.entities?.products?.join(", ") || "-"}</div>
      </div>
    </div>
  ),
  
  Compliance: ({ data }: WidgetProps) => (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Compliance Flags</div>
      <div className="mt-2 text-sm">
        {data.complianceFlags?.length ? data.complianceFlags.join(", ") : "None"}
      </div>
    </div>
  ),
};