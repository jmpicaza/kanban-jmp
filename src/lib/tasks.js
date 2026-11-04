// Crear, convertir y reordenar tareas. Funciones puras, sin React.
import { NEW_KEY, SCOPE_NAMES } from "../constants.js";
import { DATE_RE } from "./dates.js";
import { norm } from "./text.js";

/** Identificador corto único para tareas nuevas. */
export const uid = () => "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** @returns {import("./types.js").Task} */
export const blank = () => ({ id: uid(), col: "backlog", title: "", due: "", notes: "", attrs: {} });

// Datos guardados con la estructura anterior (campos fijos) -> atributos
export const migrate = (t) => {
  if (t && t.attrs) return { id: t.id || uid(), col: t.col || "backlog", title: t.title || "", due: t.due || "", notes: t.notes || "", attrs: t.attrs };
  const a = {};
  const put = (k, v) => { if (v !== undefined && v !== null && String(v).trim() !== "") a[k] = String(v).trim(); };
  put("ámbito", SCOPE_NAMES[norm(t.scope || "ws8")] || t.scope);
  put("responsable", t.owner); put("apoyo", t.support); put("entregable", t.deliverable);
  put("fuente", t.source); put("bloqueo", t.blockedReason);
  put("prioridad", t.prio === "seg" ? "seguimiento" : t.prio);
  put("estado", t.confirmed ? "confirmado" : "por confirmar");
  return { id: t.id || uid(), col: t.col || "backlog", title: t.title || "", due: t.due || "", notes: t.notes || "", attrs: a };
};


/** Tarea de ejemplo con la que arranca un tablero vacío. @type {import("./types.js").Task[]} */
export const SEED = [
  {
    id: "ejemplo", col: "week",
    title: "Tarea de ejemplo: haz clic en este título para editarla",
    due: "2026-11-06",
    notes: "Prueba: arrástrala, cambia sus atributos, añade uno nuevo o elimínala.",
    attrs: { "ámbito": "WS8", responsable: "(TBD)", prioridad: "alta", estado: "por confirmar", entregable: "Aquí va lo que debe quedar hecho", fuente: "Ejemplo" },
  },
];


/**
 * Mueve una tarea a una columna: antes o después de otra, o al final si no hay destino.
 * El orden de las tarjetas en una columna es el orden del array. No modifica `tasks`.
 * @param {import("./types.js").Task[]} tasks
 * @param {string} id
 * @param {string} colId
 * @param {import("./types.js").DropTarget | null} target
 */
export function placeTask(tasks, id, colId, target) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return tasks;
  if (target && target.id === id) return tasks;
  const moved = { ...t, col: colId };
  const rest = tasks.filter((x) => x.id !== id);
  if (target) {
    const i = rest.findIndex((x) => x.id === target.id);
    if (i >= 0) {
      rest.splice(target.after ? i + 1 : i, 0, moved);
      return rest;
    }
  }
  return [...rest, moved];
}

/** Clave efectiva de una fila del editor de atributos. */
export const rowKey = (r) => (r.sel === NEW_KEY ? r.custom : r.sel).trim().toLowerCase();

/** @param {import("./types.js").Attrs} attrs @returns {import("./types.js").AttrRow[]} */
export const rowsFromAttrs = (attrs) => Object.entries(attrs || {}).map(([k, v]) => ({ sel: k, custom: "", value: v }));

/** Filas del editor → atributos. Se descartan las filas sin clave o sin valor. */
export function attrsFromRows(rows) {
  const attrs = {};
  rows.forEach((r) => {
    const k = rowKey(r).replace(/=/g, "-");
    const v = r.value.trim();
    if (k && v) attrs[k] = v;
  });
  return attrs;
}

/**
 * «Pegar lista»: una tarea por línea con el formato `tarea | responsable | AAAA-MM-DD`.
 * @param {string} text
 * @param {{ key: string, value: string } | null} [defaultAttr]  Atributo que se añade a todas.
 */
export function tasksFromBulk(text, defaultAttr = null) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      const t = blank();
      t.title = parts[0];
      if (defaultAttr) t.attrs[defaultAttr.key] = defaultAttr.value;
      if (parts[1]) t.attrs.responsable = parts[1];
      if (parts[2] && DATE_RE.test(parts[2])) t.due = parts[2];
      else if (parts[2]) t.notes = "Fecha no reconocida: " + parts[2];
      return t;
    });
}
