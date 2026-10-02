import type { IPlanificadorParaReglas, IReglaPostEjecucion } from '../contratos.js';
import type { IProcesoPlanificable } from '../../procesos/contratos.js';
import type { ILiberadorMemoria } from '../../memoria/contratos.js';
import type { IRegistroTerminados } from '../../simulacion/contratos.js';

// prioridad 1: si la cpu restante llego a 0, termina, libera memoria y cpu en este mismo tick
export class ReglaFinalizacion implements IReglaPostEjecucion {
  constructor(
    private readonly _memoria: ILiberadorMemoria,
    private readonly _terminados: IRegistroTerminados,
  ) {}

  aplica(proceso: IProcesoPlanificable): boolean {
    return proceso.termino();
  }

  ejecutar(proceso: IProcesoPlanificable, planificador: IPlanificadorParaReglas): void {
    proceso.terminar();
    this._memoria.liberar(proceso.pid());
    this._terminados.registrarTerminado(proceso);
    planificador.liberarCpu();
  }
}
