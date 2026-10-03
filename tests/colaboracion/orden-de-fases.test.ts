import { describe, expect, it, vi } from 'vitest';
import { Simulador, type IFaseTick } from '../../src/index.js';
import { FabricaSimulador } from '../../src/simulacion/FabricaSimulador.js';

// fase espia: registra su nombre en un diario compartido cada vez que se ejecuta
const espia = (nombre: string, diario: string[]): IFaseTick => ({
  nombre: () => nombre,
  ejecutar: vi.fn(() => {
    diario.push(nombre);
  }),
});

describe('Colaboración - orden de fases del tick (RF06)', () => {
  it('el simulador ejecuta las fases en el orden recibido, una vez por tick', () => {
    const diario: string[] = [];
    const fases = ['admision', 'bloqueados', 'cpu', 'reloj-metricas'].map((n) => espia(n, diario));
    const sim = new Simulador(fases, { registrarProceso: vi.fn() }, {} as never);
    sim.avanzarTick();
    sim.avanzarTick();
    expect(diario).toEqual([
      'admision', 'bloqueados', 'cpu', 'reloj-metricas',
      'admision', 'bloqueados', 'cpu', 'reloj-metricas',
    ]);
    fases.forEach((fase) => expect(fase.ejecutar).toHaveBeenCalledTimes(2));
  });

  it('la fábrica arma el simulador real con las fases en el orden de la consigna', () => {
    const fases = (new FabricaSimulador().crear({}) as unknown as { _fases: IFaseTick[] })._fases;
    expect(fases.map((f) => f.nombre())).toEqual(['admision', 'bloqueados', 'cpu', 'reloj-metricas']);
  });

  it('el simulador delega registro y consultas en sus colaboradores', () => {
    const registro = { registrarProceso: vi.fn(() => 'vista' as never) };
    const consulta = {
      estado: vi.fn(() => 'estado' as never),
      metricas: vi.fn(() => 'metricas' as never),
      proceso: vi.fn(() => 'proceso' as never),
      procesos: vi.fn(() => 'procesos' as never),
    };
    const sim = new Simulador([], registro, consulta);
    expect([
      sim.registrarProceso({ pid: 'P', memoria: 1, cpu: 1 }),
      sim.estado(),
      sim.metricas(),
      sim.proceso('P'),
      sim.procesos(),
    ]).toEqual(['vista', 'estado', 'metricas', 'proceso', 'procesos']);
  });

  it('las métricas se recalculan después del reloj (fase 4) y ven lo que hizo la CPU (fase 3)', () => {
    const sim = Simulador.crear();
    sim.registrarProceso({ pid: 'P1', memoria: 512, cpu: 2 });
    sim.avanzarTick();
    expect(sim.metricas()).toMatchObject({ utilizacionCpu: 100, ocupacionMemoria: 50 });
  });
});
