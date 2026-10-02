import type { IBloqueCandidato } from '../contratos.js';
import { PoliticaAsignacion } from './PoliticaAsignacion.js';

// politica best-fit: busca el bloque libre de menor tamano donde quepa el proceso
// minimiza el desperdicio o fragmentacion interna inmediata
export class MejorAjuste extends PoliticaAsignacion {
  nombre(): string {
    return 'BEST_FIT';
  }

  protected comparar(a: IBloqueCandidato, b: IBloqueCandidato): number {
    return a.tamano() - b.tamano();
  }
}
