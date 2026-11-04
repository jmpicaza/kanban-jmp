// Atributos clave-valor de las tareas: lectura, orden y conversión a texto.
import { PRIO_RANK } from "../constants.js";
import { norm } from "./text.js";

/** Valor de un atributo por nombre, sin distinguir mayúsculas ni acentos. "" si no existe. */
export const getAttr = (t, name) => {
  const k = Object.keys(t.attrs || {}).find((x) => norm(x) === norm(name));
  return k ? t.attrs[k] : "";
};
export const prioOf = (t) => {
  const v = norm(getAttr(t, "prioridad"));
  if (v === "alta") return "alta";
  if (v === "seguimiento" || v === "seg") return "seg";
  return "media";
};
export const sortTasks = (a, b) => {
  const p = PRIO_RANK[prioOf(a)] - PRIO_RANK[prioOf(b)];
  if (p) return p;
  if (a.due && b.due) return a.due.localeCompare(b.due);
  if (a.due) return -1;
  if (b.due) return 1;
  return 0;
};


// atributos <-> texto "clave=valor; clave=valor" (con \; y \\ como escapes)
export const escAttr = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;");
export const attrsToStr = (attrs) =>
  Object.entries(attrs || {})
    .filter(([k, v]) => k && String(v).trim() !== "")
    .map(([k, v]) => `${escAttr(String(k).replace(/=/g, "-"))}=${escAttr(v)}`)
    .join("; ");
export const strToAttrs = (str) => {
  const out = {};
  let key = "", val = "", inVal = false, escaped = false;
  const flush = () => {
    const k = key.trim().toLowerCase();
    if (k && val.trim() !== "") out[k] = val.trim();
    key = ""; val = ""; inVal = false;
  };
  for (const ch of String(str || "")) {
    if (escaped) { if (inVal) val += ch; else key += ch; escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === ";") { flush(); continue; }
    if (ch === "=" && !inVal) { inVal = true; continue; }
    if (inVal) val += ch; else key += ch;
  }
  flush();
  return out;
};


/**
 * Claves usadas en el conjunto de tareas, de más a menos frecuentes.
 * @param {import("./types.js").Task[]} tasks
 */
export function countKeys(tasks) {
  const m = new Map();
  tasks.forEach((t) => Object.keys(t.attrs || {}).forEach((k) => m.set(k, (m.get(k) || 0) + 1)));
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
}

/**
 * Valores de una clave con su número de tareas, de más a menos frecuentes.
 * @param {import("./types.js").Task[]} tasks
 * @param {string} key
 * @param {{ openOnly?: boolean }} [opts]  Con `openOnly`, no cuenta las tareas de la columna Hecho.
 * @returns {[string, number][]}
 */
export function countValues(tasks, key, { openOnly = false } = {}) {
  if (!key) return [];
  const m = new Map();
  tasks
    .filter((t) => !openOnly || t.col !== "done")
    .forEach((t) => {
      const v = t.attrs && t.attrs[key];
      if (v) m.set(v, (m.get(v) || 0) + 1);
    });
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
