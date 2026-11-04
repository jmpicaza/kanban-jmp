/** Minúsculas y sin acentos: para comparar claves y valores de forma tolerante. */
export const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
