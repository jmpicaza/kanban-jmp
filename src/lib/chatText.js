// «Texto para el chat»: todo el tablero en texto legible, con el id de cada tarea.
import { COLS } from "../constants.js";
import { attrsToStr } from "./attrs.js";

/**
 * @param {import("./types.js").Task[]} tasks
 * @param {string} today  AAAA-MM-DD
 */
export function toChatText(tasks, today) {
  const lines = [`Tablero WS8 · exportado el ${today}`, ""];
  COLS.forEach((c) => {
    const items = tasks.filter((t) => t.col === c.id);
    lines.push(`## ${c.name} (${items.length})`);
    if (!items.length) lines.push("(vacío)");
    items.forEach((t) => {
      lines.push(`- ${t.title} · fecha: ${t.due || "(TBD)"} · id: ${t.id}`);
      const a = attrsToStr(t.attrs);
      if (a) lines.push("    atributos: " + a);
      if (t.notes && t.notes.includes("\n")) {
        lines.push("    notas:");
        t.notes.split("\n").forEach((l) => lines.push("      " + l));
      } else if (t.notes) lines.push("    notas: " + t.notes);
    });
    lines.push("");
  });
  return lines.join("\n");
}
