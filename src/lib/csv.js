// CSV: exportar, importar (añadir, reemplazar, actualizar por id) y leer columnas de versiones anteriores.
// Columnas: id, columna, titulo, fecha, atributos, notas. Los atributos van en una sola celda: clave=valor; clave=valor.
import { SCOPE_NAMES } from "../constants.js";
import { attrsToStr, strToAttrs } from "./attrs.js";
import { DATE_RE } from "./dates.js";
import { norm } from "./text.js";
import { uid } from "./tasks.js";

export const YES = ["si", "true", "1", "yes", "x"];
export const COL_MAP = { backlog: "backlog", "esta semana": "week", week: "week", "en curso": "doing", doing: "doing", bloqueado: "blocked", blocked: "blocked", hecho: "done", done: "done" };
export const LEGACY = { ambito: "ámbito", responsable: "responsable", apoyo: "apoyo", entregable: "entregable", fuente: "fuente", motivo_bloqueo: "bloqueo", prioridad: "prioridad" };
export const CSV_COLS = ["id", "columna", "titulo", "fecha", "atributos", "notas"];
export const csvCell = (v) => {
  const x = v === undefined || v === null ? "" : String(v);
  return /[",;\n\r\t]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x;
};


export const toCSV = (tasks) => {
  const rows = tasks.map((t) => [t.id, t.col, t.title, t.due, attrsToStr(t.attrs), t.notes]);
  return [CSV_COLS, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
};
export const parseCSV = (text) => {
  const clean = text.replace(/^\uFEFF/, "");
  const first = clean.split(/\r?\n/)[0] || "";
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let q = false;
  for (const ch of first) {
    if (ch === '"') q = !q;
    else if (!q && counts[ch] !== undefined) counts[ch]++;
  }
  const delim = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const rows = [];
  let row = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQ) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
};


// atributos de una fila: columna «atributos» más las columnas de la versión anterior (si vienen)
export const rowAttrs = (get) => {
  const a = strToAttrs(get("atributos"));
  Object.entries(LEGACY).forEach(([h, k]) => {
    let v = get(h);
    if (!v) return;
    if (h === "ambito") v = SCOPE_NAMES[norm(v)] || v;
    if (h === "prioridad") { const n = norm(v); v = n === "seg" ? "seguimiento" : n; }
    a[k] = v;
  });
  const c = get("confirmada");
  if (c) a.estado = YES.includes(norm(c)) ? "confirmado" : "por confirmar";
  return a;
};
export const csvReader = (text) => {
  const rows = parseCSV(text);
  if (rows.length < 2) return { error: "No encuentro filas. Pega la cabecera y al menos una fila." };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const has = (n) => head.indexOf(n) >= 0;
  const getter = (r) => (n) => (has(n) ? (r[head.indexOf(n)] || "").trim() : "");
  return { rows: rows.slice(1), has, getter };
};

// Añadir / Reemplazar: cada fila con «titulo» es una tarjeta
export const tasksFromCSV = (text) => {
  const rd = csvReader(text);
  if (rd.error) return rd;
  if (!rd.has("titulo")) return { error: "Falta la columna «titulo» en la primera fila." };
  let skipped = 0;
  const out = [];
  rd.rows.forEach((r) => {
    const get = rd.getter(r);
    const title = get("titulo");
    if (!title) { skipped++; return; }
    const d = get("fecha");
    out.push({
      id: get("id") || uid(),
      col: COL_MAP[norm(get("columna"))] || "backlog",
      title, due: DATE_RE.test(d) ? d : "", notes: get("notas"), attrs: rowAttrs(get),
    });
  });
  if (!out.length) return { error: "Ninguna fila tiene título." };
  return { tasks: out, skipped };
};

// Actualizar: id existente = cambia solo lo que venga (celda vacía = sin cambio);
// la celda «atributos» REEMPLAZA todos los atributos de la tarjeta.
// Fila con id nuevo o vacío y con titulo = tarjeta nueva.
export const applyCSVUpdate = (text, current) => {
  const rd = csvReader(text);
  if (rd.error) return rd;
  if (!rd.has("id") && !rd.has("titulo")) return { error: "Hace falta la columna «id» (para cambiar tarjetas) o «titulo» (para añadirlas)." };
  const next = current.map((t) => ({ ...t, attrs: { ...t.attrs } }));
  const byId = new Map(next.map((t) => [t.id, t]));
  let upd = 0, add = 0, skipped = 0;
  const warn = [];
  rd.rows.forEach((r) => {
    const get = rd.getter(r);
    const id = get("id");
    const t = id ? byId.get(id) : null;
    const a = rowAttrs(get);
    if (t) {
      if (get("titulo")) t.title = get("titulo");
      if (get("notas")) t.notes = get("notas");
      const d = get("fecha");
      if (d) { if (DATE_RE.test(d)) t.due = d; else warn.push(`fecha no válida en ${id}`); }
      const c = get("columna");
      if (c) { if (COL_MAP[norm(c)]) t.col = COL_MAP[norm(c)]; else warn.push(`columna no válida en ${id}`); }
      if (get("atributos")) t.attrs = a;
      else if (Object.keys(a).length) t.attrs = { ...t.attrs, ...a };
      upd++;
    } else {
      const title = get("titulo");
      if (!title) { skipped++; warn.push(id ? `id no encontrado y sin titulo: ${id}` : "fila sin id ni titulo"); return; }
      const d = get("fecha");
      const n = {
        id: id || uid(), col: COL_MAP[norm(get("columna"))] || "backlog",
        title, due: DATE_RE.test(d) ? d : "", notes: get("notas"), attrs: a,
      };
      next.push(n); byId.set(n.id, n); add++;
    }
  });
  return { tasks: next, upd, add, skipped, warn };
};

