/**
 * Logger estructurado (JSON, una linea por evento) para el webhook y otros
 * puntos criticos del servidor. En Vercel esto termina en los logs del
 * proyecto, filtrables por campo (wa_message_id, organization_id, etc).
 *
 * Deliberadamente simple (sin dependencia externa tipo pino/winston): un
 * `console.log`/`console.error` con un objeto ya es JSON estructurado
 * cuando el runtime de logs de la plataforma lo captura.
 */

type LogLevel = "info" | "warn" | "error";

export type LogFields = {
  event: string;
  organization_id?: string | null;
  wa_message_id?: string | null;
  latency_ms?: number;
  error?: string;
  [key: string]: unknown;
};

function write(level: LogLevel, fields: LogFields) {
  const payload = {
    level,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (fields: LogFields) => write("info", fields),
  warn: (fields: LogFields) => write("warn", fields),
  error: (fields: LogFields) => write("error", fields),
};
