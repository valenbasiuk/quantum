import { describe, expect, it } from 'vitest';
import {
  AdministradorMemoria,
  ConfiguracionInvalidaError,
  EstadoProceso,
  MejorAjuste,
  MemoriaExcedidaError,
  PeorAjuste,
  PidDuplicadoError,
  PrimerAjuste,
  Simulador,
} from '../../src/index.js';
import { secuenciaDeEjecucion } from '../ayudantes.js';

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
});
