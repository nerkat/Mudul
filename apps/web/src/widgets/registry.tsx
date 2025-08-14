import type { SalesCallMinimal } from "../hooks/useSalesCall";
import { PaperCard } from "./shared/PaperCard";
import { UiCard } from "./shared/UiCard";

// Explicit minimal widget props - only the fields each widget actually uses
export type SummaryWidgetProps = {
  data: Pick<SalesCallMinimal, "summary">;
};

export type SentimentWidgetProps = {
  data: Pick<SalesCallMinimal, "sentiment">;
};

export type BookingWidgetProps = {
  data: Pick<SalesCallMinimal, "bookingLikelihood">;
};

export type ObjectionsWidgetProps = {
  data: Pick<SalesCallMinimal, "objections">;
};

export type ActionItemsWidgetProps = {
  data: Pick<SalesCallMinimal, "actionItems">;
};

export type KeyMomentsWidgetProps = {
  data: Pick<SalesCallMinimal, "keyMoments">;
};

export type EntitiesWidgetProps = {
  data: Pick<SalesCallMinimal, "entities">;
};

export type ComplianceWidgetProps = {
  data: Pick<SalesCallMinimal, "complianceFlags">;
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
        ? data.objections.map((o, i) => (
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
        ? data.actionItems.map((a, i) => (
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
        ? data.keyMoments.map((k, i) => (
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
    if (!data.summary) {
      return (
        <UiCard title="Summary">
          <div className="text-gray-500 dark:text-gray-400">No summary yet</div>
        </UiCard>
      );
    }
    return (
      <UiCard title="Summary">
        <p className="text-sm leading-relaxed whitespace-pre-line">{data.summary}</p>
      </UiCard>
    );
  },
  
  Sentiment: ({ data }: SentimentWidgetProps) => {
    const sentiment = data.sentiment?.overall || "neutral";
    const score = data.sentiment?.score || 0;
    
    // Color-coded badge styling
    const getBadgeColor = (sentiment: string) => {
      switch (sentiment.toLowerCase()) {
        case "positive":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "negative":
          return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      }
    };
    
    return (
      <UiCard title="Sentiment">
        <div className="space-y-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getBadgeColor(sentiment)}`}>
            {sentiment}
          </span>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Score: {score.toFixed(2)}
          </div>
        </div>
      </UiCard>
    );
  },
  
  Booking: ({ data }: BookingWidgetProps) => {
    const likelihood = data.bookingLikelihood || 0;
    const percentage = typeof likelihood === 'number' ? (likelihood * 100).toFixed(1) : likelihood;
    
    return (
      <UiCard title="Booking Likelihood">
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {percentage}%
          </div>
          {/* Placeholder for delta - hidden if not provided */}
          <div className="text-xs text-gray-500 dark:text-gray-400 opacity-0">
            <span className="text-green-600 dark:text-green-400">↑ +2.5%</span> from last call
          </div>
        </div>
      </UiCard>
    );
  },
  
  Objections: ({ data }: ObjectionsWidgetProps) => (
    <UiCard title="Objections">
      <div className="space-y-3">
        {data.objections?.length ? (
          data.objections.map((o, i) => (
            <div key={i} className="flex items-start justify-between">
              <div className="flex-1">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 mr-2">
                  {o.type}
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100">"{o.quote}"</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono ml-2">
                {o.ts}
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm">No objections raised</div>
        )}
      </div>
    </UiCard>
  ),
  
  ActionItems: ({ data }: ActionItemsWidgetProps) => {
    const groupedItems = data.actionItems?.reduce((acc, item) => {
      const owner = item.owner || 'unassigned';
      if (!acc[owner]) acc[owner] = [];
      acc[owner].push(item);
      return acc;
    }, {} as Record<string, typeof data.actionItems>) || {};

    const getOwnerBadgeColor = (owner: string) => {
      switch (owner) {
        case "sales_rep":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        case "prospect":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      }
    };

    return (
      <UiCard title="Action Items">
        <div className="space-y-4">
          {Object.entries(groupedItems).length ? (
            Object.entries(groupedItems).map(([owner, items]) => (
              <div key={owner}>
                <div className="flex items-center mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getOwnerBadgeColor(owner)}`}>
                    {owner.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-2 ml-0">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{item.text}</span>
                      {item.due && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          due {item.due}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm">No action items</div>
          )}
        </div>
      </UiCard>
    );
  },
  
  KeyMoments: ({ data }: KeyMomentsWidgetProps) => (
    <UiCard title="Key Moments">
      <div className="space-y-2">
        {data.keyMoments?.length ? (
          data.keyMoments.map((moment, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-900 dark:text-gray-100">{moment.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {moment.ts}
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm">No key moments identified</div>
        )}
      </div>
    </UiCard>
  ),
  
  Entities: ({ data }: EntitiesWidgetProps) => (
    <UiCard title="Entities">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Prospect</h4>
          <div className="flex flex-wrap gap-1">
            {data.entities?.prospect?.length ? (
              data.entities.prospect.map((item, i) => (
                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">People</h4>
          <div className="flex flex-wrap gap-1">
            {data.entities?.people?.length ? (
              data.entities.people.map((item, i) => (
                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Products</h4>
          <div className="flex flex-wrap gap-1">
            {data.entities?.products?.length ? (
              data.entities.products.map((item, i) => (
                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
            )}
          </div>
        </div>
      </div>
    </UiCard>
  ),
  
  Compliance: ({ data }: ComplianceWidgetProps) => (
    <UiCard title="Compliance Flags">
      {data.complianceFlags?.length ? (
        <div className="space-y-2">
          {data.complianceFlags.map((flag, i) => (
            <div key={i} className="flex items-center text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
              <span className="text-red-900 dark:text-red-200">{flag}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm">No compliance flags</div>
      )}
    </UiCard>
  ),
};