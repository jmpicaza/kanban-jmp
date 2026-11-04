import test from "node:test";
import assert from "node:assert/strict";
import { toCSV, parseCSV, tasksFromCSV, applyCSVUpdate } from "../src/lib/csv.js";

const sample = () => [
  { id: "a1", col: "week", title: 'Con, coma y "comillas"', due: "2026-11-06", notes: "línea1\nlínea2", attrs: { "ámbito": "WS8", responsable: "Ana; Luis", prioridad: "alta" } },
  { id: "a2", col: "done", title: "Otra", due: "", notes: "", attrs: {} },
];

test("CSV: exportar e importar da las mismas tareas", () => {
  const r = tasksFromCSV(toCSV(sample()));
  assert.deepEqual(r.tasks, sample());
});

test("parseCSV detecta coma, punto y coma y tabulador", () => {
  assert.deepEqual(parseCSV("a,b\n1,2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseCSV("a;b\n1;2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseCSV("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
});

test("parseCSV: celdas entrecomilladas con saltos de línea y comillas dobles", () => {
  assert.deepEqual(parseCSV('a,b\n"x\ny","he dicho ""hola"""'), [["a", "b"], ["x\ny", 'he dicho "hola"']]);
});

test("tasksFromCSV: requiere titulo y salta filas sin título", () => {
  assert.match(tasksFromCSV("id,columna\na,backlog").error, /titulo/);
  const r = tasksFromCSV("titulo,columna\nUna,hecho\n,backlog");
  assert.equal(r.tasks.length, 1);
  assert.equal(r.skipped, 1);
  assert.equal(r.tasks[0].col, "done");
  assert.match(tasksFromCSV("titulo").error, /No encuentro filas/);
});

test("tasksFromCSV: lee las columnas de la versión anterior como atributos", () => {
  const csv = "id,ambito,columna,titulo,responsable,fecha,prioridad,confirmada\nx,ws8,esta semana,Tarea,Ana,2026-11-06,seg,si";
  const t = tasksFromCSV(csv).tasks[0];
  assert.equal(t.col, "week");
  assert.deepEqual(t.attrs, { "ámbito": "WS8", responsable: "Ana", prioridad: "seguimiento", estado: "confirmado" });
});

test("actualizar: cambia solo lo que viene; celda vacía = sin cambio", () => {
  const cur = sample();
  const r = applyCSVUpdate("id,titulo,columna,fecha\na1,,hecho,", cur);
  const a1 = r.tasks.find((t) => t.id === "a1");
  assert.equal(a1.col, "done");
  assert.equal(a1.title, cur[0].title);
  assert.equal(a1.due, "2026-11-06");
  assert.deepEqual(a1.attrs, cur[0].attrs);
  assert.deepEqual([r.upd, r.add, r.skipped], [1, 0, 0]);
});

test("actualizar: la celda atributos reemplaza todos los atributos", () => {
  const r = applyCSVUpdate("id,atributos\na1,responsable=Marta; prioridad=alta", sample());
  assert.deepEqual(r.tasks[0].attrs, { responsable: "Marta", prioridad: "alta" });
});

test("actualizar: añade filas nuevas, avisa y no muta la entrada", () => {
  const cur = sample();
  const before = JSON.stringify(cur);
  const r = applyCSVUpdate("id,titulo,columna,fecha,atributos\n,Nueva,backlog,,ámbito=Accenture\nzzz,,done,,\na2,,rara,31/12,", cur);
  assert.equal(r.add, 1);
  assert.equal(r.skipped, 1);
  assert.equal(r.upd, 1);
  assert.equal(r.tasks.at(-1).attrs["ámbito"], "Accenture");
  assert.ok(r.warn.some((w) => /id no encontrado/.test(w)));
  assert.ok(r.warn.some((w) => /columna no válida en a2/.test(w)));
  assert.ok(r.warn.some((w) => /fecha no válida en a2/.test(w)));
  assert.equal(JSON.stringify(cur), before);
});

test("actualizar: error si no hay columna id ni titulo", () => {
  assert.match(applyCSVUpdate("columna\nhecho", sample()).error, /id|titulo/);
});

test("actualizar: acepta punto y coma (Excel en español)", () => {
  const r = applyCSVUpdate("id;columna\na1;en curso", sample());
  assert.equal(r.tasks[0].col, "doing");
});
