import { useMemo, useRef, useState } from "react";
import { toChatText } from "../lib/chatText.js";
import { toCSV } from "../lib/csv.js";
import { copyText, selectAll } from "../utils/clipboard.js";
import Modal from "./Modal.jsx";

/** Exportar el tablero: CSV (copia de seguridad restaurable) o texto para pegar en el chat. */
export default function ExportDialog({ tasks, today, onClose }) {
  const [mode, setMode] = useState("csv");
  const [copied, setCopied] = useState(false);
  const area = useRef(null);
  const csv = useMemo(() => toCSV(tasks), [tasks]);
  const chat = useMemo(() => toChatText(tasks, today), [tasks, today]);
  const shown = mode === "csv" ? csv : chat;

  const copy = async () => {
    if (await copyText(shown)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      selectAll(area.current);
    }
  };

  return (
    <Modal label="Exportar tablero" onClose={onClose}>
      <h2>Exportar tablero</h2>
      <div className="scopes" role="group" aria-label="Formato">
        <button className="scope" aria-pressed={mode === "csv"} onClick={() => setMode("csv")}>CSV (copia de seguridad)</button>
        <button className="scope" aria-pressed={mode === "text"} onClick={() => setMode("text")}>Texto para el chat</button>
      </div>
      <p className="hint">
        {mode === "csv"
          ? "Copia este texto y guárdalo en un archivo .csv o en un Excel. Sirve para restaurar con «Importar»."
          : "Pégalo en el chat para que te ayude a priorizar. Lleva el id de cada tarea. No sirve para restaurar."}
      </p>
      <textarea id="kb-export" ref={area} className="inp" readOnly rows={14} style={{ width: "100%", fontSize: 12 }} value={shown} />
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cerrar</button>
        <button className="btn primary" onClick={copy}>{copied ? "Copiado" : "Copiar texto"}</button>
      </div>
    </Modal>
  );
}
