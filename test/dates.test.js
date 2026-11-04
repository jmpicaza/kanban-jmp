import test from "node:test";
import assert from "node:assert/strict";
import { todayISO, isoOf, daysBetween, fmtDateFull, logStamp, monthCells, dueInfo } from "../src/lib/dates.js";

test("todayISO usa la hora local", () => {
  assert.equal(todayISO(new Date(2026, 10, 3, 23, 59)), "2026-11-03");
});

test("isoOf, daysBetween, fmtDateFull, logStamp", () => {
  assert.equal(isoOf(2026, 10, 3), "2026-11-03");
  assert.equal(daysBetween("2026-10-29", "2026-11-04"), 6);
  assert.equal(daysBetween("2026-11-04", "2026-10-29"), -6);
  assert.equal(fmtDateFull("2026-11-06"), "6 nov 2026");
  assert.equal(logStamp("2026-10-29"), "29-oct-2026");
});

test("monthCells: la semana empieza en lunes", () => {
  // 1-nov-2026 es domingo: seis huecos antes del día 1.
  const nov = monthCells(2026, 10);
  assert.equal(nov.filter((c) => c === null).length, 6);
  assert.equal(nov.length, 6 + 30);
  // 1-dic-2026 es martes: un hueco.
  assert.equal(monthCells(2026, 11).filter((c) => c === null).length, 1);
  // 1-jun-2026 es lunes: ningún hueco.
  assert.equal(monthCells(2026, 5)[0], 1);
});

test("dueInfo: tonos según los días que faltan", () => {
  const t = (due, col = "week") => ({ due, col });
  assert.equal(dueInfo({ due: "", col: "week" }, "2026-11-03"), null);
  assert.equal(dueInfo(t("2026-11-01"), "2026-11-03").tone, "late");
  assert.equal(dueInfo(t("2026-11-03"), "2026-11-03").tone, "soon");
  assert.equal(dueInfo(t("2026-11-06"), "2026-11-03").tone, "soon");
  assert.equal(dueInfo(t("2026-11-07"), "2026-11-03").tone, "");
  assert.equal(dueInfo(t("2026-10-01", "done"), "2026-11-03").tone, "ok");
  assert.match(dueInfo(t("2026-11-01"), "2026-11-03").text, /vencida hace 2 d/);
});
