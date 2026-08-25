import { Robot, User, Headset } from "@phosphor-icons/react/dist/ssr";

export type MessageBubbleData = {
  id: string;
  content: string | null;
  direction: "inbound" | "outbound";
  sender: "contact" | "bot" | "human";
  createdAt: string;
};

const senderMeta: Record<
  MessageBubbleData["sender"],
  { label: string; icon: typeof Robot }
> = {
  contact: { label: "Cliente", icon: User },
  bot: { label: "Agente IA", icon: Robot },
  human: { label: "Tú", icon: Headset },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: { message: MessageBubbleData }) {
  const isInbound = message.direction === "inbound";
  const meta = senderMeta[message.sender];
  const Icon = meta.icon;

  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
      <div className={`flex max-w-[75%] flex-col gap-1 ${isInbound ? "items-start" : "items-end"}`}>
        <div className="flex items-center gap-1.5 px-1 text-[11px] text-neutral-400">
          <Icon size={12} />
          <span>{meta.label}</span>
          <span>·</span>
          <span>{formatTime(message.createdAt)}</span>
        </div>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
            isInbound
              ? "rounded-bl-sm bg-neutral-100 text-neutral-900"
              : message.sender === "human"
                ? "rounded-br-sm bg-brand-600 text-white"
                : "rounded-br-sm bg-brand-500 text-white"
          }`}
        >
          {message.content || <span className="italic opacity-70">(mensaje sin texto)</span>}
        </div>
      </div>
    </div>
  );
}
