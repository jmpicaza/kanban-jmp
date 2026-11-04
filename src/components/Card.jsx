import { useEffect, useRef, useState } from "react";
import { getAttr, prioOf } from "../lib/attrs.js";
import { buildBrief } from "../lib/brief.js";
import { dueInfo } from "../lib/dates.js";
import { norm } from "../lib/text.js";
import { copyText } from "../utils/clipboard.js";

/**
 * Tarjeta de una tarea. El botón «Claude» copia el resumen de un clic; si el navegador
 * no deja copiar, avisa con `onCopyFailed` para abrir la tarjeta con el texto a mano.
 */
export default function Card({ task, today, dropMark, dragHandlers, onEdit, onCopyFailed }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const prio = prioOf(task);
  const due = dueInfo(task, today);
  const chips = Object.entries(task.attrs).filter(([k]) => {
    const n = norm(k);
    return n !== "prioridad" && !(n === "bloqueo" && task.col === "blocked");
  });

  const copyBrief = async () => {
    if (await copyText(buildBrief(task, today, ""))) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } else {
      onCopyFailed(task);
    }
  };

  return (
    <article className={"card " + prio + (dropMark ? " drop-" + dropMark : "")} draggable {...dragHandlers}>
      <div className="card-head">
        <button className="card-title" onClick={() => onEdit(task)}>{task.title}</button>
        <button
          className="claude-btn"
          onClick={copyBrief}
          title="Copia un resumen de esta tarea para pegarlo en el chat con Claude"
          aria-label={`Copiar resumen para Claude: ${task.title}`}
        >
          {copied ? "Copiado" : "Claude"}
        </button>
      </div>
      {task.notes && <div className="notes" onClick={() => onEdit(task)}>{task.notes}</div>}
      <div className="meta">
        {prio === "alta" && <span className="tag alta">Alta</span>}
        {prio === "seg" && <span className="tag">Seguimiento</span>}
        {chips.map(([k, v]) => <span key={k} className="tag">{k}: {v}</span>)}
      </div>
      {due && <div className="meta"><span className={"due " + due.tone}>{due.text}</span></div>}
      {task.col === "blocked" && (
        <div className="reason">{getAttr(task, "bloqueo") || "Falta el atributo «bloqueo»: motivo y quién lo desbloquea."}</div>
      )}
    </article>
  );
}
