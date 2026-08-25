import { Topbar } from "@/components/layout/topbar";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { WhatsAppForm } from "./whatsapp-form";
import { GoogleConnectButton } from "./google-connect-button";
import { CalendarPicker } from "./calendar-picker";

export default async function IntegracionesPage({
  searchParams,
}: {
  searchParams: Promise<{ googleConnected?: string; googleError?: string }>;
}) {
  const { supabase, organizationId } = await requireCurrentOrg();
  const params = await searchParams;

  const [{ data: whatsappConfig }, { data: googleConfig }] = await Promise.all([
    supabase
      .from("whatsapp_configs")
      .select("phone_number_id, waba_id, verify_token")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("google_calendar_configs")
      .select("calendar_id")
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  return (
    <div className="flex flex-col">
      <Topbar
        title="Integraciones"
        description="Conecta tu WhatsApp Business y tu Google Calendar."
      />

      <div className="mx-auto w-full max-w-3xl space-y-10 p-6">
        {params.googleConnected && (
          <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm text-brand-700">
            Google Calendar conectado correctamente.
          </p>
        )}
        {params.googleError && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {params.googleError}
          </p>
        )}

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">WhatsApp Business</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Datos de tu numero en WhatsApp Cloud API (Meta for Developers).
          </p>
          <div className="mt-5">
            <WhatsAppForm existingConfig={whatsappConfig ?? null} />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Google Calendar</h2>
          <p className="mt-1 text-sm text-neutral-500">
            El agente consulta este calendario para ofrecer horarios y crear las citas.
          </p>
          <div className="mt-5 space-y-4">
            <GoogleConnectButton connected={Boolean(googleConfig)} />
            {googleConfig && <CalendarPicker currentCalendarId={googleConfig.calendar_id} />}
          </div>
        </section>
      </div>
    </div>
  );
}
