import type { ISimulador } from '../src/index.js';

// avanza n ticks
export function avanzar(simulador: ISimulador, ticks: number): void {
  Array.from({ length: ticks }).forEach(() => simulador.avanzarTick());
}

// avanza n ticks y devuelve, para cada uno, que proceso consumio cpu
// (el que bajo su cpu restante) o '-' si la cpu estuvo ociosa
export function secuenciaDeEjecucion(simulador: ISimulador, ticks: number): string[] {
  return Array.from({ length: ticks }).map(() => {
    const antes = new Map(simulador.procesos().map((p) => [p.pid, p.cpuRestante]));
    simulador.avanzarTick();
    const ejecutado = simulador.procesos().find((p) => p.cpuRestante < (antes.get(p.pid) ?? 0));
    return ejecutado?.pid ?? '-';
  });
}

// invariantes del mapa de memoria: contiguo, ordenado, sin tamano 0 y sin libres adyacentes
export function verificarInvariantesMemoria(simulador: ISimulador, memoriaTotal: number): void {
  const mapa = simulador.estado().mapaMemoria;
  const errores: string[] = [];
  mapa.forEach((bloque, i) => {
    const esperado = i === 0 ? 0 : mapa[i - 1].fin;
    if (bloque.inicio !== esperado) errores.push(`bloque ${i} no es contiguo`);
    if (bloque.tamano <= 0) errores.push(`bloque ${i} con tamaño ${bloque.tamano}`);
    if (i > 0 && bloque.libre && mapa[i - 1].libre) errores.push(`libres adyacentes en ${i}`);
  });
  const total = mapa.reduce((s, b) => s + b.tamano, 0);
  if (total !== memoriaTotal) errores.push(`suma ${total} != ${memoriaTotal}`);
  if (errores.length > 0) throw new Error(errores.join('; '));
}
