import { useState } from "react";
import Modal from "./Modal.jsx";

/** «Pegar lista»: una tarea por línea con el formato tarea | responsable | AAAA-MM-DD. */
export default function BulkDialog({ onAdd, onClose }) {
  const [text, setText] = useState("");
  return (
    <Modal label="Pegar lista de tareas" onClose={onClose}>
      <h2>Pegar lista de tareas</h2>
      <p className="hint">Una tarea por línea. Formato opcional: tarea | responsable | AAAA-MM-DD. Entran al Backlog; el responsable se guarda como atributo.</p>
      <textarea
        className="inp" rows={9} style={{ width: "100%" }} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={"Revisar blueprint de canales | Ana | 2026-11-05\nPreparar sesión con Finastra"}
      />
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={() => onAdd(text)} disabled={!text.trim()}>Añadir al Backlog</button>
      </div>
    </Modal>
  );
}
