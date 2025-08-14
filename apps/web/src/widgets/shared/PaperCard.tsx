export function PaperCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '8px', marginBottom: '8px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
      {children}
    </div>
  );
}