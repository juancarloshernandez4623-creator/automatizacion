"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncCalendarMonth } from "./actions";

/** Cada cuanto se vuelve a mirar Google Calendar con /citas abierta y visible. */
const SYNC_INTERVAL_MS = 60_000;

/**
 * Mantiene /citas al dia con los cambios hechos directamente en Google
 * Calendar desde otro dispositivo (cita movida de hora, borrada, renombrada)
 * sin tener que recargar: sincroniza cada minuto mientras la pestana esta
 * visible y en cuanto se vuelve a ella, y solo refresca la pagina si algo
 * cambio de verdad. La carga inicial ya la sincroniza el servidor
 * (page.tsx), por eso aqui no se lanza nada al montar.
 *
 * Se usa polling y no las notificaciones push de Google (events.watch)
 * porque estas exigen renovar el canal cada pocos dias con un cron y un
 * endpoint publico por negocio; para un panel que se consulta a ratos, un
 * minuto de retraso es mas que suficiente. No renderiza nada.
 */
export function CalendarAutoSync({ monthDate }: { monthDate: string }) {
  const router = useRouter();
  const inFlight = useRef(false);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    async function run() {
      if (inFlight.current || document.visibilityState !== "visible") return;
      inFlight.current = true;
      lastRun.current = Date.now();
      try {
        const { changed } = await syncCalendarMonth(monthDate);
        if (changed > 0) router.refresh();
      } catch {
        // Sesion caducada, red caida...: se reintenta en el siguiente ciclo.
      } finally {
        inFlight.current = false;
      }
    }

    const interval = window.setInterval(run, SYNC_INTERVAL_MS);

    // Al volver a la pestana (p. ej. tras mover la cita en el movil), no
    // esperar al siguiente tick -- salvo que acabe de sincronizar.
    function onVisible() {
      if (document.visibilityState === "visible" && Date.now() - lastRun.current > 5_000) {
        void run();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [monthDate, router]);

  return null;
}
