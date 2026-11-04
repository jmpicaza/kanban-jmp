import { NEW_KEY } from "../constants.js";
import { rowKey } from "../lib/tasks.js";

/**
 * Editor de atributos clave-valor. En cada fila se elige una clave ya usada o, en la última
 * opción, «Añadir nuevo…». El valor se escribe libre, con sugerencias de los valores ya usados.
 * @param {{ rows: import("../lib/types.js").AttrRow[], onChange: (rows: import("../lib/types.js").AttrRow[]) => void,
 *   keys: string[], valuesFor: (key: string) => string[] }} props
 */
export default function AttributeRows({ rows, onChange, keys, valuesFor }) {
  const setRow = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const available = [...new Set([...keys, ...rows.map(rowKey).filter(Boolean)])];

  return (
    <>
      <div className="attrs-title">Atributos (clave y valor). Elige una clave existente o «Añadir nuevo…» al final de la lista.</div>
      {rows.map((r, i) => (
        <div className="attr-row" key={i}>
          <select aria-label="Clave" value={r.sel} onChange={(e) => setRow(i, { sel: e.target.value, custom: "" })}>
            <option value="">Elegir clave…</option>
            {[...new Set([...available, ...(r.sel && r.sel !== NEW_KEY ? [r.sel] : [])])].map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
            <option value={NEW_KEY}>➕ Añadir nuevo…</option>
          </select>
          {r.sel === NEW_KEY && (
            <input className="inp" aria-label="Nueva clave" placeholder="nueva clave" value={r.custom} onChange={(e) => setRow(i, { custom: e.target.value })} />
          )}
          <input className="inp val" aria-label="Valor" list={`dl-${i}`} placeholder="valor" value={r.value} onChange={(e) => setRow(i, { value: e.target.value })} />
          <datalist id={`dl-${i}`}>{valuesFor(rowKey(r)).map((v) => <option key={v} value={v} />)}</datalist>
          <button className="btn small" aria-label="Quitar atributo" onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <div style={{ marginBottom: 10 }}>
        <button className="btn small" onClick={() => onChange([...rows, { sel: "", custom: "", value: "" }])}>+ Añadir atributo</button>
      </div>
    </>
  );
}
