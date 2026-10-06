import { MejorAjuste, PeorAjuste, PrimerAjuste, Simulador } from '../../biblioteca-simulador/src/index.js';
import type { IPoliticaAsignacion, ISimulador } from '../../biblioteca-simulador/src/index.js';
import type { IComparador, IEscenario } from './contratos.js';
import { PresentadorTick } from './PresentadorTick.js';
import { CargadorEscenario } from './CargadorEscenario.js';

interface ResultadoPolitica {
  readonly nombre: string;
  readonly ticks: number;
  readonly fragPromedio: number;
  readonly fragMaxima: number;
  readonly ticksConEspera: number;
  readonly cambios: number;
  readonly foto: string;
}

/** Corre el mismo escenario con las tres políticas y arma la comparación. */
export class Comparador implements IComparador {
  private static readonly _POLITICAS: readonly (() => IPoliticaAsignacion)[] = [
    () => new PrimerAjuste(),
    () => new MejorAjuste(),
    () => new PeorAjuste(),
  ];

  constructor(private readonly _tope = 200) {}

  comparar(escenario: IEscenario, memoria: number, quantum: number): string {
    const tickFoto = Math.max(...escenario.procesos().map((p) => p.llegada));
    const resultados = Comparador._POLITICAS.map((crear) => this._correr(escenario, memoria, quantum, crear(), tickFoto));
    return [
      `COMPARACIÓN DE POLÍTICAS — escenario "${escenario.nombre()}" (${memoria} KB, quantum ${quantum})`,
      '',
      'Política    Ticks  Frag. prom.  Frag. máx.  Ticks con espera de memoria  Ctx',
      '─'.repeat(78),
      ...resultados.map(
        (r) =>
          `${r.nombre.padEnd(10)}${String(r.ticks).padStart(6)}${r.fragPromedio.toFixed(2).padStart(12)} %${r.fragMaxima
            .toFixed(2)
            .padStart(10)} %${String(r.ticksConEspera).padStart(26)}${String(r.cambios).padStart(9)}`,
      ),
      '',
      `Memoria al final del tick ${tickFoto}:`,
      ...resultados.map((r) => `  ${r.nombre.padEnd(10)} ${r.foto}`),
    ].join('\n');
  }

  private _correr(escenario: IEscenario, memoria: number, quantum: number, politica: IPoliticaAsignacion, tickFoto: number): ResultadoPolitica {
    const sim: ISimulador = Simulador.crear({ memoriaTotal: memoria, quantum, politica });
    const cargador = new CargadorEscenario(escenario);
    const presentador = new PresentadorTick();
    const frags: number[] = [];
    const conEspera: number[] = [];
    const fotos: string[] = [];
    const total = escenario.procesos().length;
    while (sim.estado().terminados.length < total && sim.estado().tick < this._tope) {
      cargador.cargarLlegadas(sim);
      sim.avanzarTick();
      const estado = sim.estado();
      frags.push(sim.metricas().fragmentacionExterna);
      conEspera.push(Math.min(estado.esperandoMemoria.length, 1));
      const huecos = estado.mapaMemoria.filter((b) => b.libre).map((b) => b.tamano);
      const foto = `${presentador.barra(estado.mapaMemoria, memoria, 46)}  huecos [${huecos.join(', ')}]  espera: [${estado.esperandoMemoria.join(', ')}]`;
      fotos.push(...[foto].slice(0, Number(estado.tick === tickFoto)));
    }
    return {
      nombre: politica.nombre(),
      ticks: sim.estado().tick,
      fragPromedio: frags.reduce((a, b) => a + b, 0) / frags.length,
      fragMaxima: Math.max(...frags),
      ticksConEspera: conEspera.reduce((a, b) => a + b, 0),
      cambios: sim.metricas().cambiosContexto,
      foto: fotos.join(''),
    };
  }
}
