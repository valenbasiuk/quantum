import { describe, expect, it } from 'vitest';
import {
  AdministradorMemoria,
  AsignacionInvalidaError,
  MejorAjuste,
  PeorAjuste,
  PrimerAjuste,
  type IPoliticaAsignacion,
} from '../../src/index.js';

/**
 * Deja la memoria (1000 KB) con tres huecos no contiguos:
 * [0-200) libre 200 | P2 | [250-350) libre 100 | P4 | [400-700) libre 300 | P6
 */
function memoriaConHuecos(politica: IPoliticaAsignacion): AdministradorMemoria {
  const memoria = new AdministradorMemoria(1000, politica);
  [200, 50, 100, 50, 300, 300].forEach((tamano, i) => memoria.asignar(`P${i + 1}`, tamano));
  ['P1', 'P3', 'P5'].forEach((pid) => memoria.liberar(pid));
  return memoria;
}

const inicioDe = (memoria: AdministradorMemoria, pid: string) =>
  memoria.mapa().find((bloque) => bloque.pid === pid)?.inicio;

describe('RF04 - Asignar memoria contigua', () => {
  it('parte el bloque cuando sobra espacio (partición parcial)', () => {
    const memoria = new AdministradorMemoria(1024, new PrimerAjuste());
    expect(memoria.asignar('P1', 200)).toBe(true);
    expect(memoria.mapa()).toEqual([
      { inicio: 0, tamano: 200, fin: 200, libre: false, pid: 'P1' },
      { inicio: 200, tamano: 824, fin: 1024, libre: true, pid: null },
    ]);
  });

  it('un ajuste exacto no genera bloques de tamaño cero', () => {
    const memoria = new AdministradorMemoria(1024, new PrimerAjuste());
    expect(memoria.asignar('P1', 1024)).toBe(true);
    expect(memoria.mapa()).toEqual([{ inicio: 0, tamano: 1024, fin: 1024, libre: false, pid: 'P1' }]);
  });

  it.each([
    ['First-Fit', new PrimerAjuste(), 0],
    ['Best-Fit', new MejorAjuste(), 250],
    ['Worst-Fit', new PeorAjuste(), 400],
  ])('%s elige según su criterio (pedido de 90 KB)', (_nombre, politica, inicioEsperado) => {
    const memoria = memoriaConHuecos(politica);
    expect(memoria.asignar('N', 90)).toBe(true);
    expect(inicioDe(memoria, 'N')).toBe(inicioEsperado);
  });

  it.each([
    ['First-Fit', new PrimerAjuste()],
    ['Best-Fit', new MejorAjuste()],
    ['Worst-Fit', new PeorAjuste()],
  ])('%s: ante empate elige la menor dirección', (_nombre, politica) => {
    const memoria = new AdministradorMemoria(400, politica);
    ['A', 'B', 'C', 'D'].forEach((pid) => memoria.asignar(pid, 100));
    memoria.liberar('A');
    memoria.liberar('C');
    expect(memoria.asignar('N', 50)).toBe(true);
    expect(inicioDe(memoria, 'N')).toBe(0);
  });

  it('si no hay hueco suficiente falla sin alterar los bloques, aunque la suma libre alcance', () => {
    const memoria = memoriaConHuecos(new PrimerAjuste());
    const antes = memoria.mapa();
    expect(memoria.memoriaLibreTotal()).toBe(600);
    expect(memoria.asignar('N', 350)).toBe(false);
    expect(memoria.mapa()).toEqual(antes);
  });

  it('rechaza tamaños inválidos y un PID que ya tiene memoria', () => {
    const memoria = new AdministradorMemoria(100, new PrimerAjuste());
    expect(() => memoria.asignar('P1', 0)).toThrow(AsignacionInvalidaError);
    memoria.asignar('P1', 10);
    expect(() => memoria.asignar('P1', 10)).toThrow(AsignacionInvalidaError);
  });

  it('rechaza una memoria total inválida', () => {
    expect(() => new AdministradorMemoria(0, new PrimerAjuste())).toThrow(AsignacionInvalidaError);
  });

  it('cada política informa su nombre', () => {
    expect([new PrimerAjuste(), new MejorAjuste(), new PeorAjuste()].map((p) => p.nombre())).toEqual([
      'FIRST_FIT',
      'BEST_FIT',
      'WORST_FIT',
    ]);
  });
});
