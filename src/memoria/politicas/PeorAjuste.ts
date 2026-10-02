import type { IBloqueCandidato } from '../contratos.js';
import { PoliticaAsignacion } from './PoliticaAsignacion.js';

// politica worst-fit: busca el bloque libre mas grande donde quepa el proceso
// deja el mayor sobrante posible para futuros procesos de tamano medio
export class PeorAjuste extends PoliticaAsignacion {
  nombre(): string {
    return 'WORST_FIT';
  }

  protected comparar(a: IBloqueCandidato, b: IBloqueCandidato): number {
    return b.tamano() - a.tamano();
  }
}
