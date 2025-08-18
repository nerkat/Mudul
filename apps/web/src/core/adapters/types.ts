// src/core/adapters/types.ts
import type { SalesCallMinimal } from '../types';

export type AdapterCtx = {
  mode: "rich" | "paper";
  tokens?: any; // optional: pass design tokens if needed
};

export interface WidgetAdapter<P = any, R = any> {
  slug: string;                           // widget slug
  project: (call: SalesCallMinimal, params?: P, ctx?: AdapterCtx) => R; // shape data
}

export type AdapterMap = Record<string, WidgetAdapter<any, any>>;