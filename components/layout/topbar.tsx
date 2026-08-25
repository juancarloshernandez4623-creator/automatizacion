export function Topbar({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
