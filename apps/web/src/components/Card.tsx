export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;
  return (
    <div
      className={`ui-surface ui-border shadow-sm rounded-lg border p-4 ${className}`}
      {...rest}
    />
  );
}