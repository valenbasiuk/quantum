import type { IBloqueCandidato, IPoliticaAsignacion } from '../contratos.js';

// metodo plantilla (template method) para politicas de asignacion contigua
// todas comparten el flujo: filtrar bloques viables -> desempatar por direccion -> ordenar por criterio -> elegir el primero
export abstract class PoliticaAsignacion implements IPoliticaAsignacion {
  elegir<T extends IBloqueCandidato>(libres: readonly T[], tamano: number): T[] {
    return libres
      .filter((bloque) => bloque.cabe(tamano))
      .sort((a, b) => a.inicio() - b.inicio())
      .sort((a, b) => this.comparar(a, b))
      .slice(0, 1);
  }

  abstract nombre(): string;

  // define la preferencia de seleccion segun la politica concreta
  protected abstract comparar(a: IBloqueCandidato, b: IBloqueCandidato): number;
}
