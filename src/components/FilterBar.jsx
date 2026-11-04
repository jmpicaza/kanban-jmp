/** Filtro por clave de atributo: un selector de clave y un botón por cada valor. */
export default function FilterBar({ keys, activeKey, buttons, activeValue, openTotal, onKey, onValue }) {
  return (
    <div className="scopes" role="group" aria-label="Filtrar">
      {keys.length > 0 && (
        <>
          <label className="flabel" htmlFor="kb-fkey">Filtrar por</label>
          <select id="kb-fkey" className="keysel" value={activeKey || ""} onChange={(e) => onKey(e.target.value)}>
            <option value="">(ninguna clave)</option>
            {keys.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </>
      )}
      <button className="scope" aria-pressed={activeValue === null} onClick={() => onValue(null)}>
        All <span className="n">{openTotal}</span>
      </button>
      {buttons.map(([v, n]) => (
        <button key={v} className="scope" aria-pressed={activeValue === v} onClick={() => onValue(activeValue === v ? null : v)}>
          {v} <span className="n">{n}</span>
        </button>
      ))}
    </div>
  );
}
