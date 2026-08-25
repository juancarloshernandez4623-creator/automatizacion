import type { DailyActivityPoint } from "@/lib/dashboard/queries";

function shortDayLabel(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function ConversationsChart({ data }: { data: DailyActivityPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.conversationCount));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-neutral-900">
        Conversaciones activas por día
      </h2>
      <div className="flex h-40 items-end gap-1.5">
        {data.map((point) => (
          <div key={point.date} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-32 w-full items-end">
              <div
                className="w-full rounded-t-sm bg-brand-500 transition-all"
                style={{
                  height: `${Math.max(4, (point.conversationCount / max) * 100)}%`,
                }}
                title={`${point.conversationCount} conversaciones`}
              />
            </div>
            <span className="text-[10px] text-neutral-400">{shortDayLabel(point.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
