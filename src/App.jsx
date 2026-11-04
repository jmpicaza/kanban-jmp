import { useState } from "react";
import BulkDialog from "./components/BulkDialog.jsx";
import Board from "./components/Board.jsx";
import ExportDialog from "./components/ExportDialog.jsx";
import FilterBar from "./components/FilterBar.jsx";
import Header from "./components/Header.jsx";
import ImportDialog from "./components/ImportDialog.jsx";
import ResetBar from "./components/ResetBar.jsx";
import TaskDialog from "./components/TaskDialog.jsx";
import { useFilter } from "./hooks/useFilter.js";
import { useTasks } from "./hooks/useTasks.js";
import { countValues } from "./lib/attrs.js";
import { todayISO } from "./lib/dates.js";
import { blank, tasksFromBulk } from "./lib/tasks.js";

/**
 * Pantalla principal. Aquí solo se conectan las piezas:
 *  - useTasks: datos y guardado; useFilter: filtro por atributo.
 *  - `dialog`: qué ventana está abierta (tarea, pegar lista, exportar, importar) o null.
 */
export default function App() {
  const store = useTasks();
  const filter = useFilter(store.tasks);
  const [dialog, setDialog] = useState(null);
  const today = todayISO();
  const close = () => setDialog(null);

  if (store.status === "loading") {
    return <div className="kb"><p className="kb-sub">Cargando tablero…</p></div>;
  }
  if (store.status === "error") {
    return (
      <div className="kb">
        <h1>Tablero personal WS8</h1>
        <p className="kb-sub">No se pudieron leer los datos. ¿Está en marcha el servidor (server/server.py)? Recarga la página cuando lo esté.</p>
      </div>
    );
  }

  const openNew = () => {
    const t = blank();
    if (filter.defaultAttr) t.attrs[filter.defaultAttr.key] = filter.defaultAttr.value;
    setDialog({ kind: "task", task: t, isNew: true });
  };
  const openEdit = (task) => setDialog({ kind: "task", task, isNew: false });
  const valuesFor = (key) => countValues(store.tasks, key).map(([v]) => v);

  return (
    <div className="kb">
      <Header
        today={today}
        saveMsg={store.saveMsg}
        hideDone={filter.hideDone}
        onNew={openNew}
        onBulk={() => setDialog({ kind: "bulk" })}
        onExport={() => setDialog({ kind: "export" })}
        onImport={() => setDialog({ kind: "import" })}
        onSort={store.sortAuto}
        onToggleDone={filter.toggleHideDone}
      />
      <FilterBar
        keys={filter.keys}
        activeKey={filter.activeKey}
        buttons={filter.valueButtons}
        activeValue={filter.activeValue}
        openTotal={filter.openTotal}
        onKey={filter.chooseKey}
        onValue={filter.chooseValue}
      />
      <Board
        tasks={filter.visible}
        today={today}
        onPlace={store.place}
        onEdit={openEdit}
        onCopyFailed={(task) => setDialog({ kind: "task", task, isNew: false, briefOpen: true, briefManual: true })}
      />
      <ResetBar onReset={() => { store.reset(); filter.clearValue(); }} />

      {dialog?.kind === "task" && (
        <TaskDialog
          key={dialog.task.id}
          task={dialog.task}
          isNew={dialog.isNew}
          keys={filter.keys}
          valuesFor={valuesFor}
          today={today}
          briefOpen={dialog.briefOpen}
          briefManual={dialog.briefManual}
          onSave={(t) => { store.save(t, dialog.isNew); close(); }}
          onDelete={(id) => { store.remove(id); close(); }}
          onClose={close}
        />
      )}
      {dialog?.kind === "bulk" && (
        <BulkDialog onAdd={(text) => { store.append(tasksFromBulk(text, filter.defaultAttr)); close(); }} onClose={close} />
      )}
      {dialog?.kind === "export" && <ExportDialog tasks={store.tasks} today={today} onClose={close} />}
      {dialog?.kind === "import" && (
        <ImportDialog tasks={store.tasks} onReplaceAll={store.replaceAll} onAppend={store.append} onClose={close} />
      )}
    </div>
  );
}
