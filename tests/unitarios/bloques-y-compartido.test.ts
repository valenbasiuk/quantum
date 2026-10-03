import { describe, expect, it } from 'vitest';
import { BloqueLibre, BloqueOcupado } from '../../src/index.js';
import { Guardia } from '../../src/compartido/Guardia.js';
import { ValidadorEntero } from '../../src/compartido/ValidadorEntero.js';
import { particionar } from '../../src/compartido/particionar.js';

describe('BloqueMemoria - polimorfismo libre / ocupado', () => {
  it('un bloque libre se parte al asignar y un ajuste exacto no deja sobrante', () => {
    const libre = new BloqueLibre(100, 300);
    expect(libre.asignar('P1', 120).map((b) => b.vista())).toEqual([
      { inicio: 100, tamano: 120, fin: 220, libre: false, pid: 'P1' },
      { inicio: 220, tamano: 180, fin: 400, libre: true, pid: null },
    ]);
    expect(libre.asignar('P1', 300)).toHaveLength(1);
  });

  it('doble despacho de coalescencia', () => {
    const a = new BloqueLibre(0, 100);
    const b = new BloqueLibre(100, 50);
    const o = new BloqueOcupado(150, 50, 'P1');
    expect(b.anexarTrasDe(a).map((x) => x.vista())).toEqual([{ inicio: 0, tamano: 150, fin: 150, libre: true, pid: null }]);
    expect(o.anexarTrasDe(a)).toEqual([a, o]);
    expect(a.anexarTrasDe(o)).toEqual([o, a]);
  });

  it('liberar: el ocupado se convierte en libre y el libre queda igual', () => {
    const o = new BloqueOcupado(0, 10, 'P1');
    expect(o.liberar().estaLibre()).toBe(true);
    const l = new BloqueLibre(0, 10);
    expect(l.liberar()).toBe(l);
    expect([l.perteneceA(), o.perteneceA('P1'), o.perteneceA('P2')]).toEqual([false, true, false]);
    expect([l.comoLibre(), o.comoLibre()]).toEqual([[l], []]);
  });
});

describe('Utilidades compartidas', () => {
  it('Guardia lanza el error solo si la condición es falsa', () => {
    const g = new Guardia();
    expect(() => g.asegurar(true, () => new Error('no'))).not.toThrow();
    expect(() => g.asegurar(false, () => new RangeError('sí'))).toThrow(RangeError);
  });

  it('ValidadorEntero exige enteros positivos', () => {
    const v = new ValidadorEntero();
    expect(() => v.exigirEnteroPositivo(1, () => new Error())).not.toThrow();
    [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY].forEach((valor) =>
      expect(() => v.exigirEnteroPositivo(valor, () => new Error('x'))).toThrow('x'),
    );
  });

  it('particionar separa en orden y evalúa una vez por elemento', () => {
    const vistos: number[] = [];
    const [pares, impares] = particionar([1, 2, 3, 4, 5], (n) => {
      vistos.push(n);
      return n % 2 === 0;
    });
    expect([pares, impares, vistos]).toEqual([[2, 4], [1, 3, 5], [1, 2, 3, 4, 5]]);
  });
});
