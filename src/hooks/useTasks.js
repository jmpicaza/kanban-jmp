import { useCallback, useEffect, useRef, useState } from "react";
import { loadTasks, saveTasks } from "../api/storage.js";
import { sortTasks } from "../lib/attrs.js";
import { placeTask, SEED } from "../lib/tasks.js";

/**
 * Estado de las tareas: carga inicial, guardado automático y operaciones.
 * `status` es "loading", "ready" o "error". Si falla la lectura no se guarda nada,
 * para no pisar datos reales con el tablero de ejemplo.
 */
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("loading");
  const [saveMsg, setSaveMsg] = useState("");
  const loadedRef = useRef(null); // referencia de lo cargado: no se vuelve a guardar tal cual
  const chain = useRef(Promise.resolve()); // guardados en orden

  useEffect(() => {
    let alive = true;
    loadTasks()
      .then((saved) => {
        if (!alive) return;
        const initial = saved || SEED;
        loadedRef.current = initial;
        setTasks(initial);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || tasks === loadedRef.current) return;
    setSaveMsg("Guardando…");
    chain.current = chain.current
      .then(() => saveTasks(tasks))
      .then(() => setSaveMsg("Guardado"))
      .catch(() => setSaveMsg("No se pudo guardar"));
  }, [tasks, status]);

  const place = useCallback((id, colId, target) => setTasks((ts) => placeTask(ts, id, colId, target)), []);
  const save = useCallback(
    (task, isNew) => setTasks((ts) => (isNew ? [...ts, task] : ts.map((t) => (t.id === task.id ? task : t)))),
    []
  );
  const remove = useCallback((id) => setTasks((ts) => ts.filter((t) => t.id !== id)), []);
  const append = useCallback((list) => setTasks((ts) => [...ts, ...list]), []);
  const replaceAll = useCallback((list) => setTasks(list), []);
  const sortAuto = useCallback(() => setTasks((ts) => [...ts].sort(sortTasks)), []);
  const reset = useCallback(() => setTasks(SEED), []);

  return { tasks, status, saveMsg, place, save, remove, append, replaceAll, sortAuto, reset };
}
