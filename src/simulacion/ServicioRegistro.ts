import type { IAltaProcesos, IRegistroDeProcesos, SolicitudProceso } from './contratos.js';
import type { IInstantaneaProceso } from '../procesos/contratos.js';
import type { IReceptorAdmision } from '../admision/contratos.js';
import type { IInspectorMemoria } from '../memoria/contratos.js';
import type { IGuardia } from '../compartido/contratos.js';
import { Proceso } from '../procesos/Proceso.js';
import { SinEventoES } from '../procesos/EventoES.js';
import { guardia } from '../compartido/Guardia.js';
import { MemoriaExcedidaError } from '../errores/ErrorDominio.js';

// alta de procesos (rf02). primero se construye y valida el proceso, despues se
// controla que quepa en la memoria total y recien entonces se registra: si algo
// falla, el sistema queda exactamente como estaba
export class ServicioRegistro implements IRegistroDeProcesos {
  constructor(
    private readonly _registro: IAltaProcesos,
    private readonly _admision: IReceptorAdmision,
    private readonly _memoria: IInspectorMemoria,
    private readonly _guardia: IGuardia = guardia,
  ) {}

  registrarProceso({ pid, memoria, cpu, eventoES = new SinEventoES() }: SolicitudProceso): IInstantaneaProceso {
    const proceso = new Proceso(pid, memoria, cpu, eventoES);
    this._guardia.asegurar(
      memoria <= this._memoria.memoriaTotal(),
      () => new MemoriaExcedidaError(`${pid} pide ${memoria} KB y la memoria total es ${this._memoria.memoriaTotal()} KB`),
    );
    this._registro.alta(proceso);
    this._admision.agregar(proceso);
    return proceso.instantanea();
  }
}
