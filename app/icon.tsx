import { ImageResponse } from "next/og";

// Favicon generado en build-time por convencion de Next.js (archivo
// `icon.tsx` en `app/`) -- se sirve automaticamente como `<link rel="icon">`.
// Reproduce el simbolo de la marca (ver components/brand/logo.tsx: mismo
// trazado exacto, aportado por el cliente). Color plano (sin
// `linearGradient`) a proposito: este archivo se renderiza con Satori
// (motor de `next/og`), no en un navegador real, y a 32px el degradado no
// se aprecia -- asi se evita cualquier duda sobre soporte de gradientes en
// ese motor.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const MAIN_STROKE_PATH =
  "M 125,60 C 75,60 40,88 40,128 C 40,168 85,172 135,145 L 225,90 C 275,60 295,80 295,110 C 295,138 275,150 240,150";
const INNER_STROKE_PATH = "M 95,130 C 130,130 170,105 210,80 C 235,65 255,60 270,72";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF6EC",
          borderRadius: 7,
        }}
      >
        <svg width="24" height="15" viewBox="0 0 320 200">
          <g fill="none" stroke="#B8863A" strokeWidth={11} strokeLinecap="round">
            <path d={MAIN_STROKE_PATH} />
            <path d={INNER_STROKE_PATH} />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
