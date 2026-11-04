/** Columna del tablero. Es solo presentación: el arrastre lo gestiona Board. */
export default function Column({ col, count, isOver, onDragOver, onDragLeave, onDrop, children }) {
  return (
    <section
      className={"colm" + (isOver ? " over" : "")}
      aria-label={col.name}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="colm-head"><span>{col.name}</span><span className="count">{count}</span></div>
      {count === 0 && <div className="empty">Sin tareas. Arrastra una aquí.</div>}
      {children}
    </section>
  );
}
