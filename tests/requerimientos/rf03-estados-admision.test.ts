import { describe, expect, it } from 'vitest';
import { EstadoProceso, EventoES, Simulador } from '../../src/index.js';
import { avanzar } from '../ayudantes.js';

const { ESPERANDO_MEMORIA, LISTO, EJECUTANDO, BLOQUEADO, TERMINADO } = EstadoProceso;

describe('RF03 - Gestionar estados y admisión', () => {
  it('representa los seis estados del ciclo de vida', () => {
    expect(Object.values(EstadoProceso)).toEqual([
      'NUEVO',
      'ESPERANDO_MEMORIA',
      'LISTO',
      'EJECUTANDO',
      'BLOQUEADO',
      'TERMINADO',
    ]);
  });

  it('al admitir asigna memoria y encola como Listo', () => {
    const sim = Simulador.crear({ memoriaTotal: 1000 });
    sim.registrarProceso({ pid: 'P1', memoria: 300, cpu: 5 });
    sim.registrarProceso({ pid: 'P2', memoria: 300, cpu: 5 });
    sim.avanzarTick();
    expect(sim.proceso('P1').estado).toBe(EJECUTANDO);
    expect(sim.proceso('P2').estado).toBe(LISTO);
    expect(sim.estado().listos).toEqual(['P2']);
    expect(sim.estado().mapaMemoria.filter((b) => !b.libre).map((b) => b.pid)).toEqual(['P1', 'P2']);
  });

  it('sin bloque suficiente queda Esperando Memoria', () => {
    const sim = Simulador.crear({ memoriaTotal: 500 });
    sim.registrarProceso({ pid: 'P1', memoria: 400, cpu: 5 });
    sim.registrarProceso({ pid: 'P2', memoria: 200, cpu: 5 });
    sim.avanzarTick();
    expect(sim.proceso('P2').estado).toBe(ESPERANDO_MEMORIA);
    expect(sim.estado().esperandoMemoria).toEqual(['P2']);
  });

  it('un proceso que no cabe no impide admitir a los siguientes que sí caben', () => {
    const sim = Simulador.crear({ memoriaTotal: 300 });
    sim.registrarProceso({ pid: 'P1', memoria: 200, cpu: 5 });
    sim.registrarProceso({ pid: 'P2', memoria: 200, cpu: 1 });
    sim.registrarProceso({ pid: 'P3', memoria: 100, cpu: 1 });
    sim.avanzarTick();
    expect(sim.proceso('P2').estado).toBe(ESPERANDO_MEMORIA);
    expect(sim.proceso('P3').estado).toBe(LISTO);
  });

  it('reintenta en orden de registro al inicio de cada tick', () => {
    const sim = Simulador.crear({ memoriaTotal: 300 });
    sim.registrarProceso({ pid: 'P1', memoria: 300, cpu: 1 });
    sim.registrarProceso({ pid: 'P2', memoria: 150, cpu: 3 });
    sim.registrarProceso({ pid: 'P3', memoria: 150, cpu: 3 });
    sim.avanzarTick(); // P1 ocupa todo y termina en este tick
    expect(sim.estado().esperandoMemoria).toEqual(['P2', 'P3']);
    sim.avanzarTick(); // se reintenta: ambos entran en orden
    expect(sim.estado().esperandoMemoria).toEqual([]);
    expect(sim.estado().enCpu).toBe('P2');
    expect(sim.estado().listos).toEqual(['P3']);
  });

  it('un proceso Terminado no vuelve a ninguna cola', () => {
    const sim = Simulador.crear({ quantum: 1 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 1 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 3 });
    avanzar(sim, 6);
    const estado = sim.estado();
    expect(sim.proceso('P1').estado).toBe(TERMINADO);
    expect([...estado.listos, ...estado.esperandoMemoria, ...estado.bloqueados]).not.toContain('P1');
    expect(estado.terminados).toEqual(['P1', 'P2']);
  });

  it('recorre Bloqueado y vuelve a Listo', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3, eventoES: new EventoES(1, 1) });
    sim.avanzarTick();
    expect(sim.proceso('P1').estado).toBe(BLOQUEADO);
    sim.avanzarTick();
    expect(sim.proceso('P1').estado).toBe(EJECUTANDO);
  });
});
