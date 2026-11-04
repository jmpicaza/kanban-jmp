# Tablero personal WS8

Kanban personal para seguir tareas. React sin framework, compilado con esbuild a `public/app.js`
y servido por un servidor Python de librería estándar. Los datos se guardan en `data/` (fuera de git).

## Estructura

```
src/
  main.jsx            arranque
  App.jsx             conecta hooks y componentes; decide qué diálogo está abierto
  constants.js        columnas, claves de almacenamiento, atajos de «Para Claude»
  styles.css          todos los estilos (variables CSS, modo oscuro)
  lib/                lógica pura, sin React (se prueba en test/)
    tasks.js          crear, migrar y reordenar tareas
    attrs.js          atributos clave-valor, prioridad, orden, recuentos
    csv.js            exportar / importar CSV (añadir, reemplazar, actualizar por id)
    dates.js          fechas, semana desde el lunes, vencimientos
    brief.js          resumen de una tarea para pegar en el chat con Claude
    chatText.js       «Texto para el chat» de todo el tablero
    types.js          tipos JSDoc (Task, Attrs…) para el autocompletado
  hooks/
    useTasks.js       carga, guardado automático y operaciones sobre las tareas
    useFilter.js      filtro por clave de atributo
  components/         interfaz (Board, Column, Card, TaskDialog, ImportDialog…)
  api/storage.js      único acceso al servidor
server/
  server.py           sirve public/ y guarda datos: GET/PUT /api/kv/<clave>
  test_server.py
test/                 pruebas de src/lib con node:test
e2e/smoke.py          prueba de extremo a extremo opcional (Playwright)
scripts/              build.mjs, dev.mjs, configuración de esbuild
public/               index.html + app.js + app.css compilados (se versionan)
install-service.sh    instala el servicio de systemd (WSL)
```

## Usar (sin Node)

```bash
python3 server/server.py        # http://localhost:8000   (otro puerto: ... server.py 8123)
```

## Desarrollar

Requiere Node 20 o superior.

```bash
npm install
npm run dev      # recompila al guardar y arranca el servidor; recarga el navegador para ver los cambios
npm run build    # genera public/app.js y public/app.css (súbelos con el commit)
npm test         # pruebas de lib/ (node) y del servidor (unittest)
npm run setup:e2e # opcional, una vez: crea .venv e instala Playwright (ver abajo)
npm run test:e2e  # opcional: prueba de extremo a extremo en un navegador real
```

### Prueba de extremo a extremo (opcional)

`e2e/smoke.py` abre el tablero en un navegador real, hace clic como una persona y comprueba el
resultado. Usa un servidor y datos temporales. Es lo único que necesita paquetes de Python
(Playwright); el tablero y el servidor funcionan sin instalar nada. Con pyenv:

```bash
pyenv versions                 # ver qué versiones hay
pyenv install 3.12             # solo si falta
pyenv local 3.12               # fija la versión en esta carpeta (.python-version)
npm run setup:e2e              # una vez: crea .venv e instala Playwright y Chromium
npm run test:e2e               # cuando quieras
```

A mano, sin npm: `python -m venv .venv`, `source .venv/bin/activate`, `pip install -r requirements-dev.txt`,
`playwright install chromium`, `python e2e/smoke.py` y `deactivate` al terminar.
Si Chromium pide librerías del sistema en WSL: `sudo .venv/bin/playwright install-deps chromium`.

Dónde tocar:

| Quiero… | Archivo |
|---|---|
| Cambiar columnas | `src/constants.js` (`COLS`) |
| Cambiar el formato del CSV o cómo se importa | `src/lib/csv.js` y su prueba |
| Cambiar el texto del resumen «Para Claude» | `src/lib/brief.js` y su prueba |
| Añadir un diálogo | nuevo componente en `src/components/` y una rama en `App.jsx` |
| Cambiar el aspecto | `src/styles.css` |
| Cambiar cómo se guardan los datos | `src/api/storage.js` y `server/server.py` |

## Datos y copias

- `data/meridian-ws8-kanban-v2.json`: todas las tareas. El `.bak` es la versión anterior.
- En la app, Exportar → CSV es la copia legible; Importar la restaura.
- Cambiar la carpeta de datos: `TABLERO_DATA=/ruta python3 server/server.py`.
- `data/` está en `.gitignore`. Revisa la política de tu organización antes de subir tareas de proyecto a GitHub.
- Si el servidor no responde al cargar, la app no muestra el tablero ni guarda nada, para no pisar tus datos.

## Servicio en WSL (systemd)

Paso 0, una sola vez: activar systemd.

```bash
sudo tee /etc/wsl.conf >/dev/null <<'CONF'
[boot]
systemd=true
CONF
```

Después, desde PowerShell: `wsl --shutdown`, y volver a abrir WSL.

```bash
./install-service.sh                       # instala y arranca (puerto 8000)
systemctl --user status tablero-ws8
journalctl --user -u tablero-ws8 -f        # logs
systemctl --user restart tablero-ws8       # tras actualizar
```

El servicio solo corre mientras la máquina virtual de WSL esté encendida.
