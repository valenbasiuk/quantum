import type { IInspectorMemoria } from '../memoria/contratos.js';

// metricas del sistema (rf09), recalculadas al final de cada tick
export interface IMetricas {
  readonly ocupacionMemoria: number;
  readonly utilizacionCpu: number;
  readonly cambiosContexto: number;
  readonly memoriaLibreTotal: number;
  readonly mayorBloqueLibre: number;
  readonly fragmentacionExterna: number;
}

export interface IRegistroCambiosContexto {
  registrarCambioContexto(): void;
}

export interface IRegistroUsoCpu {
  registrarUsoCpu(procesosEjecutados: number): void;
}

export interface ICalculadorMetricas {
  recalcular(ticksTranscurridos: number, memoria: IInspectorMemoria): void;
}

export interface IProveedorMetricas {
  actuales(): IMetricas;
}
