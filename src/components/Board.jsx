import { useState } from "react";
import { COLS } from "../constants.js";
import Card from "./Card.jsx";
import Column from "./Column.jsx";

/**
 * Tablero con arrastrar y soltar (HTML5). Arrastrar sobre una tarjeta la coloca antes o después
 * según la mitad; soltar en el hueco de una columna la deja al final.
 */
export default function Board({ tasks, today, onPlace, onEdit, onCopyFailed }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const endDrag = () => {
    setDragId(null);
    setOverCol(null);
    setDropTarget(null);
  };

  const cardHandlers = (task) => ({
    onDragStart: () => setDragId(task.id),
    onDragOver: (e) => {
      if (!dragId || dragId === task.id) return;
      const r = e.currentTarget.getBoundingClientRect();
      const after = e.clientY > r.top + r.height / 2;
      setDropTarget((d) => (d && d.id === task.id && d.after === after ? d : { id: task.id, after }));
    },
    onDragEnd: endDrag,
  });

  return (
    <div className="board">
      {COLS.map((col) => {
        const items = tasks.filter((t) => t.col === col.id);
        return (
          <Column
            key={col.id}
            col={col}
            count={items.length}
            isOver={overCol === col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.id);
              if (!e.target.closest(".card")) setDropTarget(null);
            }}
            onDragLeave={() => setOverCol((o) => (o === col.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) onPlace(dragId, col.id, dropTarget);
              endDrag();
            }}
          >
            {items.map((t) => (
              <Card
                key={t.id}
                task={t}
                today={today}
                dropMark={dropTarget && dropTarget.id === t.id ? (dropTarget.after ? "after" : "before") : null}
                dragHandlers={cardHandlers(t)}
                onEdit={onEdit}
                onCopyFailed={onCopyFailed}
              />
            ))}
          </Column>
        );
      })}
    </div>
  );
}
