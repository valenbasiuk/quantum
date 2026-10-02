import type { IEventoES, IIdentificable, IInstantaneaProceso, IProceso } from '../procesos/contratos.js';
import type { IVistaBloque } from '../memoria/contratos.js';
import type { IMetricas } from '../metricas/contratos.js';
import type { OpcionesSimulacion } from '../configuracion/contratos.js';

// colaboradores internos

export interface IReloj {
  actual(): number;
  avanzar(): void;
}

export interface IRegistroTerminados {
  registrarTerminado(proceso: IIdentificable): void;
}

export interface IConsultaTerminados {
  terminados(): readonly string[];
}

export interface IAltaProcesos {
  alta(proceso: IProceso): void;
}

export interface IBusquedaProcesos {
  buscar(pid: string): IProceso;
  todos(): readonly IProceso[];
}

// una fase del tick (rf06). el simulador solo conoce este contrato
export interface IFaseTick {
  nombre(): string;
  ejecutar(): void;
}

// api publica del simulador (interfaces segregadas)

export interface SolicitudProceso {
  readonly pid: string;
  readonly memoria: number;
  readonly cpu: number;
  readonly eventoES?: IEventoES;
}

export interface IEstadoSistema {
  readonly tick: number;
  readonly enCpu: string | null;
  readonly listos: readonly string[];
  readonly esperandoMemoria: readonly string[];
  readonly bloqueados: readonly string[];
  readonly terminados: readonly string[];
  readonly mapaMemoria: readonly IVistaBloque[];
}

export interface IControlSimulacion {
  avanzarTick(): void;
}

export interface IRegistroDeProcesos {
  registrarProceso(solicitud: SolicitudProceso): IInstantaneaProceso;
}

export interface IConsultaProcesos {
  proceso(pid: string): IInstantaneaProceso;
  procesos(): readonly IInstantaneaProceso[];
}

export interface IConsultaEstado {
  estado(): IEstadoSistema;
}

export interface IConsultaMetricas {
  metricas(): IMetricas;
}

export type ISimulador = IControlSimulacion &
  IRegistroDeProcesos &
  IConsultaProcesos &
  IConsultaEstado &
  IConsultaMetricas;

// raiz de composicion: arma un simulador listo para usar a partir de las opciones
export interface IFabricaSimulador {
  crear(opciones: OpcionesSimulacion): ISimulador;
}
