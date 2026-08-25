/**
 * Version del Graph API de Meta usada por toda la integracion de WhatsApp
 * Cloud API. Centralizada aqui para que una futura migracion de version sea
 * un cambio de una sola linea.
 *
 * v25.0 es la version vigente al momento de escribir este proyecto (Meta
 * libera una nueva version cada ~3 meses y mantiene cada una ~2 anios).
 * Antes de desplegar a produccion, confirma en
 * https://developers.facebook.com/docs/graph-api/changelog que v25.0 siga
 * siendo la recomendada.
 */
export const GRAPH_API_VERSION = "v25.0";

export const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
