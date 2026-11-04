import test from "node:test";
import assert from "node:assert/strict";
import { NEW_KEY } from "../src/constants.js";
import { migrate, placeTask, attrsFromRows, rowKey, rowsFromAttrs, tasksFromBulk, SEED, uid } from "../src/lib/tasks.js";

const T = (id, col = "backlog") => ({ id, col, title: id, due: "", notes: "", attrs: {} });
const order = (tasks, col) => tasks.filter((t) => t.col === col).map((t) => t.id);

test("uid genera ids distintos", () => {
  assert.notEqual(uid(), uid());
});

test("migrate: estructura antigua de campos fijos pasa a atributos", () => {
  const m = migrate({
    id: "s1", scope: "meridian", col: "backlog", title: "X", deliverable: "E", owner: "Ana", support: "",
    due: "2026-11-01", prio: "seg", confirmed: false, source: "F", blockedReason: "", notes: "n",
  });
  assert.equal(m.attrs["ámbito"], "Meridian");
  assert.equal(m.attrs.prioridad, "seguimiento");
  assert.equal(m.attrs.estado, "por confirmar");
  assert.equal(m.attrs.responsable, "Ana");
  assert.ok(!("apoyo" in m.attrs));
  assert.equal(m.notes, "n");
});

test("migrate: una tarea ya con atributos no cambia", () => {
  const t = { id: "a", col: "week", title: "t", due: "", notes: "", attrs: { x: "1" } };
  assert.deepEqual(migrate(t), t);
});

test("SEED es una tarea válida", () => {
  assert.equal(SEED.length, 1);
  assert.ok(SEED[0].title && SEED[0].attrs.prioridad);
});

test("placeTask: antes, después, al final, a otra columna", () => {
  const base = [T("a"), T("b"), T("c"), T("d", "week")];
  assert.deepEqual(order(placeTask(base, "c", "backlog", { id: "a", after: false }), "backlog"), ["c", "a", "b"]);
  assert.deepEqual(order(placeTask(base, "a", "backlog", { id: "b", after: true }), "backlog"), ["b", "a", "c"]);
  assert.deepEqual(order(placeTask(base, "a", "backlog", null), "backlog"), ["b", "c", "a"]);
  const moved = placeTask(base, "b", "week", { id: "d", after: false });
  assert.deepEqual(order(moved, "week"), ["b", "d"]);
  assert.deepEqual(order(moved, "backlog"), ["a", "c"]);
});

test("placeTask: soltar sobre sí misma o con id inexistente no cambia nada", () => {
  const base = [T("a"), T("b")];
  assert.equal(placeTask(base, "a", "backlog", { id: "a", after: true }), base);
  assert.equal(placeTask(base, "zzz", "done", null), base);
  assert.deepEqual(placeTask(base, "a", "done", { id: "no-existe", after: false }).map((t) => t.id), ["b", "a"]);
});

test("placeTask no modifica el array original", () => {
  const base = [T("a"), T("b")];
  const copy = JSON.stringify(base);
  placeTask(base, "a", "done", null);
  assert.equal(JSON.stringify(base), copy);
});

test("filas de atributos: clave nueva, vacías y '=' en la clave", () => {
  const rows = [
    { sel: "responsable", custom: "", value: " Ana " },
    { sel: NEW_KEY, custom: "Reunión", value: "WS8 14-oct" },
    { sel: "", custom: "", value: "sin clave" },
    { sel: "tema", custom: "", value: "   " },
    { sel: NEW_KEY, custom: "a=b", value: "x" },
  ];
  assert.equal(rowKey(rows[1]), "reunión");
  assert.deepEqual(attrsFromRows(rows), { responsable: "Ana", "reunión": "WS8 14-oct", "a-b": "x" });
  assert.deepEqual(rowsFromAttrs({ a: "1" }), [{ sel: "a", custom: "", value: "1" }]);
});

test("tasksFromBulk: responsable, fecha, fecha rara y atributo por defecto", () => {
  const list = tasksFromBulk("Tarea uno | Ana | 2026-11-05\nTarea dos | | 5/11\n\nSolo título", { key: "ámbito", value: "WS8" });
  assert.equal(list.length, 3);
  assert.equal(list[0].attrs.responsable, "Ana");
  assert.equal(list[0].due, "2026-11-05");
  assert.equal(list[1].due, "");
  assert.match(list[1].notes, /Fecha no reconocida: 5\/11/);
  assert.equal(list[2].attrs["ámbito"], "WS8");
  assert.equal(list[2].col, "backlog");
});
