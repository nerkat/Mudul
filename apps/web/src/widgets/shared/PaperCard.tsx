export function PaperCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface text-fg border border-border rounded p-2 mb-2 font-mono">
      <div className="font-bold mb-1">{title}</div>
      <div className="font-mono">
        {children}
      </div>
    </div>
  );
}