import type { IReglaPostEjecucion } from '../contratos.js';
import type { IProcesoPlanificable } from '../../procesos/contratos.js';

// prioridad 4: agoto el quantum pero no hay otros listos -> renueva y sigue, sin cambio de contexto
export class ReglaRenovacionQuantum implements IReglaPostEjecucion {
  constructor(private readonly _quantum: number) {}

  aplica(proceso: IProcesoPlanificable): boolean {
    return proceso.agotoQuantum(this._quantum);
  }

  ejecutar(proceso: IProcesoPlanificable): void {
    proceso.renovarQuantum();
  }
}
