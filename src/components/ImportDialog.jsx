import { useState } from "react";
import { applyCSVUpdate, tasksFromCSV } from "../lib/csv.js";
import { uid } from "../lib/tasks.js";
import Modal from "./Modal.jsx";

const HINTS = {
  update: "Cambia las tarjetas cuyo id ya existe (celda vacía = sin cambio; la celda «atributos» reemplaza todos sus atributos) y añade las filas nuevas. Necesita la columna «id» o «titulo».",
  add: "Añade todas las filas como tarjetas nuevas, sin tocar las que ya hay. Solo «titulo» es obligatoria.",
  replace: "Sustituye todo el tablero por el contenido del CSV. Solo «titulo» es obligatoria.",
};

/**
 * Importar desde CSV en tres modos. «Actualizar» deja el diálogo abierto con el resumen
 * (actualizadas, añadidas, ignoradas); los otros dos lo cierran.
 */
export default function ImportDialog({ tasks, onReplaceAll, onAppend, onClose }) {
  const [mode, setMode] = useState("update");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const run = () => {
    setInfo("");
    if (mode === "update") {
      const res = applyCSVUpdate(text, tasks);
      if (res.error) return setError(res.error);
      setError("");
      setInfo(
        `Actualizadas ${res.upd}, añadidas ${res.add}, ignoradas ${res.skipped}.` +
          (res.warn.length ? " Avisos: " + res.warn.join("; ") + "." : "")
      );
      setText("");
      return onReplaceAll(res.tasks);
    }
    const res = tasksFromCSV(text);
    if (res.error) return setError(res.error);
    if (mode === "replace") onReplaceAll(res.tasks);
    else {
      const have = new Set(tasks.map((t) => t.id));
      onAppend(res.tasks.map((t) => (have.has(t.id) ? { ...t, id: uid() } : t)));
    }
    onClose();
  };

  const modeButton = (id, label) => (
    <button className="scope" aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>
  );

  return (
    <Modal label="Importar tareas" onClose={onClose}>
      <h2>Importar tareas desde CSV</h2>
      <div className="scopes" role="group" aria-label="Modo de importación">
        {modeButton("update", "Actualizar por id")}
        {modeButton("add", "Añadir")}
        {modeButton("replace", "Reemplazar todo")}
      </div>
      <p className="hint">{HINTS[mode]} Atributos: clave=valor; clave=valor. Funciona con comas, punto y coma o lo copiado desde Excel.</p>
      <textarea
        className="inp" rows={10} style={{ width: "100%", fontSize: 12 }} value={text}
        onChange={(e) => { setText(e.target.value); setError(""); }}
        placeholder={"id,titulo,columna,fecha,atributos\nejemplo,,done,2026-11-02,\n,Mi tarea nueva,backlog,2026-11-10,ámbito=WS8; responsable=Ana"}
      />
      {error && <p className="hint" style={{ color: "var(--late)" }}>{error}</p>}
      {info && <p className="hint" style={{ color: "var(--ok)" }}>{info}</p>}
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cerrar</button>
        <button className="btn primary" onClick={run} disabled={!text.trim()}>Importar tareas</button>
      </div>
    </Modal>
  );
}
