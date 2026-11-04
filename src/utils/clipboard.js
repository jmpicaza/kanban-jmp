/** Copia texto al portapapeles. Devuelve false si el navegador no lo permite. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Enfoca y selecciona el contenido de un campo, para copiar a mano con Ctrl+C. */
export function selectAll(el) {
  if (el) {
    el.focus();
    el.select();
  }
}
