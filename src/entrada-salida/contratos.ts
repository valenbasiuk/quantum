import type { IProcesoPlanificable } from '../procesos/contratos.js';
import type { IColaListos } from '../planificacion/contratos.js';

// interfaz para bloquear procesos
export interface IGestorBloqueados {
  bloquear(proceso: IProcesoPlanificable): void;
}

// descuenta un tick a cada bloqueado y devuelve a listos los que vencieron
export interface IActualizadorBloqueados {
  actualizar(cola: IColaListos): void;
}

// consulta de pids bloqueados actualmente
export interface IConsultaBloqueados {
  bloqueados(): readonly string[];
}
