import type { IPlanificadorParaReglas, IReglaPostEjecucion } from '../contratos.js';
import type { IProcesoPlanificable } from '../../procesos/contratos.js';
import type { IGestorBloqueados } from '../../entrada-salida/contratos.js';
import type { IRegistroCambiosContexto } from '../../metricas/contratos.js';

// prioridad 2: el evento de e/s se dispara; se bloquea, conserva memoria y cuenta un cambio de contexto
export class ReglaBloqueoES implements IReglaPostEjecucion {
  constructor(
    private readonly _bloqueados: IGestorBloqueados,
    private readonly _metricas: IRegistroCambiosContexto,
  ) {}

  aplica(proceso: IProcesoPlanificable): boolean {
    return proceso.debeBloquearse();
  }

  ejecutar(proceso: IProcesoPlanificable, planificador: IPlanificadorParaReglas): void {
    proceso.bloquear();
    this._bloqueados.bloquear(proceso);
    planificador.liberarCpu();
    this._metricas.registrarCambioContexto();
  }
}
