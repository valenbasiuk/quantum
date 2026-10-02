import type { IPlanificadorParaReglas, IReglaPostEjecucion } from '../contratos.js';
import type { IProcesoPlanificable } from '../../procesos/contratos.js';
import type { IRegistroCambiosContexto } from '../../metricas/contratos.js';

// prioridad 3: agoto el quantum y hay otros listos -> vuelve al final de la cola (cambio de contexto)
export class ReglaExpropiacionQuantum implements IReglaPostEjecucion {
  constructor(
    private readonly _quantum: number,
    private readonly _metricas: IRegistroCambiosContexto,
  ) {}

  aplica(proceso: IProcesoPlanificable, planificador: IPlanificadorParaReglas): boolean {
    return proceso.agotoQuantum(this._quantum) && planificador.hayListos();
  }

  ejecutar(proceso: IProcesoPlanificable, planificador: IPlanificadorParaReglas): void {
    proceso.expropiar();
    planificador.liberarCpu();
    planificador.encolar(proceso);
    this._metricas.registrarCambioContexto();
  }
}
