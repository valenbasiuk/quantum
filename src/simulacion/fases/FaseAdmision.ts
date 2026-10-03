import type { IFaseTick } from '../contratos.js';
import type { IControladorAdmision } from '../../admision/contratos.js';

// fase 1: admision e intento de asignacion de memoria
export class FaseAdmision implements IFaseTick {
  constructor(private readonly _admision: IControladorAdmision) {}

  nombre(): string {
    return 'admision';
  }

  ejecutar(): void {
    this._admision.admitir();
  }
}
