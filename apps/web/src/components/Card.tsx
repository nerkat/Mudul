export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;
  return (
    <div
      className={`bg-surface border-border shadow-sm rounded-lg border p-4 ${className}`}
      {...rest}
    />
  );
}