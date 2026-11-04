import { useMemo, useRef, useState } from "react";
import { ASK_CHIPS } from "../constants.js";
import { buildBrief } from "../lib/brief.js";
import { copyText, selectAll } from "../utils/clipboard.js";

/** Sección desplegable del diálogo de la tarea: resumen para Claude con una petición opcional. */
export default function ClaudeBox({ task, today, initialOpen = false, initialManual = false }) {
  const [open, setOpen] = useState(initialOpen);
  const [ask, setAsk] = useState("");
  const [copied, setCopied] = useState(initialManual ? "manual" : "");
  const area = useRef(null);
  const text = useMemo(() => buildBrief(task, today, ask), [task, today, ask]);

  const copy = async () => {
    if (await copyText(text)) {
      setCopied("ok");
      setTimeout(() => setCopied(""), 2000);
    } else {
      selectAll(area.current);
      setCopied("manual");
    }
  };

  return (
    <details className="claudebox" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Para Claude: resumen de esta tarea</summary>
      <label className="field">¿Qué necesitas de Claude? (opcional)
        <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Ej.: prepárame la agenda de la reunión" />
      </label>
      <div className="chips" role="group" aria-label="Peticiones rápidas">
        {ASK_CHIPS.map((c) => (
          <button key={c.label} className="scope" onClick={() => setAsk(c.text)}>{c.label}</button>
        ))}
      </div>
      <textarea id="kb-brief" ref={area} className="inp" readOnly rows={7} style={{ width: "100%", fontSize: 12 }} value={text} />
      {copied === "manual" && <p className="hint" style={{ marginTop: 6 }}>No se pudo copiar solo: el texto está seleccionado, pulsa Ctrl+C.</p>}
      <div style={{ marginTop: 8 }}>
        <button className="btn small" onClick={copy}>{copied === "ok" ? "Copiado" : "Copiar para Claude"}</button>
      </div>
    </details>
  );
}
