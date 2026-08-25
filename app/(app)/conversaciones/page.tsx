import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr";

export default function ConversacionesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-neutral-400">
      <ChatCircleDots size={40} weight="light" />
      <p className="max-w-xs text-sm">
        Selecciona una conversación de la lista para ver los mensajes y responder.
      </p>
    </div>
  );
}
