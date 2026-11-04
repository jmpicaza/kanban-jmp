// Fechas: todo se maneja como texto AAAA-MM-DD; la semana empieza en lunes.

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const DIAS_SEM = ["L", "M", "X", "J", "V", "S", "D"];

const pad = (n) => String(n).padStart(2, "0");

/** Fecha de hoy (hora local) como AAAA-MM-DD. */
export const todayISO = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/** AAAA-MM-DD a partir de año, mes (0-11) y día. */
export const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Días entre dos fechas AAAA-MM-DD (positivo si `to` es posterior). */
export const daysBetween = (from, to) => Math.round((new Date(to + "T00:00:00") - new Date(from + "T00:00:00")) / 86400000);

/** «6 nov». */
export const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });

/** «6 nov 2026». */
export const fmtDateFull = (iso) => `${Number(iso.slice(8))} ${MESES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/** Encabezado de una entrada de log: «29-oct-2026». */
export const logStamp = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}-${MESES[Number(m) - 1]}-${y}`;
};

/**
 * Celdas de un mes con la semana empezando en lunes: `null` para los huecos iniciales
 * y el número de día para el resto.
 * @param {number} year
 * @param {number} month 0-11
 * @returns {(number|null)[]}
 */
export function monthCells(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

/**
 * Texto y tono con el que se muestra la fecha límite en la tarjeta.
 * @returns {{ text: string, tone: "" | "ok" | "soon" | "late" } | null}
 */
export function dueInfo(task, today) {
  if (!task.due) return null;
  const n = daysBetween(today, task.due);
  if (task.col === "done") return { text: fmtDate(task.due), tone: "ok" };
  if (n < 0) return { text: `${fmtDate(task.due)} · vencida hace ${-n} d`, tone: "late" };
  if (n === 0) return { text: `${fmtDate(task.due)} · hoy`, tone: "soon" };
  if (n <= 3) return { text: `${fmtDate(task.due)} · en ${n} d`, tone: "soon" };
  return { text: `${fmtDate(task.due)} · en ${n} d`, tone: "" };
}
