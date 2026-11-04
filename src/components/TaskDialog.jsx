import { useEffect, useMemo, useRef, useState } from "react";
import { COLS } from "../constants.js";
import { logStamp } from "../lib/dates.js";
import { attrsFromRows, rowsFromAttrs } from "../lib/tasks.js";
import AttributeRows from "./AttributeRows.jsx";
import ClaudeBox from "./ClaudeBox.jsx";
import DatePicker from "./DatePicker.jsx";
import Modal from "./Modal.jsx";

/**
 * Diálogo para crear o editar una tarea. Trabaja con una copia (borrador): nada cambia
 * hasta pulsar «Guardar tarea».
 * @param {{ task: import("../lib/types.js").Task, isNew: boolean, keys: string[], valuesFor: (k: string) => string[],
 *   today: string, briefOpen?: boolean, briefManual?: boolean, onSave: (t: import("../lib/types.js").Task) => void,
 *   onDelete: (id: string) => void, onClose: () => void }} props
 */
export default function TaskDialog({ task, isNew, keys, valuesFor, today, briefOpen, briefManual, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState({ title: task.title, notes: task.notes, col: task.col, due: task.due });
  const [rows, setRows] = useState(() => rowsFromAttrs(task.attrs));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const notesRef = useRef(null);
  const [logTick, setLogTick] = useState(0); // sube cada vez que se añade una entrada de log
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const attrs = useMemo(() => attrsFromRows(rows), [rows]);
  const briefTask = useMemo(
    () => ({ id: task.id, col: draft.col, title: draft.title || "(sin título)", due: draft.due, notes: draft.notes, attrs }),
    [task.id, draft, attrs]
  );

  const save = () => {
    if (!draft.title.trim()) return;
    onSave({ id: task.id, col: draft.col, title: draft.title.trim(), due: draft.due, notes: draft.notes, attrs });
  };

  const addLogEntry = () => {
    const base = draft.notes.replace(/\s+$/, "");
    set("notes", (base ? base + "\n" : "") + logStamp(today) + ": ");
    setLogTick((n) => n + 1);
  };

  // Tras añadir la entrada, el cursor va al final de las notas (cuando el texto ya está dibujado).
  useEffect(() => {
    const ta = notesRef.current;
    if (logTick && ta) {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
      ta.scrollTop = ta.scrollHeight;
    }
  }, [logTick]);

  return (
    <Modal label="Editar tarea" onClose={onClose}>
      <h2>{isNew ? "Nueva tarea" : "Editar tarea"}</h2>
      <label className="field">Tarea
        <input value={draft.title} onChange={(e) => set("title", e.target.value)} autoFocus />
      </label>
      <label className="field">Notas: qué hay que hacer y log de la tarea
        <textarea
          id="kb-notes" ref={notesRef} rows={7} value={draft.notes} onChange={(e) => set("notes", e.target.value)}
          placeholder={"Qué hay que hacer…\n\n" + logStamp(today) + ": primera entrada del log"}
        />
      </label>
      <div style={{ marginTop: -4, marginBottom: 10 }}>
        <button className="btn small" onClick={addLogEntry}>+ Entrada con fecha de hoy</button>
      </div>
      <div className="row2">
        <label className="field">Columna
          <select value={draft.col} onChange={(e) => set("col", e.target.value)}>
            {COLS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="field">Fecha límite
          <DatePicker value={draft.due} onChange={(v) => set("due", v)} today={today} />
        </div>
      </div>

      <AttributeRows rows={rows} onChange={setRows} keys={keys} valuesFor={valuesFor} />
      <ClaudeBox task={briefTask} today={today} initialOpen={briefOpen} initialManual={briefManual} />

      <div className="modal-actions">
        <div>
          {!isNew && !confirmDelete && <button className="btn danger" onClick={() => setConfirmDelete(true)}>Eliminar</button>}
          {!isNew && confirmDelete && <button className="btn danger" onClick={() => onDelete(task.id)}>Sí, eliminar</button>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={save} disabled={!draft.title.trim()}>Guardar tarea</button>
        </div>
      </div>
    </Modal>
  );
}
