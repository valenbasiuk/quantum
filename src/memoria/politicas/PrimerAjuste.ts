import type { IBloqueCandidato } from '../contratos.js';
import { PoliticaAsignacion } from './PoliticaAsignacion.js';

// politica first-fit: asigna en el primer bloque libre suficiente por direccion de memoria
export class PrimerAjuste extends PoliticaAsignacion {
  nombre(): string {
    return 'FIRST_FIT';
  }

  protected comparar(a: IBloqueCandidato, b: IBloqueCandidato): number {
    return a.inicio() - b.inicio();
  }
}
