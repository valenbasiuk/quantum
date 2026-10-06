import type { IEventoES, ISimulador } from '../../biblioteca-simulador/src/index.js';

/** Un proceso de un escenario: sus datos y el tick en que aparece en el sistema. */
export interface DefinicionProceso {
  readonly pid: string;
  readonly memoria: number;
  readonly cpu: number;
  readonly llegada: number;
  readonly eventoES?: IEventoES;
}

export interface IEscenario {
  nombre(): string;
  descripcion(): string;
  procesos(): readonly DefinicionProceso[];
}

/** Foto mínima de un proceso para detectar qué cambió entre dos ticks. */
export interface FotoProceso {
  readonly estado: string;
  readonly cpuRestante: number;
  readonly memoria: number;
  readonly bloqueoRestante: number;
}

export interface IDetectorEventos {
  detectar(antes: ReadonlyMap<string, FotoProceso>, despues: ReadonlyMap<string, FotoProceso>): string[];
}

export interface IPresentadorTick {
  presentar(simulador: ISimulador, eventos: readonly string[]): string;
}

export interface IComparador {
  comparar(escenario: IEscenario, memoria: number, quantum: number): string;
}

export interface OpcionesConsola {
  readonly escenario: string;
  readonly politica: string;
  readonly quantum: number;
  readonly memoria: number;
  readonly ticks: number;
  readonly paso: boolean;
  readonly comparar: boolean;
  readonly liberar: readonly string[];
  readonly listar: boolean;
}
