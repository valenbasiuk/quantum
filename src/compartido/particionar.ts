/**
 * Divide una colección en dos grupos preservando el orden original:
 * [los que cumplen el predicado, los que no]. El predicado se evalúa una sola vez
 * por elemento y en orden, lo que permite usarlo para intentos secuenciales
 * (por ejemplo, asignar memoria en orden de registro).
 */
// TODO: Esta funcion nos va a servir clave para separar los procesos que logran entrar a memoria de los que quedan en espera
export function particionar<T>(elementos: readonly T[], predicado: (elemento: T) => boolean): [T[], T[]] {
  return elementos.reduce<[T[], T[]]>(
    (grupos, elemento) => {
      grupos[Number(!predicado(elemento))].push(elemento);
      return grupos;
    },
    [[], []],
  );
}

