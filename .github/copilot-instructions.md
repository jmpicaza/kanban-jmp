# Instrucciones para Copilot

Tablero kanban personal (React sin framework, esbuild, servidor Python con solo librería estándar).

## Estructura y reglas
- `src/lib/`: lógica pura (datos, atributos, CSV, fechas, resumen). **Sin React ni acceso al navegador.**
  Toda lógica nueva va aquí y lleva su prueba en `test/` (node:test).
- `src/hooks/`: estado y efectos (`useTasks` guarda en el servidor, `useFilter` calcula el filtro).
- `src/components/`: interfaz. Los componentes reciben datos y funciones por props; el estado de un
  diálogo vive dentro del propio diálogo. `App.jsx` solo conecta piezas.
- `src/api/storage.js`: único sitio que habla con el servidor. No usar `localStorage`.
- `src/styles.css`: todos los estilos, con variables CSS y modo oscuro. Clases propias, sin librerías.
- `server/server.py`: solo librería estándar; API `GET/PUT /api/kv/<clave>`, datos en `data/` (fuera de git).

## Modelo de datos
Tarea = `{ id, col, title, due, notes, attrs }`. `attrs` son pares clave-valor libres, claves en minúsculas.
Claves con significado: `prioridad` (alta | media | seguimiento) y `bloqueo`. El orden de las tarjetas
en una columna es el orden del array. El CSV tiene las columnas `id, columna, titulo, fecha, atributos, notas`.

## Convenciones
- Interfaz y comentarios en español. Fechas AAAA-MM-DD; la semana empieza en lunes.
- No añadir dependencias salvo necesidad clara. Mantener los componentes pequeños.
- Después de cambiar algo: `npm test` y `npm run build`. `public/app.js` y `public/app.css` se versionan
  (así el tablero funciona sin Node).
