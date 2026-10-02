import type { IActualizadorBloqueados, IConsultaBloqueados, IGestorBloqueados } from './contratos.js';
import type { IProcesoPlanificable } from '../procesos/contratos.js';
import type { IColaListos } from '../planificacion/contratos.js';
import { particionar } from '../compartido/particionar.js';

// mantiene los procesos bloqueados por e/s y sus temporizadores (rf08)
export class GestorES implements IGestorBloqueados, IActualizadorBloqueados, IConsultaBloqueados {
  private _bloqueados: IProcesoPlanificable[] = [];

  bloquear(proceso: IProcesoPlanificable): void {
    this._bloqueados.push(proceso);
  }

  actualizar(cola: IColaListos): void {
    this._bloqueados.forEach((proceso) => proceso.avanzarBloqueo());
    const [vencidos, pendientes] = particionar(this._bloqueados, (proceso) => proceso.bloqueoVencido());
    vencidos.forEach((proceso) => {
      proceso.desbloquear();
      cola.encolar(proceso);
    });
    this._bloqueados = pendientes;
  }

  bloqueados(): readonly string[] {
    return Object.freeze(this._bloqueados.map((proceso) => proceso.pid()));
  }
}
