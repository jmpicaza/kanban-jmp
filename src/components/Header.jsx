import { fmtDate } from "../lib/dates.js";

export default function Header({ today, saveMsg, hideDone, onNew, onBulk, onExport, onImport, onSort, onToggleDone }) {
  return (
    <div className="kb-top">
      <div>
        <h1>Tablero personal Meridian</h1>
        <div className="kb-sub">Tablero personal. Hoy: {fmtDate(today)}.</div>
      </div>
      <div className="kb-actions">
        <button className="btn primary" onClick={onNew}>Nueva tarea</button>
        <button className="btn" onClick={onBulk}>Pegar lista</button>
        <button className="btn" onClick={onExport}>Exportar</button>
        <button className="btn" onClick={onImport}>Importar</button>
        <button className="btn" onClick={onSort} title="Reordena todas las columnas: prioridad alta primero y luego fecha">
          Ordenar por prioridad y fecha
        </button>
        <button className="btn" aria-pressed={hideDone} onClick={onToggleDone}>
          {hideDone ? "Mostrar hechas" : "Ocultar hechas"}
        </button>
        <span className="saved" aria-live="polite">{saveMsg}</span>
      </div>
    </div>
  );
}
