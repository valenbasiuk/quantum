import type { IProcesoPlanificable } from '../procesos/contratos.js';

// cola fifo de procesos listos
export interface IColaListos {
  encolar(proceso: IProcesoPlanificable): void;
  hayListos(): boolean;
  ordenListos(): readonly string[];
}

// ocupacion de la cpu (capacidad 1)
export interface IDespachador {
  despacharSiLibre(): void;
  procesoEnCpu(): string | null;
}

export interface IEjecutorCpu {
  // ejecuta una unidad de cpu y devuelve cuantos procesos ejecutaron (0 o 1)
  ejecutarUnidad(): number;
}

export interface ILiberadorCpu {
  liberarCpu(): void;
}

// lo que una regla puede hacer sobre el planificador despues de ejecutar
export type IPlanificadorParaReglas = IColaListos & ILiberadorCpu;

// regla que decide que pasa con el proceso despues de consumir una unidad de cpu
// las reglas se evaluan en orden de prioridad (cadena de responsabilidad):
// finalizar -> bloqueo por e/s -> expropiacion por quantum -> renovacion -> continuar
export interface IReglaPostEjecucion {
  aplica(proceso: IProcesoPlanificable, planificador: IPlanificadorParaReglas): boolean;
  ejecutar(proceso: IProcesoPlanificable, planificador: IPlanificadorParaReglas): void;
}
