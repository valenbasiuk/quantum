import type { IGuardia } from './contratos.js';

type Resolucion = (crearError: () => Error) => void;

/**
 * Punto único de rechazo de reglas del dominio.
 * En lugar de un `if`, la condición se usa como clave de una tabla de resoluciones:
 * `true` no hace nada y `false` lanza el error del dominio.
 */
export class Guardia implements IGuardia {
  private static readonly _RESOLUCIONES: Readonly<Record<'true' | 'false', Resolucion>> = {
    true: () => undefined,
    false: (crearError) => {
      throw crearError();
    },
  };

  asegurar(condicion: boolean, crearError: () => Error): void {
    Guardia._RESOLUCIONES[`${condicion}`](crearError);
  }
}

export const guardia: IGuardia = new Guardia();
