import { describe, expect, it } from 'vitest';
import { Simulador } from '../../src/index.js';
import { secuenciaDeEjecucion } from '../ayudantes.js';

describe('RF06 - Avanzar un tick de forma determinista', () => {
  it('cada invocación avanza exactamente una unidad de reloj', () => {
    const sim = Simulador.crear();
    sim.avanzarTick();
    sim.avanzarTick();
    expect(sim.estado().tick).toBe(2);
  });

  it('como máximo un proceso consume CPU por tick', () => {
    const sim = Simulador.crear({ quantum: 1 });
    ['P1', 'P2', 'P3'].forEach((pid) => sim.registrarProceso({ pid, memoria: 10, cpu: 2 }));
    Array.from({ length: 6 }).forEach(() => {
      const antes = sim.procesos().reduce((s, p) => s + p.cpuRestante, 0);
      sim.avanzarTick();
      const despues = sim.procesos().reduce((s, p) => s + p.cpuRestante, 0);
      expect(antes - despues).toBe(1);
    });
  });

  it('es reproducible: dos simulaciones iguales producen el mismo resultado', () => {
    const correr = () => {
      const sim = Simulador.crear({ memoriaTotal: 512, quantum: 2 });
      sim.registrarProceso({ pid: 'P1', memoria: 200, cpu: 4 });
      sim.registrarProceso({ pid: 'P2', memoria: 350, cpu: 3 });
      sim.registrarProceso({ pid: 'P3', memoria: 150, cpu: 2 });
      return { secuencia: secuenciaDeEjecucion(sim, 10), estado: sim.estado(), metricas: sim.metricas() };
    };
    expect(correr()).toEqual(correr());
  });

  it('con CPU ociosa el tick avanza igual y no ejecuta nada', () => {
    const sim = Simulador.crear();
    expect(secuenciaDeEjecucion(sim, 3)).toEqual(['-', '-', '-']);
    expect(sim.estado().tick).toBe(3);
  });
});
