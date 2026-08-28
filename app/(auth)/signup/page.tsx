import { SignupForm } from "./signup-form";
import { Logo } from "@/components/brand/logo";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-4 py-12">
      <Logo size="lg" />

      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">Crea tu cuenta</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Necesitas un código de acceso — te lo habrá dado quien te invitó a la plataforma.
        </p>

        <SignupForm defaultCode={code} />
      </div>
    </main>
  );
}
