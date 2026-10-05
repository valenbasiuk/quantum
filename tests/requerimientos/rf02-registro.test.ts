import { describe, expect, it } from 'vitest';
import {
  EstadoProceso,
  MemoriaExcedidaError,
  PidDuplicadoError,
  ProcesoInexistenteError,
  ProcesoInvalidoError,
  Simulador,
} from '../../src/index.js';

describe('RF02 - Registrar y consultar procesos', () => {
  it('registra un proceso con sus contadores iniciales', () => {
    const sim = Simulador.crear();
    const vista = sim.registrarProceso({ pid: 'P1', memoria: 200, cpu: 4 });
    expect(vista).toEqual({
      pid: 'P1',
      memoriaRequerida: 200,
      cpuTotal: 4,
      cpuRestante: 4,
      estado: EstadoProceso.NUEVO,
      quantumConsumido: 0,
      bloqueoRestante: 0,
    });
    expect(sim.proceso('P1').estado).toBe(EstadoProceso.NUEVO);
  });

  it('devuelve los procesos en orden de registro', () => {
    const sim = Simulador.crear();
    ['P3', 'P1', 'P2'].forEach((pid) => sim.registrarProceso({ pid, memoria: 10, cpu: 1 }));
    expect(sim.procesos().map((p) => p.pid)).toEqual(['P3', 'P1', 'P2']);
  });

  it('rechaza PID duplicados sin alterar el registro', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 2 });
    expect(() => sim.registrarProceso({ pid: 'P1', memoria: 50, cpu: 1 })).toThrow(PidDuplicadoError);
    expect(sim.procesos()).toHaveLength(1);
    expect(sim.proceso('P1').memoriaRequerida).toBe(100);
  });

  it('rechaza procesos que piden más memoria que la total y acepta el límite exacto', () => {
    const sim = Simulador.crear({ memoriaTotal: 1024 });
    expect(() => sim.registrarProceso({ pid: 'G', memoria: 1025, cpu: 1 })).toThrow(MemoriaExcedidaError);
    expect(sim.procesos()).toHaveLength(0);
    expect(sim.registrarProceso({ pid: 'E', memoria: 1024, cpu: 1 }).memoriaRequerida).toBe(1024);
  });

  it.each([
    ['PID vacío', { pid: '  ', memoria: 10, cpu: 1 }],
    ['memoria cero', { pid: 'P', memoria: 0, cpu: 1 }],
    ['memoria decimal', { pid: 'P', memoria: 1.5, cpu: 1 }],
    ['CPU cero', { pid: 'P', memoria: 10, cpu: 0 }],
    ['CPU negativa', { pid: 'P', memoria: 10, cpu: -3 }],
  ])('rechaza datos inválidos: %s', (_caso, solicitud) => {
    const sim = Simulador.crear();
    expect(() => sim.registrarProceso(solicitud)).toThrow(ProcesoInvalidoError);
    expect(sim.procesos()).toHaveLength(0);
  });

  it('consultar un PID inexistente es un error de dominio', () => {
    expect(() => Simulador.crear().proceso('X')).toThrow(ProcesoInexistenteError);
  });

  it('las consultas son de solo lectura: modificarlas no altera el dominio', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3 });
    const vista = sim.proceso('P1') as { cpuRestante: number };
    expect(() => {
      vista.cpuRestante = 0;
    }).toThrow(TypeError);
    const lista = sim.procesos() as unknown as unknown[];
    expect(() => lista.push({})).toThrow(TypeError);
    expect(sim.proceso('P1').cpuRestante).toBe(3);
  });
});
