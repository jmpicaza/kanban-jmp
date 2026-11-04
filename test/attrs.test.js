import test from "node:test";
import assert from "node:assert/strict";
import { attrsToStr, strToAttrs, getAttr, prioOf, sortTasks, countKeys, countValues } from "../src/lib/attrs.js";

test("atributos: ida y vuelta con ; = \\ y acentos", () => {
  const attrs = { "ámbito": "WS8", responsable: "Ana; Luis", nota: "a=b \\ c", estado: "por confirmar" };
  assert.deepEqual(strToAttrs(attrsToStr(attrs)), attrs);
});

test("atributos: ignora valores vacíos y claves sin nombre", () => {
  assert.equal(attrsToStr({ a: "x", b: "", c: "  " }), "a=x");
  assert.deepEqual(strToAttrs("a=1; ; =sin clave; b="), { a: "1" });
});

test("getAttr no distingue mayúsculas ni acentos", () => {
  const t = { attrs: { "Ámbito": "WS8" } };
  assert.equal(getAttr(t, "ambito"), "WS8");
  assert.equal(getAttr(t, "otra"), "");
});

test("prioOf: alta, seguimiento y media por defecto", () => {
  assert.equal(prioOf({ attrs: { prioridad: "Alta" } }), "alta");
  assert.equal(prioOf({ attrs: { prioridad: "seguimiento" } }), "seg");
  assert.equal(prioOf({ attrs: { prioridad: "seg" } }), "seg");
  assert.equal(prioOf({ attrs: {} }), "media");
  assert.equal(prioOf({ attrs: { prioridad: "rara" } }), "media");
});

test("sortTasks: prioridad, luego fecha, sin fecha al final", () => {
  const t = (id, prioridad, due = "") => ({ id, due, attrs: prioridad ? { prioridad } : {} });
  const sorted = [t("a", "seguimiento"), t("b", "media"), t("c", "alta", "2026-12-01"), t("d", "alta", "2026-11-01"), t("e", "alta")].sort(sortTasks);
  assert.deepEqual(sorted.map((x) => x.id), ["d", "c", "e", "b", "a"]);
});

test("countKeys ordena por frecuencia y luego alfabéticamente", () => {
  const tasks = [{ attrs: { b: "1", a: "1" } }, { attrs: { b: "2" } }, { attrs: { c: "1" } }];
  assert.deepEqual(countKeys(tasks), ["b", "a", "c"]);
});

test("countValues: cuenta por clave y puede ignorar las hechas", () => {
  const tasks = [
    { col: "week", attrs: { tema: "x" } },
    { col: "done", attrs: { tema: "x" } },
    { col: "week", attrs: { tema: "y" } },
  ];
  assert.deepEqual(countValues(tasks, "tema"), [["x", 2], ["y", 1]]);
  assert.deepEqual(countValues(tasks, "tema", { openOnly: true }), [["x", 1], ["y", 1]]);
  assert.deepEqual(countValues(tasks, ""), []);
});
