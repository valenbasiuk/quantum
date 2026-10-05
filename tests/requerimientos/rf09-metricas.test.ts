import { describe, expect, it } from 'vitest';
import { AdministradorMemoria, EventoES, PrimerAjuste, RecolectorMetricas, Simulador } from '../../src/index.js';
import { avanzar } from '../ayudantes.js';

describe('RF09 - Métricas consultables', () => {
  it('huecos no contiguos de 100 y 300 KB: libre 400, mayor 300, fragmentación 25 %', () => {
    const memoria = new AdministradorMemoria(800, new PrimerAjuste());
    [['P1', 100], ['P2', 200], ['P3', 300], ['P4', 200]].forEach(([pid, t]) => memoria.asignar(`${pid}`, Number(t)));
    memoria.liberar('P1');
    memoria.liberar('P3');
    const recolector = new RecolectorMetricas(memoria);
    expect(recolector.actuales()).toMatchObject({
      memoriaLibreTotal: 400,
      mayorBloqueLibre: 300,
      fragmentacionExterna: 25,
      ocupacionMemoria: 50,
    });
  });

  it('memoria llena: libre 0, mayor 0, fragmentación 0 % y ocupación 100 %', () => {
    const memoria = new AdministradorMemoria(500, new PrimerAjuste());
    memoria.asignar('P1', 500);
    expect(new RecolectorMetricas(memoria).actuales()).toMatchObject({
      memoriaLibreTotal: 0,
      mayorBloqueLibre: 0,
      fragmentacionExterna: 0,
      ocupacionMemoria: 100,
    });
  });

  it('en tick 0 la utilización de CPU es 0 %', () => {
    expect(Simulador.crear().metricas().utilizacionCpu).toBe(0);
  });

  it('utilización de CPU = ticks ocupados / ticks transcurridos', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 2 });
    avanzar(sim, 4); // 2 ticks ocupados de 4
    expect(sim.metricas().utilizacionCpu).toBe(50);
  });

  it('se recalculan al final de cada tick', () => {
    const sim = Simulador.crear({ memoriaTotal: 1000 });
    sim.registrarProceso({ pid: 'P1', memoria: 250, cpu: 1 });
    sim.avanzarTick(); // se asigna y termina en el mismo tick
    expect(sim.metricas()).toMatchObject({ ocupacionMemoria: 0, utilizacionCpu: 100, memoriaLibreTotal: 1000 });
  });

  it('convención de cambios de contexto: no cuentan despacho inicial, finalización ni renovación', () => {
    const sim = Simulador.crear({ quantum: 1 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3 });
    avanzar(sim, 3);
    expect(sim.metricas().cambiosContexto).toBe(0);
  });

  it('cuentan la expropiación por quantum con otros Listos y el bloqueo por E/S', () => {
    const sim = Simulador.crear({ quantum: 1 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 2 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 3, eventoES: new EventoES(1, 5) });
    sim.avanzarTick(); // P1 expropiado → 1
    sim.avanzarTick(); // P2 se bloquea → 2
    expect(sim.metricas().cambiosContexto).toBe(2);
  });

  it('las métricas devueltas son de solo lectura', () => {
    const metricas = Simulador.crear().metricas() as { cambiosContexto: number };
    expect(() => {
      metricas.cambiosContexto = 99;
    }).toThrow(TypeError);
  });
});
