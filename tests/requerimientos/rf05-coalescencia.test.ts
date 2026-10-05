import { describe, expect, it } from 'vitest';
import { AdministradorMemoria, PrimerAjuste, ProcesoInexistenteError } from '../../src/index.js';

/** 300 KB llenos con A [0-100), B [100-200), C [200-300). */
function memoriaLlena(): AdministradorMemoria {
  const memoria = new AdministradorMemoria(300, new PrimerAjuste());
  ['A', 'B', 'C'].forEach((pid) => memoria.asignar(pid, 100));
  return memoria;
}

const resumen = (memoria: AdministradorMemoria) =>
  memoria.mapa().map((b) => `${b.inicio}-${b.fin}:${b.pid ?? 'libre'}`);

describe('RF05 - Liberar memoria y coalescencia', () => {
  it('liberar sin vecinos libres deja un hueco aislado', () => {
    const memoria = memoriaLlena();
    memoria.liberar('B');
    expect(resumen(memoria)).toEqual(['0-100:A', '100-200:libre', '200-300:C']);
  });

  it('fusiona con el vecino izquierdo', () => {
    const memoria = memoriaLlena();
    memoria.liberar('A');
    memoria.liberar('B');
    expect(resumen(memoria)).toEqual(['0-200:libre', '200-300:C']);
  });

  it('fusiona con el vecino derecho', () => {
    const memoria = memoriaLlena();
    memoria.liberar('C');
    memoria.liberar('B');
    expect(resumen(memoria)).toEqual(['0-100:A', '100-300:libre']);
  });

  it('fusiona con ambos vecinos a la vez', () => {
    const memoria = memoriaLlena();
    memoria.liberar('A');
    memoria.liberar('C');
    memoria.liberar('B');
    expect(resumen(memoria)).toEqual(['0-300:libre']);
  });

  it('al liberar todo queda un único bloque libre del tamaño total', () => {
    const memoria = new AdministradorMemoria(1024, new PrimerAjuste());
    ['P1', 'P2', 'P3', 'P4'].forEach((pid, i) => memoria.asignar(pid, 100 * (i + 1)));
    ['P3', 'P1', 'P4', 'P2'].forEach((pid) => memoria.liberar(pid));
    expect(memoria.mapa()).toEqual([{ inicio: 0, tamano: 1024, fin: 1024, libre: true, pid: null }]);
  });

  it('no mueve bloques ocupados (no es compactación) y conserva el total', () => {
    const memoria = memoriaLlena();
    memoria.liberar('A');
    const ocupados = memoria.mapa().filter((b) => !b.libre);
    expect(ocupados.map((b) => [b.pid, b.inicio])).toEqual([
      ['B', 100],
      ['C', 200],
    ]);
    expect(memoria.mapa().reduce((s, b) => s + b.tamano, 0)).toBe(300);
  });

  it('liberar un PID sin memoria es un error', () => {
    expect(() => memoriaLlena().liberar('Z')).toThrow(ProcesoInexistenteError);
  });
});
