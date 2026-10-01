import type { EstadoProceso } from './EstadoProceso.js';
import type { EventoProceso } from './EventoProceso.js';

// segregacion de interfaces para los procesos
// cada componente solo interactua con lo que necesita

export interface IIdentificable {
  pid(): string;
}

export interface IDemandanteMemoria {
  memoriaRequerida(): number;
}

export interface IConEstado {
  estado(): EstadoProceso;
}

export interface IConsumidorCpu {
  cpuTotal(): number;
  cpuRestante(): number;
  ejecutarUnidad(): void;
  termino(): boolean;
}

export interface IControlQuantum {
  quantumConsumido(): number;
  agotoQuantum(quantum: number): boolean;
  renovarQuantum(): void;
}

export interface IAdmisible {
  esperarMemoria(): void;
  admitir(): void;
}

export interface IDespachable {
  despachar(): void;
  expropiar(): void;
}

export interface IBloqueable {
  debeBloquearse(): boolean;
  bloquear(): void;
  avanzarBloqueo(): void;
  bloqueoVencido(): boolean;
  desbloquear(): void;
  bloqueoRestante(): number;
}

export interface IFinalizable {
  terminar(): void;
}

export interface IInstantaneable {
  instantanea(): IInstantaneaProceso;
}

// snapshot inmutable del proceso para reportes y metricas
export interface IInstantaneaProceso {
  readonly pid: string;
  readonly memoriaRequerida: number;
  readonly cpuTotal: number;
  readonly cpuRestante: number;
  readonly estado: EstadoProceso;
  readonly quantumConsumido: number;
  readonly bloqueoRestante: number;
}

// definicion del evento de e/s determinista
export interface IEventoES {
  trasTicksCpu(): number;
  duracion(): number;
  seDisparaCon(cpuConsumida: number): boolean;
}

// tabla para validar transiciones de estado permitidas
export interface ITablaTransiciones {
  permite(desde: EstadoProceso, evento: EventoProceso): boolean;
  destino(evento: EventoProceso): EstadoProceso;
}

// vistas compuestas segun el rol del consumidor

// lo que requiere el planificador y la cpu
export type IProcesoPlanificable = IIdentificable &
  IDespachable &
  IConsumidorCpu &
  IControlQuantum &
  IBloqueable &
  IFinalizable;

// lo que requiere la fase de admision
export type IProcesoAdmision = IIdentificable & IDemandanteMemoria & IAdmisible & IProcesoPlanificable;

// el proceso completo para el registro central
export type IProceso = IProcesoAdmision & IConEstado & IInstantaneable;
