import type { IFaseTick, IReloj } from '../contratos.js';
import type { ICalculadorMetricas } from '../../metricas/contratos.js';
import type { IInspectorMemoria } from '../../memoria/contratos.js';

// fase 4: avanza el reloj y recalcula las metricas
export class FaseRelojMetricas implements IFaseTick {
  constructor(
    private readonly _reloj: IReloj,
    private readonly _metricas: ICalculadorMetricas,
    private readonly _memoria: IInspectorMemoria,
  ) {}

  nombre(): string {
    return 'reloj-metricas';
  }

  ejecutar(): void {
    this._reloj.avanzar();
    this._metricas.recalcular(this._reloj.actual(), this._memoria);
  }
}
