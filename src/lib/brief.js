// Resumen de una tarea para pegarlo en el chat con Claude. Plantilla fija, sin IA:
// solo usa los datos de la propia tarea.
import { COLS, PRIO_NAME } from "../constants.js";
import { attrsToStr, prioOf } from "./attrs.js";
import { DATE_RE } from "./dates.js";

/**
 * @param {import("./types.js").Task} t
 * @param {string} today  AAAA-MM-DD
 * @param {string} [ask]  Petición opcional; si viene vacía no se incluye.
 */
export const buildBrief = (t, today, ask) => {
  const colName = (id) => (COLS.find((c) => c.id === id) || { name: id }).name;
  let due = t.due || "(TBD)";
  if (t.due && DATE_RE.test(t.due)) {
    const n = Math.round((new Date(t.due + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
    due += n < 0 ? ` (vencida hace ${-n} d)` : n === 0 ? " (hoy)" : ` (en ${n} d)`;
  }
  const L = [];
  L.push(`Tarea [id: ${t.id}]: ${t.title}`);
  L.push(`Columna: ${colName(t.col)} · Prioridad: ${PRIO_NAME[prioOf(t)]} · Fecha: ${due}`);
  L.push(`Atributos: ${attrsToStr(t.attrs) || "(ninguno)"}`);
  L.push("");
  L.push("Notas:");
  L.push(t.notes && t.notes.trim() ? t.notes.trim() : "(vacío)");

  if (ask && ask.trim()) {
    L.push("");
    L.push("Petición: " + ask.trim());
  }
  return L.join("\n");
};
