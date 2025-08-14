import React from "react";
import { Paper, Rich } from "../components/widgets";
import type { SalesCallMinimal, WidgetKey, DashboardTemplate } from "./types";
import { useViewMode } from "../ctx/ViewModeContext";

// Dashboard templates mapping dashboardId to widget layout
export const DashboardTemplates: Record<string, DashboardTemplate> = {
  "sales-call-default": [
    "summary",
    "sentiment", 
    "booking",
    "objections",
    "actionItems",
    "keyMoments",
    "entities",
    "compliance"
  ],
  "client-dashboard": [
    "summary",
    "sentiment",
    "booking"
  ]
};

// Widget registry mapping widget keys to components
export const WidgetRegistry: Record<WidgetKey, (call: SalesCallMinimal, mode?: "paper" | "rich") => React.ReactNode> = {
  summary: (call, mode = "rich") => {
    const W = mode === "paper" ? Paper : Rich;
    return <W.Summary key="summary" data={{ summary: call.summary }} />;
  },
  
  sentiment: (call, mode = "rich") => {
    const W = mode === "paper" ? Paper : Rich;
    return <W.Sentiment key="sentiment" data={{ sentiment: call.sentiment }} />;
  },
  
  booking: (call, mode = "rich") => {
    const W = mode === "paper" ? Paper : Rich;
    return <W.Booking key="booking" data={{ bookingLikelihood: call.bookingLikelihood }} />;
  },
  
  objections: (call, mode = "rich") => {
    const W = mode === "paper" ? Paper : Rich;
    return <W.Objections key="objections" data={{ objections: call.objections }} />;
  },
  
  actionItems: (call, mode = "rich") => {
    const W = mode === "paper" ? Paper : Rich;
    return <W.ActionItems key="actionItems" data={{ actionItems: call.actionItems }} />;
  },
  
  keyMoments: (call, mode = "rich") => {
    const W = mode === "paper" ? Paper : Rich;
    return <W.KeyMoments key="keyMoments" data={{ keyMoments: call.keyMoments }} />;
  },
  
  entities: (call, mode = "rich") => {
    const W = mode === "paper" ? Paper : Rich;
    return <W.Entities key="entities" data={{ entities: call.entities }} />;
  },
  
  compliance: (call, mode = "rich") => {
    const W = mode === "paper" ? Paper : Rich;
    return <W.Compliance key="compliance" data={{ complianceFlags: call.complianceFlags }} />;
  }
};

// Hook to render dashboard widgets
export function useDashboardWidgets(dashboardId: string, call: SalesCallMinimal | null) {
  const { mode } = useViewMode();
  
  if (!call || !dashboardId) {
    return [];
  }
  
  const template = DashboardTemplates[dashboardId];
  if (!template) {
    return [];
  }
  
  return template.map(widgetKey => WidgetRegistry[widgetKey](call, mode));
}