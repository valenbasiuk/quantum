import { describe, expect, it } from 'vitest';
import { EstadoProceso, Simulador } from '../../src/index.js';
import { secuenciaDeEjecucion } from '../ayudantes.js';

describe('RF07 - Planificar la CPU con Round-Robin', () => {
  it('atiende en orden FIFO y rota al agotar el quantum', () => {
    const sim = Simulador.crear({ quantum: 2 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 3 });
    sim.registrarProceso({ pid: 'P3', memoria: 100, cpu: 1 });
    expect(secuenciaDeEjecucion(sim, 7)).toEqual(['P1', 'P1', 'P2', 'P2', 'P3', 'P1', 'P2']);
  });

  it('al despachar reinicia el quantum consumido', () => {
    const sim = Simulador.crear({ quantum: 2 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 4 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 4 });
    sim.avanzarTick();
    sim.avanzarTick(); // P1 agota quantum y vuelve a la cola con quantum 0
    expect(sim.proceso('P1').quantumConsumido).toBe(0);
    sim.avanzarTick();
    expect(sim.proceso('P2').quantumConsumido).toBe(1);
  });

  it('al llegar a cero termina y libera memoria en ese tick; otro ejecuta recién en el siguiente', () => {
    const sim = Simulador.crear({ memoriaTotal: 200 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 1 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 1 });
    sim.avanzarTick();
    expect(sim.proceso('P1').estado).toBe(EstadoProceso.TERMINADO);
    expect(sim.proceso('P2').estado).toBe(EstadoProceso.LISTO);
    expect(sim.estado().enCpu).toBeNull();
    expect(sim.estado().mapaMemoria.find((b) => b.pid === 'P1')).toBeUndefined();
  });

  it('un quantum mayor que todas las ráfagas se comporta como FCFS', () => {
    const sim = Simulador.crear({ quantum: 10 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 2 });
    expect(secuenciaDeEjecucion(sim, 5)).toEqual(['P1', 'P1', 'P1', 'P2', 'P2']);
    expect(sim.metricas().cambiosContexto).toBe(0);
  });

  it('quantum 1 alterna en cada tick', () => {
    const sim = Simulador.crear({ quantum: 1 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 2 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 2 });
    expect(secuenciaDeEjecucion(sim, 4)).toEqual(['P1', 'P2', 'P1', 'P2']);
    expect(sim.metricas().cambiosContexto).toBe(2);
  });
});
