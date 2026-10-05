import { describe, expect, it } from 'vitest';
import { EstadoProceso, EventoES, EventoESInvalidoError, Simulador } from '../../src/index.js';
import { secuenciaDeEjecucion } from '../ayudantes.js';

describe('RF08 - Simular Entrada/Salida', () => {
  it('se dispara tras N ticks de CPU: bloquea, libera CPU y conserva memoria', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 200, cpu: 4, eventoES: new EventoES(1, 2) });
    sim.avanzarTick();
    expect(sim.proceso('P1')).toMatchObject({ estado: EstadoProceso.BLOQUEADO, cpuRestante: 3, bloqueoRestante: 2 });
    expect(sim.estado().enCpu).toBeNull();
    expect(sim.estado().bloqueados).toEqual(['P1']);
    expect(sim.estado().mapaMemoria[0]).toMatchObject({ pid: 'P1', tamano: 200 });
  });

  it('durante el bloqueo no consume CPU y el temporizador baja en los ticks siguientes', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 200, cpu: 4, eventoES: new EventoES(1, 3) });
    sim.avanzarTick();
    sim.avanzarTick();
    expect(sim.proceso('P1')).toMatchObject({ cpuRestante: 3, bloqueoRestante: 2 });
    sim.avanzarTick();
    expect(sim.proceso('P1')).toMatchObject({ cpuRestante: 3, bloqueoRestante: 1 });
  });

  it('al vencer vuelve al final de Listos y puede ser despachado en el mismo tick', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3, eventoES: new EventoES(1, 1) });
    expect(secuenciaDeEjecucion(sim, 3)).toEqual(['P1', 'P1', 'P1']);
  });

  it('vuelve al FINAL de la cola de Listos', () => {
    const sim = Simulador.crear({ quantum: 5 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3, eventoES: new EventoES(1, 1) });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 5 });
    sim.registrarProceso({ pid: 'P3', memoria: 100, cpu: 5 });
    sim.avanzarTick(); // P1 se bloquea; Listos = [P2, P3]
    sim.avanzarTick(); // P1 vence y va detrás de P3; P2 toma la CPU
    expect(sim.estado().listos).toEqual(['P3', 'P1']);
  });

  it('el bloqueo tiene prioridad sobre la rotación por quantum y cuenta un cambio de contexto', () => {
    const sim = Simulador.crear({ quantum: 1 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3, eventoES: new EventoES(1, 2) });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 3 });
    sim.avanzarTick();
    expect(sim.proceso('P1').estado).toBe(EstadoProceso.BLOQUEADO);
    expect(sim.estado().listos).toEqual(['P2']);
    expect(sim.metricas().cambiosContexto).toBe(1);
  });

  it('la finalización tiene prioridad: la E/S siempre debe dispararse antes de terminar', () => {
    const sim = Simulador.crear();
    expect(() => sim.registrarProceso({ pid: 'P1', memoria: 10, cpu: 2, eventoES: new EventoES(2, 1) })).toThrow(
      EventoESInvalidoError,
    );
  });

  it.each([
    ['disparo cero', 0, 1],
    ['disparo negativo', -1, 1],
    ['duración cero', 1, 0],
    ['duración decimal', 1, 0.5],
  ])('rechaza eventos inválidos: %s', (_caso, tras, duracion) => {
    expect(() => new EventoES(tras, duracion)).toThrow(EventoESInvalidoError);
  });
});
