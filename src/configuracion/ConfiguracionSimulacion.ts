import type { IConfiguracionSimulacion, OpcionesSimulacion } from './contratos.js';
import type { IPoliticaAsignacion } from '../memoria/contratos.js';
import { PrimerAjuste } from '../memoria/politicas/PrimerAjuste.js';
import { validadorEntero } from '../compartido/ValidadorEntero.js';
import { ConfiguracionInvalidaError } from '../errores/ErrorDominio.js';

// configuracion validada e inmutable del simulador (rf01)
// si la configuracion es invalida falla antes de construir cualquier componente
export class ConfiguracionSimulacion implements IConfiguracionSimulacion {
  static readonly MEMORIA_REFERENCIA = 1024;
  static readonly QUANTUM_REFERENCIA = 2;

  private constructor(
    private readonly _memoriaTotal: number,
    private readonly _quantum: number,
    private readonly _politica: IPoliticaAsignacion,
  ) {}

  // factory con valores por defecto de la consigna
  static crear({
    memoriaTotal = ConfiguracionSimulacion.MEMORIA_REFERENCIA,
    quantum = ConfiguracionSimulacion.QUANTUM_REFERENCIA,
    politica = new PrimerAjuste(),
  }: OpcionesSimulacion = {}): ConfiguracionSimulacion {
    validadorEntero.exigirEnteroPositivo(
      memoriaTotal,
      () => new ConfiguracionInvalidaError(`la memoria total debe ser un entero positivo: ${memoriaTotal}`),
    );
    validadorEntero.exigirEnteroPositivo(
      quantum,
      () => new ConfiguracionInvalidaError(`el quantum debe ser un entero positivo: ${quantum}`),
    );
    return new ConfiguracionSimulacion(memoriaTotal, quantum, politica);
  }

  memoriaTotal(): number {
    return this._memoriaTotal;
  }

  quantum(): number {
    return this._quantum;
  }

  politica(): IPoliticaAsignacion {
    return this._politica;
  }
}
