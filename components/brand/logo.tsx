import { useId } from "react";

// Trazado exacto del logo original (aportado por el cliente como SVG
// fuente, viewBox nativo 320x200) -- dos trazos abiertos (no un compuesto
// relleno) con extremos redondeados, que es lo que crea el efecto de cinta
// entrelazada. Se reconstruye aqui en vez de incrustar el SVG tal cual para
// poder generar un id de degradado unico por instancia via `useId` (evita
// colisiones si el simbolo se renderiza mas de una vez en la misma pagina).
const MAIN_STROKE_PATH =
  "M 125,60 C 75,60 40,88 40,128 C 40,168 85,172 135,145 L 225,90 C 275,60 295,80 295,110 C 295,138 275,150 240,150";
const INNER_STROKE_PATH = "M 95,130 C 130,130 170,105 210,80 C 235,65 255,60 270,72";

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 200;
const ASPECT_RATIO = VIEWBOX_WIDTH / VIEWBOX_HEIGHT;

/**
 * Simbolo de la marca en solitario: la cinta dorada. `size` es la altura;
 * el ancho se deriva de la proporcion nativa del SVG fuente (320x200) para
 * no deformar el trazo.
 */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  const gradientId = useId();

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      width={size * ASPECT_RATIO}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* `gradientUnits="userSpaceOnUse"` + coordenadas del viewBox
            completo (en vez del 0%-100% relativo por defecto) para que el
            degradado sea uno solo continuo sobre todo el icono -- con el
            0%-100% de por defecto, cada <path> de abajo (son dos, ver
            comentario junto a MAIN_STROKE_PATH) estira el degradado sobre
            su propia caja por separado, y el trazo interior (mucho mas
            pequeño) sale con un tono distinto al principal en vez de la
            transicion suave del original. */}
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={VIEWBOX_WIDTH}
          y2={VIEWBOX_HEIGHT}
        >
          <stop offset="0%" stopColor="#D8BA6B" />
          <stop offset="40%" stopColor="#F1E3AD" />
          <stop offset="100%" stopColor="#9C792B" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gradientId})`} strokeWidth={11} strokeLinecap="round">
        <path d={MAIN_STROKE_PATH} />
        <path d={INNER_STROKE_PATH} />
      </g>
    </svg>
  );
}

const WORDMARK_TEXT_SIZE = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-3xl",
} as const;

const MARK_SIZE_BY_VARIANT = { sm: 28, md: 40, lg: 72 } as const;

/**
 * Marca completa (simbolo + "RECEPTA"): nombre en mayusculas, semi-negrita y
 * espaciado amplio entre letras, en un plateado claro que contrasta a
 * proposito con el dorado del simbolo. `WebkitTextStroke` (via `style`,
 * Tailwind v4 no trae utilidad para esto) le da un bordeado leve en un
 * plateado un punto mas oscuro que el relleno -- necesario ademas para que
 * el texto claro no se pierda sobre fondos blancos/muy claros (sidebar,
 * login).
 */
export function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof WORDMARK_TEXT_SIZE;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <LogoMark size={MARK_SIZE_BY_VARIANT[size]} />
      <span
        className={`${WORDMARK_TEXT_SIZE[size]} font-medium uppercase tracking-[0.35em] text-slate-400`}
        style={{ WebkitTextStroke: "0.4px #64748b" }}
      >
        Recepta
      </span>
    </div>
  );
}
