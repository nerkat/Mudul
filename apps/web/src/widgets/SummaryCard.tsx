export function SummaryCard({ text }: { text?: string }) {
  if (!text) return <div className="rounded-xl border p-4 text-slate-500">No summary yet</div>;
  return (
    <div className="rounded-xl border p-4">
      <div className="font-medium">Summary</div>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </div>
  );
}