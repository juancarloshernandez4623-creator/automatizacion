import { ImageResponse } from "next/og";

// Icono para "añadir a pantalla de inicio" en iOS/Android (convencion
// `apple-icon.tsx` de Next.js) -- mismo simbolo y mismo criterio de color
// plano que app/icon.tsx (ver ese archivo), a mayor tamaño.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MAIN_STROKE_PATH =
  "M 125,60 C 75,60 40,88 40,128 C 40,168 85,172 135,145 L 225,90 C 275,60 295,80 295,110 C 295,138 275,150 240,150";
const INNER_STROKE_PATH = "M 95,130 C 130,130 170,105 210,80 C 235,65 255,60 270,72";

export default function AppleIcon() {
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
        }}
      >
        <svg width="130" height="81" viewBox="0 0 320 200">
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
