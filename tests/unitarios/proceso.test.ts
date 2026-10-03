import { describe, expect, it } from 'vitest';
import type { IEventoES } from '../../src/index.js';
import { EstadoProceso, EventoES, EventoProceso, Proceso, SinEventoES, TablaTransiciones, TransicionInvalidaError } from '../../src/index.js';

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

  it('bloqueo: toma la duración del evento y la descuenta hasta vencer', () => {
    const p = enEjecucion(3, new EventoES(1, 2));
    p.ejecutarUnidad();
    expect(p.debeBloquearse()).toBe(true);
    p.bloquear();
    expect(p.bloqueoRestante()).toBe(2);
    p.avanzarBloqueo();
    expect(p.bloqueoVencido()).toBe(false);
    p.avanzarBloqueo();
    expect(p.bloqueoVencido()).toBe(true);
    p.desbloquear();
    expect(p.estado()).toBe(EstadoProceso.LISTO);
  });

  it('el evento de E/S se dispara una sola vez', () => {
    const p = enEjecucion(4, new EventoES(1, 1));
    p.ejecutarUnidad();
    expect(p.debeBloquearse()).toBe(true);
    p.bloquear();
    p.avanzarBloqueo();
    p.desbloquear();
    p.despachar();
    p.ejecutarUnidad();
    expect(p.debeBloquearse()).toBe(false);
  });

  it('expone sus datos de identificación y la instantánea congelada', () => {
    const p = new Proceso('P9', 64, 7);
    expect([p.pid(), p.memoriaRequerida(), p.cpuTotal(), p.cpuRestante()]).toEqual(['P9', 64, 7, 7]);
    expect(Object.isFrozen(p.instantanea())).toBe(true);
  });

  it('la tabla de transiciones valida (estado, evento) y no permite saltar estados', () => {
    const tabla = new TablaTransiciones();
    expect(tabla.permite(EstadoProceso.NUEVO, EventoProceso.DESPACHAR)).toBe(false);
    expect(tabla.permite(EstadoProceso.BLOQUEADO, EventoProceso.DESPACHAR)).toBe(false);
    expect(tabla.permite(EstadoProceso.NUEVO, EventoProceso.DESBLOQUEAR)).toBe(false);
    expect(tabla.permite(EstadoProceso.EJECUTANDO, EventoProceso.BLOQUEAR)).toBe(true);
    expect(tabla.destino(EventoProceso.BLOQUEAR)).toBe(EstadoProceso.BLOQUEADO);
  });

  it('un proceso Listo no puede volver a ser admitido', () => {
    const p = new Proceso('P1', 10, 2);
    p.admitir();
    expect(() => p.admitir()).toThrow(TransicionInvalidaError);
  });

  it('SinEventoES nunca dispara', () => {
    const nulo = new SinEventoES();
    expect([nulo.seDisparaCon(), nulo.duracion(), nulo.trasTicksCpu()]).toEqual([false, 0, 0]);
  });
});
