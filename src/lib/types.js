// Solo tipos (JSDoc) para que el editor ayude con el autocompletado. No genera código.

/**
 * Atributos clave-valor libres de una tarea. Las claves van en minúsculas.
 * Claves con significado especial: `prioridad` (alta | media | seguimiento) y `bloqueo`.
 * @typedef {Record<string, string>} Attrs
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {"backlog"|"week"|"doing"|"blocked"|"done"} col  Columna del tablero.
 * @property {string} title
 * @property {string} due     Fecha límite AAAA-MM-DD, o "" si no hay.
 * @property {string} notes   Descripción y log de la tarea (texto libre, varias líneas).
 * @property {Attrs} attrs
 */

/**
 * Fila del editor de atributos. Si `sel` es NEW_KEY, la clave es `custom`.
 * @typedef {Object} AttrRow
 * @property {string} sel
 * @property {string} custom
 * @property {string} value
 */

/** Destino de un arrastre: antes o después de otra tarjeta.
 * @typedef {{ id: string, after: boolean }} DropTarget
 */

export {};
