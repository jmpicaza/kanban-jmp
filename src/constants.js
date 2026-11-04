// Constantes compartidas por la lógica y la interfaz.

export const STORAGE_KEY = "meridian-ws8-kanban-v2";

/** Marcador de «Añadir nuevo…» en el desplegable de claves de atributo. */
export const NEW_KEY = "__nuevo__";

export const COLS = [
  { id: "backlog", name: "Backlog" },
  { id: "week", name: "Esta semana" },
  { id: "doing", name: "En curso" },
  { id: "blocked", name: "Bloqueado" },
  { id: "done", name: "Hecho" },
];

export const PRIO_RANK = { alta: 0, media: 1, seg: 2 };
export const PRIO_NAME = { alta: "alta", media: "media", seg: "seguimiento" };

export const SCOPE_NAMES = { ws8: "WS8", meridian: "Meridian", accenture: "Accenture" };

/** Atajos del diálogo «Para Claude». */
export const ASK_CHIPS = [
  { label: "Plan", text: "Prepárame un plan paso a paso para hacer esta tarea: qué necesito, de quién y en qué orden." },
  { label: "Qué falta", text: "Dime qué falta o qué es ambiguo antes de empezar y qué preguntas haría." },
  { label: "Borrador", text: "Redáctame el mensaje o la ficha de reunión que necesito para avanzar con esta tarea." },
  { label: "Siguiente paso", text: "Lee el log y dime cuál es el siguiente paso y qué debo actualizar en la tarea." },
];
