import type {
  IBusquedaProcesos,
  IConsultaEstado,
  IConsultaMetricas,
  IConsultaProcesos,
  IConsultaTerminados,
  IEstadoSistema,
  IReloj,
} from './contratos.js';
import type { IInstantaneaProceso } from '../procesos/contratos.js';
import type { IColaListos, IDespachador } from '../planificacion/contratos.js';
import type { IConsultaAdmision } from '../admision/contratos.js';
import type { IConsultaBloqueados } from '../entrada-salida/contratos.js';
import type { IInspectorMemoria } from '../memoria/contratos.js';
import type { IMetricas, IProveedorMetricas } from '../metricas/contratos.js';

export interface FuentesConsulta {
  readonly reloj: IReloj;
  readonly procesos: IBusquedaProcesos;
  readonly planificador: IColaListos & IDespachador;
  readonly admision: IConsultaAdmision;
  readonly bloqueados: IConsultaBloqueados;
  readonly terminados: IConsultaTerminados;
  readonly memoria: IInspectorMemoria;
  readonly metricas: IProveedorMetricas;
}

// arma vistas de solo lectura (rf10): nunca devuelve objetos internos modificables
export class ServicioConsulta implements IConsultaEstado, IConsultaMetricas, IConsultaProcesos {
  constructor(private readonly _fuentes: FuentesConsulta) {}

  estado(): IEstadoSistema {
    const f = this._fuentes;
    return Object.freeze({
      tick: f.reloj.actual(),
      enCpu: f.planificador.procesoEnCpu(),
      listos: f.planificador.ordenListos(),
      esperandoMemoria: f.admision.pendientes(),
      bloqueados: f.bloqueados.bloqueados(),
      terminados: f.terminados.terminados(),
      mapaMemoria: f.memoria.mapa(),
    });
  }

  metricas(): IMetricas {
    return this._fuentes.metricas.actuales();
  }

  proceso(pid: string): IInstantaneaProceso {
    return this._fuentes.procesos.buscar(pid).instantanea();
  }

  procesos(): readonly IInstantaneaProceso[] {
    return Object.freeze(this._fuentes.procesos.todos().map((proceso) => proceso.instantanea()));
  }
}
