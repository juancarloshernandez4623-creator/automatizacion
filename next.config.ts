import type { NextConfig } from "next";

// Nota: el webhook de WhatsApp (/app/api/webhooks/whatsapp/route.ts) declara
// explicitamente `export const runtime = 'nodejs'` porque necesita el modulo
// nativo `crypto` (HMAC-SHA256) para verificar `X-Hub-Signature-256`, algo que
// el runtime Edge no soporta. No fuerces aqui un runtime global: cada route
// handler decide el suyo.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
