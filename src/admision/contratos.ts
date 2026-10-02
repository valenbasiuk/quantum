import type { IProcesoAdmision } from '../procesos/contratos.js';

export interface IReceptorAdmision {
  agregar(proceso: IProcesoAdmision): void;
}

export interface IControladorAdmision {
  // intenta asignar memoria a todos los pendientes, en orden de registro (rf03)
  admitir(): void;
}

export interface IConsultaAdmision {
  pendientes(): readonly string[];
}
