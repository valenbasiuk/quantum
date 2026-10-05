import { describe, expect, it } from 'vitest';
import { EventoES, Simulador } from '../../src/index.js';

describe('RF10 - Consultar el estado del sistema', () => {
  it('expone tick, CPU, Listos, espera, bloqueados, terminados y mapa de memoria', () => {
    const sim = Simulador.crear({ memoriaTotal: 400, quantum: 2 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 1 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 4, eventoES: new EventoES(1, 5) });
    sim.registrarProceso({ pid: 'P3', memoria: 150, cpu: 4 });
    sim.registrarProceso({ pid: 'P4', memoria: 200, cpu: 4 });
    sim.avanzarTick(); // P1 se ejecuta y termina; P4 no entra (solo quedan 50 KB al final)
    sim.avanzarTick(); // P2 se bloquea; P4 sigue sin entrar: hay 150 KB libres pero en dos huecos
    expect(sim.estado()).toEqual({
      tick: 2,
      enCpu: null,
      listos: ['P3'],
      esperandoMemoria: ['P4'],
      bloqueados: ['P2'],
      terminados: ['P1'],
      mapaMemoria: [
        { inicio: 0, tamano: 100, fin: 100, libre: true, pid: null },
        { inicio: 100, tamano: 100, fin: 200, libre: false, pid: 'P2' },
        { inicio: 200, tamano: 150, fin: 350, libre: false, pid: 'P3' },
        { inicio: 350, tamano: 50, fin: 400, libre: true, pid: null },
      ],
    });
    expect(sim.metricas().fragmentacionExterna).toBeCloseTo(33.33, 2);
  });

  it('las vistas son copias protegidas: no permiten modificar colas ni el mapa', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 3 });
    sim.avanzarTick();
    const estado = sim.estado();
    expect(() => (estado.listos as string[]).push('X')).toThrow(TypeError);
    expect(() => (estado.mapaMemoria as unknown[]).pop()).toThrow(TypeError);
    expect(() => {
      (estado.mapaMemoria[0] as { tamano: number }).tamano = 1;
    }).toThrow(TypeError);
    expect(sim.estado().listos).toEqual(['P2']);
  });

  it('nunca hay duplicados en colas ni más de un proceso en CPU', () => {
    const sim = Simulador.crear({ memoriaTotal: 600, quantum: 1 });
    ['P1', 'P2', 'P3', 'P4'].forEach((pid, i) =>
      sim.registrarProceso({ pid, memoria: 200, cpu: 3 + i, eventoES: new EventoES(1 + (i % 2), 2) }),
    );
    Array.from({ length: 25 }).forEach(() => {
      sim.avanzarTick();
      const e = sim.estado();
      const todos = [...e.listos, ...e.esperandoMemoria, ...e.bloqueados, ...e.terminados, ...[e.enCpu].filter(Boolean)];
      expect(new Set(todos).size).toBe(todos.length);
    });
    expect(sim.estado().terminados).toHaveLength(4);
  });
});
