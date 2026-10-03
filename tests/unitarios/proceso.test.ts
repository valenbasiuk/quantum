import { describe, expect, it } from 'vitest';
import type { IEventoES } from '../../src/index.js';
import { EstadoProceso, Proceso, SinEventoES, TransicionInvalidaError } from '../../src/index.js';

const enEjecucion = (cpu = 3, evento: IEventoES = new SinEventoES()) => {
  const p = new Proceso('P1', 100, cpu, evento);
  p.admitir();
  p.despachar();
  return p;
};

describe('Proceso (PCB) - transiciones protegidas', () => {
  it('recorre el ciclo completo válido', () => {
    const p = new Proceso('P1', 100, 1);
    p.esperarMemoria();
    p.esperarMemoria(); // reintento: sigue esperando
    p.admitir();
    p.despachar();
    p.ejecutarUnidad();
    expect(p.termino()).toBe(true);
    p.terminar();
    expect(p.estado()).toBe(EstadoProceso.TERMINADO);
  });

  it.each<[string, (p: Proceso) => void]>([
    ['despachar un proceso Nuevo', (p) => p.despachar()],
    ['bloquear un proceso Nuevo', (p) => p.bloquear()],
    ['terminar un proceso Nuevo', (p) => p.terminar()],
    ['ejecutar CPU sin estar en CPU', (p) => p.ejecutarUnidad()],
    ['renovar quantum sin estar en CPU', (p) => p.renovarQuantum()],
    ['avanzar bloqueo sin estar bloqueado', (p) => p.avanzarBloqueo()],
    ['desbloquear sin estar bloqueado', (p) => p.desbloquear()],
    ['expropiar sin estar en CPU', (p) => p.expropiar()],
  ])('rechaza %s', (_caso, accion) => {
    const p = new Proceso('P1', 100, 3);
    expect(() => accion(p)).toThrow(TransicionInvalidaError);
    expect(p.estado()).toBe(EstadoProceso.NUEVO);
  });

  it('un proceso Terminado no puede volver a ninguna cola', () => {
    const p = enEjecucion(1);
    p.ejecutarUnidad();
    p.terminar();
    expect(() => p.admitir()).toThrow(TransicionInvalidaError);
    expect(() => p.esperarMemoria()).toThrow(TransicionInvalidaError);
  });

  it('despachar y expropiar reinician el quantum; ejecutar descuenta CPU y suma quantum', () => {
    const p = enEjecucion(5);
    p.ejecutarUnidad();
    p.ejecutarUnidad();
    expect(p.instantanea()).toMatchObject({ cpuRestante: 3, quantumConsumido: 2 });
    expect(p.agotoQuantum(2)).toBe(true);
    p.expropiar();
    expect(p.quantumConsumido()).toBe(0);
    p.despachar();
    p.ejecutarUnidad();
    p.renovarQuantum();
    expect(p.quantumConsumido()).toBe(0);
  });
});
