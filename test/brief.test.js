import test from "node:test";
import assert from "node:assert/strict";
import { buildBrief } from "../src/lib/brief.js";
import { toChatText } from "../src/lib/chatText.js";

const task = {
  id: "p03", col: "week", title: "Contactar a Plasencia", due: "2026-11-04",
  notes: "Pedir listado.\n29-oct-2026: llamada hecha.",
  attrs: { tema: "back office", prioridad: "alta" },
};

test("resumen para Claude: formato fijo y solo con datos de la tarea", () => {
  assert.equal(
    buildBrief(task, "2026-10-29", ""),
    [
      "Tarea [id: p03]: Contactar a Plasencia",
      "Columna: Esta semana · Prioridad: alta · Fecha: 2026-11-04 (en 6 d)",
      "Atributos: tema=back office; prioridad=alta",
      "",
      "Notas:",
      "Pedir listado.",
      "29-oct-2026: llamada hecha.",
    ].join("\n")
  );
});

test("resumen: la petición solo aparece si se escribe", () => {
  assert.ok(!buildBrief(task, "2026-10-29", "   ").includes("Petición"));
  assert.ok(buildBrief(task, "2026-10-29", " Hazme un plan ").endsWith("\nPetición: Hazme un plan"));
});

test("resumen: sin fecha, sin notas y sin atributos", () => {
  const s = buildBrief({ id: "x", col: "backlog", title: "T", due: "", notes: "", attrs: {} }, "2026-10-29", "");
  assert.match(s, /Fecha: \(TBD\)/);
  assert.match(s, /Atributos: \(ninguno\)/);
  assert.match(s, /Notas:\n\(vacío\)$/);
});

test("resumen: tarea vencida y de hoy", () => {
  assert.match(buildBrief({ ...task, due: "2026-10-27" }, "2026-10-29", ""), /\(vencida hace 2 d\)/);
  assert.match(buildBrief({ ...task, due: "2026-10-29" }, "2026-10-29", ""), /\(hoy\)/);
});

test("texto para el chat: columnas, ids, atributos y notas multilínea con sangría", () => {
  const out = toChatText([task, { id: "q", col: "backlog", title: "Sola", due: "", notes: "una línea", attrs: {} }], "2026-10-29");
  assert.match(out, /^Tablero WS8 · exportado el 2026-10-29/);
  assert.match(out, /## Backlog \(1\)\n- Sola · fecha: \(TBD\) · id: q\n    notas: una línea/);
  assert.match(out, /## Esta semana \(1\)\n- Contactar a Plasencia · fecha: 2026-11-04 · id: p03\n    atributos: tema=back office; prioridad=alta\n    notas:\n      Pedir listado\./);
  assert.match(out, /## Hecho \(0\)\n\(vacío\)/);
});
