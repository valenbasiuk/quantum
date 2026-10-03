import type { IFaseTick } from '../contratos.js';
import type { IActualizadorBloqueados } from '../../entrada-salida/contratos.js';
import type { IColaListos } from '../../planificacion/contratos.js';

// fase 2: actualizacion de bloqueados; los vencidos vuelven al final de listos
export class FaseBloqueados implements IFaseTick {
  constructor(
    private readonly _bloqueados: IActualizadorBloqueados,
    private readonly _cola: IColaListos,
  ) {}

  nombre(): string {
    return 'bloqueados';
  }

  ejecutar(): void {
    this._bloqueados.actualizar(this._cola);
  }
}
