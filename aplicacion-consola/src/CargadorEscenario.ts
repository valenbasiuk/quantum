import type { ISimulador } from '../../src/index.js';
import type { IEscenario } from './contratos.js';

export interface ICargadorEscenario {
  /** Registra en el simulador los procesos que llegan en el próximo tick y devuelve sus PIDs. */
  cargarLlegadas(simulador: ISimulador): string[];
}

/** Da de alta los procesos del escenario justo antes del tick en el que llegan. */
export class CargadorEscenario implements ICargadorEscenario {
  constructor(private readonly _escenario: IEscenario) {}

  cargarLlegadas(simulador: ISimulador): string[] {
    const proximoTick = simulador.estado().tick + 1;
    const llegan = this._escenario.procesos().filter((p) => p.llegada === proximoTick);
    llegan.forEach((p) => simulador.registrarProceso({ pid: p.pid, memoria: p.memoria, cpu: p.cpu, eventoES: p.eventoES }));
    return llegan.map((p) => p.pid);
  }
}
