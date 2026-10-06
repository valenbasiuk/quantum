import { EventoES } from '../../biblioteca-simulador/src/index.js';
import type { DefinicionProceso, IEscenario } from './contratos.js';

/** Escenario definido por datos: nombre, descripción y lista de procesos. */
export class Escenario implements IEscenario {
  constructor(
    private readonly _nombre: string,
    private readonly _descripcion: string,
    private readonly _procesos: readonly DefinicionProceso[],
  ) {}

  nombre(): string {
    return this._nombre;
  }

  descripcion(): string {
    return this._descripcion;
  }

  procesos(): readonly DefinicionProceso[] {
    return this._procesos;
  }
}

const p = (pid: string, memoria: number, cpu: number, llegada = 1, eventoES?: EventoES): DefinicionProceso => ({
  pid,
  memoria,
  cpu,
  llegada,
  eventoES,
});

export const ESCENARIOS: ReadonlyMap<string, IEscenario> = new Map(
  [
    new Escenario('base', 'Lote de referencia de la cátedra (P1 200 KB, P2 350, P3 150, P4 400)', [
      p('P1', 200, 4),
      p('P2', 350, 3),
      p('P3', 150, 2),
      p('P4', 400, 3),
    ]),
    new Escenario('llegadas', 'Procesos que llegan en ticks distintos y compiten por la memoria', [
      p('A', 600, 3),
      p('B', 300, 4),
      p('C', 350, 2, 2),
      p('D', 120, 2, 4),
      p('E', 500, 3, 5),
    ]),
    new Escenario('entrada-salida', 'Dos procesos con E/S (W1 y W3) y uno solo de CPU (W2)', [
      p('W1', 256, 5, 1, new EventoES(2, 3)),
      p('W2', 128, 4),
      p('W3', 512, 3, 1, new EventoES(1, 2)),
    ]),
    new Escenario('quantum', 'Verificación de Round-Robin: P1 (3 ticks de CPU) y P2 (2 ticks)', [p('P1', 100, 3), p('P2', 100, 2)]),
    new Escenario('comparativo', 'Huecos de 100, 150 y 250 KB; en el tick 8 llegan R1 (110), R2 (120) y R3 (140)', [
      p('H1', 100, 1),
      p('L1', 64, 12),
      p('H2', 150, 1),
      p('L2', 60, 12),
      p('H3', 250, 1),
      p('L3', 400, 12),
      p('R1', 110, 2, 8),
      p('R2', 120, 2, 8),
      p('R3', 140, 2, 8),
    ]),
  ].map((escenario) => [escenario.nombre(), escenario] as const),
);
