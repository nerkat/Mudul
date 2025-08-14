export type ViewMode = "rich" | "paper";
const KEY = "mudul:viewMode";

export function getInitialViewMode(): ViewMode {
  const q = new URLSearchParams(window.location.search).get("mode");
  if (q === "paper") return "paper";
  const saved = localStorage.getItem(KEY);
  return (saved === "paper" || saved === "rich") ? (saved as ViewMode) : "rich";
}

export function saveViewMode(m: ViewMode) { 
  localStorage.setItem(KEY, m);
  // Update URL to keep query param and toggle in sync
  const url = new URL(window.location.href);
  if (m === "paper") {
    url.searchParams.set("mode", "paper");
  } else {
    url.searchParams.delete("mode");
  }
  window.history.replaceState({}, "", url.toString());
}