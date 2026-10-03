import { describe, expect, it } from 'vitest';
import {
  AdministradorMemoria,
  ConfiguracionInvalidaError,
  EstadoProceso,
  EventoES,
  MejorAjuste,
  MemoriaExcedidaError,
  PeorAjuste,
  PidDuplicadoError,
  PrimerAjuste,
  RecolectorMetricas,
  Simulador,
} from '../../src/index.js';
import { avanzar, secuenciaDeEjecucion, verificarInvariantesMemoria } from '../ayudantes.js';

// los ocho casos minimos de verificacion del anexo i, con el nombre de la consigna
describe('Casos mínimos de verificación (Anexo I)', () => {
  it('Caso 1 - Configuración y registro', () => {
    const sim = Simulador.crear({ memoriaTotal: 1024, quantum: 2 });
    expect(sim.estado().tick).toBe(0);
    expect(sim.estado().mapaMemoria).toEqual([{ inicio: 0, tamano: 1024, fin: 1024, libre: true, pid: null }]);
    expect(() => Simulador.crear({ quantum: 0 })).toThrow(ConfiguracionInvalidaError);
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 1 });
    expect(() => sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 1 })).toThrow(PidDuplicadoError);
    expect(() => sim.registrarProceso({ pid: 'P2', memoria: 2048, cpu: 1 })).toThrow(MemoriaExcedidaError);
  });

  it('Caso 2 - Asignación y espera', () => {
    // particion parcial y ajuste exacto
    const sim = Simulador.crear({ memoriaTotal: 300, quantum: 2 });
    sim.registrarProceso({ pid: 'P1', memoria: 200, cpu: 1 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 3 });
    sim.registrarProceso({ pid: 'P3', memoria: 200, cpu: 1 });
    sim.avanzarTick();
    expect(sim.proceso('P3').estado).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    // posterior admision al liberarse memoria
    sim.avanzarTick();
    expect(sim.proceso('P3').estado).toBe(EstadoProceso.LISTO);
    // seleccion segun politica y fracaso sin modificacion
    const politicas = [new PrimerAjuste(), new MejorAjuste(), new PeorAjuste()];
    const elegidos = politicas.map((politica) => {
      const memoria = new AdministradorMemoria(1000, politica);
      [200, 50, 100, 50, 300, 300].forEach((t, i) => memoria.asignar(`P${i + 1}`, t));
      ['P1', 'P3', 'P5'].forEach((pid) => memoria.liberar(pid));
      const antes = memoria.mapa();
      expect(memoria.asignar('GRANDE', 350)).toBe(false);
      expect(memoria.mapa()).toEqual(antes);
      memoria.asignar('N', 90);
      return memoria.mapa().find((b) => b.pid === 'N')?.inicio;
    });
    expect(elegidos).toEqual([0, 250, 400]);
  });

  it('Caso 3 - Coalescencia', () => {
    const memoria = new AdministradorMemoria(300, new PrimerAjuste());
    ['A', 'B', 'C'].forEach((pid) => memoria.asignar(pid, 100));
    memoria.liberar('A');
    memoria.liberar('B'); // con vecino izquierdo
    expect(memoria.mapa().map((b) => b.tamano)).toEqual([200, 100]);
    memoria.asignar('D', 200);
    memoria.liberar('C');
    memoria.liberar('D'); // con vecino derecho -> todo libre
    expect(memoria.mapa()).toEqual([{ inicio: 0, tamano: 300, fin: 300, libre: true, pid: null }]);
  });

  it('Caso 4 - Round Robin: Q=2, P1 CPU 3, P2 CPU 2 → P1, P1, P2, P2, P1 con 1 cambio de contexto', () => {
    const sim = Simulador.crear({ memoriaTotal: 1024, quantum: 2 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 3 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 2 });
    expect(secuenciaDeEjecucion(sim, 5)).toEqual(['P1', 'P1', 'P2', 'P2', 'P1']);
    expect(sim.metricas().cambiosContexto).toBe(1);
    expect(sim.estado().terminados).toEqual(['P2', 'P1']);
  });

  it('Caso 5 - Quantum y finalización', () => {
    const solo = Simulador.crear({ quantum: 2 });
    solo.registrarProceso({ pid: 'P1', memoria: 100, cpu: 5 });
    expect(secuenciaDeEjecucion(solo, 5)).toEqual(['P1', 'P1', 'P1', 'P1', 'P1']);
    expect(solo.metricas().cambiosContexto).toBe(0);

    const limite = Simulador.crear({ quantum: 2 });
    limite.registrarProceso({ pid: 'P1', memoria: 100, cpu: 2 });
    limite.registrarProceso({ pid: 'P2', memoria: 100, cpu: 2 });
    avanzar(limite, 2); // P1 termina justo al agotar el quantum
    expect(limite.proceso('P1').estado).toBe(EstadoProceso.TERMINADO);
    expect(limite.estado().listos).toEqual(['P2']);
    expect(limite.metricas().cambiosContexto).toBe(0);
  });

  it('Caso 6 - Bloqueo por E/S', () => {
    const sim = Simulador.crear({ quantum: 2 });
    sim.registrarProceso({ pid: 'P1', memoria: 200, cpu: 4, eventoES: new EventoES(1, 2) });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 3 });
    expect(secuenciaDeEjecucion(sim, 7)).toEqual(['P1', 'P2', 'P2', 'P1', 'P1', 'P2', 'P1']);
    expect(sim.metricas().cambiosContexto).toBe(3); // bloqueo + dos expropiaciones
  });

  it('Caso 6b - durante el bloqueo conserva memoria y no consume CPU', () => {
    const sim = Simulador.crear({ quantum: 2 });
    sim.registrarProceso({ pid: 'P1', memoria: 200, cpu: 4, eventoES: new EventoES(1, 2) });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 3 });
    sim.avanzarTick();
    sim.avanzarTick();
    expect(sim.proceso('P1')).toMatchObject({ estado: EstadoProceso.BLOQUEADO, cpuRestante: 3 });
    expect(sim.estado().mapaMemoria.find((b) => b.pid === 'P1')?.tamano).toBe(200);
    sim.avanzarTick(); // P1 vence y vuelve a Listos; P2 agota su quantum y queda detrás
    expect(sim.estado().listos).toEqual(['P1', 'P2']);
  });

  it('Caso 7 - Métricas y límites', () => {
    const memoria = new AdministradorMemoria(800, new PrimerAjuste());
    [100, 200, 300, 200].forEach((t, i) => memoria.asignar(`P${i + 1}`, t));
    memoria.liberar('P1');
    memoria.liberar('P3');
    expect(new RecolectorMetricas(memoria).actuales()).toMatchObject({
      memoriaLibreTotal: 400,
      mayorBloqueLibre: 300,
      fragmentacionExterna: 25,
    });
    memoria.asignar('X', 100);
    memoria.asignar('Y', 300);
    expect(new RecolectorMetricas(memoria).actuales().fragmentacionExterna).toBe(0); // memoria llena
    expect(Simulador.crear().metricas()).toMatchObject({ utilizacionCpu: 0, fragmentacionExterna: 0 }); // tick 0
  });

  it('Caso 8 - Orden e invariantes', () => {
    const sim = Simulador.crear({ memoriaTotal: 100, quantum: 2 });
    sim.registrarProceso({ pid: 'P1', memoria: 100, cpu: 1 });
    sim.registrarProceso({ pid: 'P2', memoria: 100, cpu: 1 });
    sim.avanzarTick(); // P1 libera al final del tick 1
    expect(sim.proceso('P2').estado).toBe(EstadoProceso.ESPERANDO_MEMORIA);
    sim.avanzarTick(); // la admision del tick 2 lo aprovecha
    expect(sim.proceso('P2').estado).toBe(EstadoProceso.TERMINADO);

    const grande = Simulador.crear({ memoriaTotal: 1024, quantum: 2 });
    [
      ['A', 200, 4],
      ['B', 350, 3],
      ['C', 150, 2],
      ['D', 400, 3],
      ['E', 300, 5],
    ].forEach(([pid, memoria, cpu]) =>
      grande.registrarProceso({ pid: `${pid}`, memoria: Number(memoria), cpu: Number(cpu) }),
    );
    Array.from({ length: 20 }).forEach(() => {
      grande.avanzarTick();
      verificarInvariantesMemoria(grande, 1024);
      const enCpu = grande.procesos().filter((p) => p.estado === EstadoProceso.EJECUTANDO);
      expect(enCpu.length).toBeLessThanOrEqual(1);
    });
  });
});
