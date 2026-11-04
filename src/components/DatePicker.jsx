import { useState } from "react";
import { DATE_RE, DIAS_SEM, fmtDateFull, isoOf, MESES_LARGO, monthCells } from "../lib/dates.js";

/** Selector de fecha propio: la semana empieza en lunes, sin depender del navegador. */
export default function DatePicker({ value, onChange, today }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: 2026, m: 0 });

  const toggle = () => {
    if (!open) {
      const base = new Date((value && DATE_RE.test(value) ? value : today) + "T00:00:00");
      setView({ y: base.getFullYear(), m: base.getMonth() });
    }
    setOpen(!open);
  };
  const go = (delta) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const pick = (v) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="dp">
      <button type="button" className="inp dp-btn" onClick={toggle} aria-haspopup="dialog" aria-expanded={open} aria-label="Fecha límite">
        {value && DATE_RE.test(value) ? fmtDateFull(value) : "Sin fecha"}
      </button>
      {open && (
        <>
          <div className="dp-back" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="dp-pop" role="dialog" aria-label="Elegir fecha" onClick={(e) => e.stopPropagation()}>
            <div className="dp-nav">
              <button type="button" className="btn small" onClick={() => go(-1)} aria-label="Mes anterior">‹</button>
              <strong>{MESES_LARGO[view.m]} {view.y}</strong>
              <button type="button" className="btn small" onClick={() => go(1)} aria-label="Mes siguiente">›</button>
            </div>
            <div className="dp-grid">
              {DIAS_SEM.map((d) => <div key={d} className="dp-wd">{d}</div>)}
              {monthCells(view.y, view.m).map((d, i) =>
                d === null ? (
                  <div key={"b" + i} />
                ) : (
                  <button
                    type="button"
                    key={d}
                    className={"dp-day" + (isoOf(view.y, view.m, d) === value ? " sel" : "") + (isoOf(view.y, view.m, d) === today ? " today" : "")}
                    onClick={() => pick(isoOf(view.y, view.m, d))}
                  >
                    {d}
                  </button>
                )
              )}
            </div>
            <div className="dp-foot">
              <button type="button" className="btn small" onClick={() => pick(today)}>Hoy</button>
              <button type="button" className="btn small" onClick={() => pick("")}>Quitar fecha</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
