import type { IFaseTick } from '../contratos.js';
import type { IDespachador, IEjecutorCpu } from '../../planificacion/contratos.js';
import type { IRegistroUsoCpu } from '../../metricas/contratos.js';

// fase 3: despacho y ejecucion round-robin de, como maximo, una unidad de cpu
export class FaseCpu implements IFaseTick {
  constructor(
    private readonly _planificador: IDespachador & IEjecutorCpu,
    private readonly _metricas: IRegistroUsoCpu,
  ) {}

  nombre(): string {
    return 'cpu';
  }

  ejecutar(): void {
    this._planificador.despacharSiLibre();
    this._metricas.registrarUsoCpu(this._planificador.ejecutarUnidad());
  }
}
