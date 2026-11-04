import { useState } from "react";

/** Botón de «borrar todo» con confirmación. */
export default function ResetBar({ onReset }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {!confirm ? (
        <button className="btn small danger" onClick={() => setConfirm(true)}>Borrar todo y dejar la tarea de ejemplo</button>
      ) : (
        <>
          <span className="kb-sub">Esto borra todas tus tareas. Exporta antes si quieres conservar una copia.</span>
          <button className="btn small danger" onClick={() => { onReset(); setConfirm(false); }}>Sí, borrar todo</button>
          <button className="btn small" onClick={() => setConfirm(false)}>Cancelar</button>
        </>
      )}
    </div>
  );
}
