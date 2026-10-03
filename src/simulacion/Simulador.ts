import type {
  IConsultaEstado,
  IConsultaMetricas,
  IConsultaProcesos,
  IEstadoSistema,
  IFaseTick,
  IRegistroDeProcesos,
  ISimulador,
  SolicitudProceso,
} from './contratos.js';
import type { IInstantaneaProceso } from '../procesos/contratos.js';
import type { IMetricas } from '../metricas/contratos.js';
import type { OpcionesSimulacion } from '../configuracion/contratos.js';
import { FabricaSimulador } from './FabricaSimulador.js';

// fachada del simulador. coordina las fases del tick en el orden recibido (rf06) y
// delega registro y consultas. no contiene logica de memoria, cpu ni e/s: solo compone
export class Simulador implements ISimulador {
  constructor(
    private readonly _fases: readonly IFaseTick[],
    private readonly _registro: IRegistroDeProcesos,
    private readonly _consulta: IConsultaEstado & IConsultaMetricas & IConsultaProcesos,
  ) {}

  // punto de entrada habitual: valida la configuracion y arma todas las partes
  static crear(opciones: OpcionesSimulacion = {}): Simulador {
    return new FabricaSimulador().crear(opciones);
  }

  avanzarTick(): void {
    this._fases.forEach((fase) => fase.ejecutar());
  }

  registrarProceso(solicitud: SolicitudProceso): IInstantaneaProceso {
    return this._registro.registrarProceso(solicitud);
  }

  proceso(pid: string): IInstantaneaProceso {
    return this._consulta.proceso(pid);
  }

  procesos(): readonly IInstantaneaProceso[] {
    return this._consulta.procesos();
  }

  estado(): IEstadoSistema {
    return this._consulta.estado();
  }

  metricas(): IMetricas {
    return this._consulta.metricas();
  }
}
