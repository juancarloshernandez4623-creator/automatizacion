import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "supabase/.branches/**"],
  },
  {
    rules: {
      // El proyecto prohibe `any` salvo excepciones explicitamente comentadas
      // en el codigo; se deja como warning (no error) para no romper el
      // build en integraciones de terceros con tipos imperfectos.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
