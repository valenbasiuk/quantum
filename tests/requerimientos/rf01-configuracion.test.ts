import { describe, expect, it } from 'vitest';
import { ConfiguracionInvalidaError, ConfiguracionSimulacion, MejorAjuste, Simulador } from '../../src/index.js';

describe('RF01 - Configurar e iniciar la simulación', () => {
  it('usa la configuración de referencia (1024 KB, quantum 2, First-Fit) por defecto', () => {
    const config = ConfiguracionSimulacion.crear();
    expect(config.memoriaTotal()).toBe(1024);
    expect(config.quantum()).toBe(2);
    expect(config.politica().nombre()).toBe('FIRST_FIT');
  });

  it('acepta memoria, quantum y política configurables', () => {
    const config = ConfiguracionSimulacion.crear({ memoriaTotal: 512, quantum: 3, politica: new MejorAjuste() });
    expect(config.memoriaTotal()).toBe(512);
    expect(config.quantum()).toBe(3);
    expect(config.politica().nombre()).toBe('BEST_FIT');
  });

  it('inicia en tick 0, con un único bloque libre del total, colas vacías y contadores en cero', () => {
    const sim = Simulador.crear({ memoriaTotal: 1024, quantum: 2 });
    expect(sim.estado()).toEqual({
      tick: 0,
      enCpu: null,
      listos: [],
      esperandoMemoria: [],
      bloqueados: [],
      terminados: [],
      mapaMemoria: [{ inicio: 0, tamano: 1024, fin: 1024, libre: true, pid: null }],
    });
    expect(sim.metricas()).toEqual({
      ocupacionMemoria: 0,
      utilizacionCpu: 0,
      cambiosContexto: 0,
      memoriaLibreTotal: 1024,
      mayorBloqueLibre: 1024,
      fragmentacionExterna: 0,
    });
    expect(sim.procesos()).toEqual([]);
  });

  it.each([
    ['memoria cero', { memoriaTotal: 0 }],
    ['memoria negativa', { memoriaTotal: -1024 }],
    ['memoria decimal', { memoriaTotal: 10.5 }],
    ['quantum cero', { quantum: 0 }],
    ['quantum negativo', { quantum: -2 }],
    ['quantum decimal', { quantum: 1.5 }],
    ['quantum NaN', { quantum: Number.NaN }],
  ])('rechaza configuraciones inválidas: %s', (_caso, opciones) => {
    expect(() => Simulador.crear(opciones)).toThrow(ConfiguracionInvalidaError);
  });

  it('el límite inferior válido (memoria 1, quantum 1) se acepta', () => {
    const sim = Simulador.crear({ memoriaTotal: 1, quantum: 1 });
    expect(sim.estado().mapaMemoria).toHaveLength(1);
  });
});
