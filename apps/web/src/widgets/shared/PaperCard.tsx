export function PaperCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="paper-card" style={{ 
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'monospace',
      border: '1px solid #ccc', 
      padding: '8px', 
      marginBottom: '8px' 
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontFamily: 'monospace' }}>
        {children}
      </div>
    </div>
  );
}