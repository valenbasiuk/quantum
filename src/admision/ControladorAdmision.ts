import type { IConsultaAdmision, IControladorAdmision, IReceptorAdmision } from './contratos.js';
import type { IProcesoAdmision } from '../procesos/contratos.js';
import type { IAsignadorMemoria } from '../memoria/contratos.js';
import type { IColaListos } from '../planificacion/contratos.js';
import { particionar } from '../compartido/particionar.js';

// admision (rf03): cada tick recorre los procesos nuevos y esperando memoria en orden
// de registro. el que consigue bloque pasa a listo; el que no, queda esperando
// sin impedir que los siguientes sean admitidos
export class ControladorAdmision implements IReceptorAdmision, IControladorAdmision, IConsultaAdmision {
  private _pendientes: IProcesoAdmision[] = [];

  constructor(
    private readonly _memoria: IAsignadorMemoria,
    private readonly _cola: IColaListos,
  ) {}

  agregar(proceso: IProcesoAdmision): void {
    this._pendientes.push(proceso);
  }

  admitir(): void {
    const [admitidos, sinMemoria] = particionar(this._pendientes, (proceso) =>
      this._memoria.asignar(proceso.pid(), proceso.memoriaRequerida()),
    );
    admitidos.forEach((proceso) => {
      proceso.admitir();
      this._cola.encolar(proceso);
    });
    sinMemoria.forEach((proceso) => proceso.esperarMemoria());
    this._pendientes = sinMemoria;
  }

  pendientes(): readonly string[] {
    return Object.freeze(this._pendientes.map((proceso) => proceso.pid()));
  }
}
