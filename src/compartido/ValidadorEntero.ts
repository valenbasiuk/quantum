import type { IGuardia, IValidadorEntero } from './contratos.js';
import { guardia } from './Guardia.js';

// valida que un parametro del dominio sea un entero estrictamente positivo
export class ValidadorEntero implements IValidadorEntero {
  constructor(private readonly _guardia: IGuardia = guardia) {}

  exigirEnteroPositivo(valor: number, crearError: () => Error): void {
    const condiciones = [Number.isInteger(valor), valor > 0];
    this._guardia.asegurar(condiciones.every(Boolean), crearError);
  }
}

export const validadorEntero: IValidadorEntero = new ValidadorEntero();
