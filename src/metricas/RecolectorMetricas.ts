import type {
  ICalculadorMetricas,
  IMetricas,
  IProveedorMetricas,
  IRegistroCambiosContexto,
  IRegistroUsoCpu,
} from './contratos.js';
import type { IInspectorMemoria } from '../memoria/contratos.js';

// acumula contadores y calcula las seis metricas de rf09.
// los casos borde se resuelven con aritmetica, sin condicionales:
// - cpu en tick 0: el divisor es max(ticks, 1) y los ticks ocupados son 0 -> 0 %
// - fragmentacion con memoria libre 0: 100 * (1 - mayor/libre) = 100 * (libre - mayor) / libre;
//   si libre = 0 entonces mayor = 0 y con divisor max(libre, 1) el resultado es 0 %
export class RecolectorMetricas
  implements IRegistroCambiosContexto, IRegistroUsoCpu, ICalculadorMetricas, IProveedorMetricas
{
  private _cambiosContexto = 0;
  private _ticksCpuOcupada = 0;
  private _actuales: IMetricas;

  constructor(memoriaInicial: IInspectorMemoria) {
    this._actuales = this._calcular(0, memoriaInicial);
  }

  registrarCambioContexto(): void {
    this._cambiosContexto += 1;
  }

  registrarUsoCpu(procesosEjecutados: number): void {
    this._ticksCpuOcupada += procesosEjecutados;
  }

  recalcular(ticksTranscurridos: number, memoria: IInspectorMemoria): void {
    this._actuales = this._calcular(ticksTranscurridos, memoria);
  }

  actuales(): IMetricas {
    return this._actuales;
  }

  private _calcular(ticksTranscurridos: number, memoria: IInspectorMemoria): IMetricas {
    const libre = memoria.memoriaLibreTotal();
    const mayor = memoria.mayorBloqueLibre();
    return Object.freeze({
      ocupacionMemoria: (100 * memoria.memoriaOcupada()) / memoria.memoriaTotal(),
      utilizacionCpu: (100 * this._ticksCpuOcupada) / Math.max(ticksTranscurridos, 1),
      cambiosContexto: this._cambiosContexto,
      memoriaLibreTotal: libre,
      mayorBloqueLibre: mayor,
      fragmentacionExterna: (100 * (libre - mayor)) / Math.max(libre, 1),
    });
  }
}
