/**
 * Handles all /api/* routes (e.g. /api/submit, /api/health) via the shared Worker module.
 * Single catch-all avoids file-level routing edge cases under /api/.
 */
import worker from "../../workers/worker.js";

export async function onRequest(context) {
  return worker.fetch(context.request, context.env, context);
}
