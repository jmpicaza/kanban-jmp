import { useMemo, useState } from "react";
import { countKeys, countValues } from "../lib/attrs.js";
import { norm } from "../lib/text.js";

/**
 * Filtro del tablero: se elige una clave de atributo (por defecto `ámbito`) y un valor.
 * Devuelve las tareas visibles y lo necesario para dibujar la barra de filtros.
 * @param {import("../lib/types.js").Task[]} tasks
 */
export function useFilter(tasks) {
  const [filterKey, setFilterKey] = useState(null); // null = clave por defecto
  const [filterValue, setFilterValue] = useState(null);
  const [hideDone, setHideDone] = useState(false);

  const keys = useMemo(() => countKeys(tasks), [tasks]);
  const defaultKey = keys.find((k) => norm(k) === "ambito") || null;
  const activeKey = filterKey === null ? defaultKey : keys.includes(filterKey) ? filterKey : null;

  const valueButtons = useMemo(
    () => (activeKey ? countValues(tasks, activeKey, { openOnly: true }) : []),
    [tasks, activeKey]
  );
  const activeValue = valueButtons.some(([v]) => v === filterValue) ? filterValue : null;

  const visible = useMemo(
    () =>
      tasks.filter(
        (t) => (!activeKey || !activeValue || t.attrs[activeKey] === activeValue) && !(hideDone && t.col === "done")
      ),
    [tasks, activeKey, activeValue, hideDone]
  );

  return {
    keys,
    activeKey,
    activeValue,
    valueButtons,
    visible,
    hideDone,
    openTotal: tasks.filter((t) => t.col !== "done").length,
    /** Atributo que heredan las tareas nuevas mientras hay un filtro activo. */
    defaultAttr: activeKey && activeValue ? { key: activeKey, value: activeValue } : null,
    chooseKey: (k) => {
      setFilterKey(k);
      setFilterValue(null);
    },
    chooseValue: (v) => setFilterValue(v),
    clearValue: () => setFilterValue(null),
    toggleHideDone: () => setHideDone((h) => !h),
  };
}
