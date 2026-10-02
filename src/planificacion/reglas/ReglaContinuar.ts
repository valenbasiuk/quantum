import type { IReglaPostEjecucion } from '../contratos.js';

// ultima regla de la cadena: siempre aplica y deja al proceso en la cpu
export class ReglaContinuar implements IReglaPostEjecucion {
  aplica(): boolean {
    return true;
  }

  ejecutar(): void {
    // el proceso sigue en cpu: no hay nada que cambiar
  }
}
