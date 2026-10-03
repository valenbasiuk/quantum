import { describe, expect, it } from 'vitest';
import {
  ColaInvalidaError,
  EstadoProceso,
  EventoES,
  GestorES,
  PlanificadorRoundRobin,
  Proceso,
} from '../../src/index.js';
import { ReglaContinuar } from '../../src/planificacion/reglas/ReglaContinuar.js';

const listo = (pid: string, cpu = 3, evento?: EventoES) => {
  const p = new Proceso(pid, 10, cpu, evento);
  p.admitir();
  return p;
};

describe('PlanificadorRoundRobin - unidad', () => {
  it('despacha solo si la CPU está libre (capacidad 1)', () => {
    const rr = new PlanificadorRoundRobin([new ReglaContinuar()]);
    rr.encolar(listo('P1'));
    rr.encolar(listo('P2'));
    rr.despacharSiLibre();
    rr.despacharSiLibre();
    expect(rr.procesoEnCpu()).toBe('P1');
    expect(rr.ordenListos()).toEqual(['P2']);
  });

  it('CPU ociosa: ejecutar devuelve 0 y no hay proceso en CPU', () => {
    const rr = new PlanificadorRoundRobin([new ReglaContinuar()]);
    rr.despacharSiLibre();
    expect(rr.ejecutarUnidad()).toBe(0);
    expect(rr.procesoEnCpu()).toBeNull();
    expect(rr.hayListos()).toBe(false);
  });

  it('rechaza encolar un proceso que ya está en Listos o en CPU', () => {
    const rr = new PlanificadorRoundRobin([new ReglaContinuar()]);
    const p = listo('P1');
    rr.encolar(p);
    expect(() => rr.encolar(p)).toThrow(ColaInvalidaError);
    rr.despacharSiLibre();
    expect(() => rr.encolar(p)).toThrow(ColaInvalidaError);
  });

  it('la vista de la cola es una copia congelada', () => {
    const rr = new PlanificadorRoundRobin([new ReglaContinuar()]);
    rr.encolar(listo('P1'));
    expect(() => (rr.ordenListos() as string[]).push('X')).toThrow(TypeError);
  });
});

describe('GestorES - unidad', () => {
  it('descuenta temporizadores y devuelve a Listos a los vencidos, en orden', () => {
    const gestor = new GestorES();
    const rr = new PlanificadorRoundRobin([new ReglaContinuar()]);
    const a = listo('A', 3, new EventoES(1, 1));
    const b = listo('B', 3, new EventoES(1, 2));
    [a, b].forEach((p) => {
      p.despachar();
      p.ejecutarUnidad();
      p.bloquear();
      gestor.bloquear(p);
    });
    gestor.actualizar(rr);
    expect([gestor.bloqueados(), rr.ordenListos()]).toEqual([['B'], ['A']]);
    gestor.actualizar(rr);
    expect([gestor.bloqueados(), rr.ordenListos()]).toEqual([[], ['A', 'B']]);
    expect(b.estado()).toBe(EstadoProceso.LISTO);
  });
});
