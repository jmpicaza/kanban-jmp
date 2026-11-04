// Acceso a los datos guardados en el servidor local (server/server.py).
import { STORAGE_KEY } from "../constants.js";
import { migrate } from "../lib/tasks.js";

const url = (key) => `/api/kv/${encodeURIComponent(key)}`;

/**
 * Tareas guardadas, o `null` si todavía no hay datos.
 * Lanza un error si el servidor no responde: así no se confunde «sin datos» con «sin servidor».
 * @returns {Promise<import("../lib/types.js").Task[] | null>}
 */
export async function loadTasks() {
  const r = await fetch(url(STORAGE_KEY), { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`No se pudo leer (${r.status})`);
  const { value } = await r.json();
  return JSON.parse(value).map(migrate);
}

/** @param {import("../lib/types.js").Task[]} tasks */
export async function saveTasks(tasks) {
  const r = await fetch(url(STORAGE_KEY), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: JSON.stringify(tasks) }),
  });
  if (!r.ok) throw new Error(`No se pudo guardar (${r.status})`);
}
