import type { IEventoES, IInstantaneaProceso, IProceso, ITablaTransiciones } from './contratos.js';
import type { IGuardia, IValidadorEntero } from '../compartido/contratos.js';
import { EstadoProceso } from './EstadoProceso.js';
import { EventoProceso } from './EventoProceso.js';
import { SinEventoES } from './EventoES.js';
import { tablaTransiciones } from './TablaTransiciones.js';
import { guardia } from '../compartido/Guardia.js';
import { validadorEntero } from '../compartido/ValidadorEntero.js';
import { EventoESInvalidoError, ProcesoInvalidoError, TransicionInvalidaError } from '../errores/ErrorDominio.js';

// bloque de control de proceso (pcb)
// protege contadores y transiciones: nadie cambia el estado sin pasar por la tabla de transiciones
export class Proceso implements IProceso {
  private _estado: EstadoProceso = EstadoProceso.NUEVO;
  private _cpuRestante: number;
  private _cpuConsumida = 0;
  private _quantumConsumido = 0;
  private _bloqueoRestante = 0;

  constructor(
    private readonly _pid: string,
    private readonly _memoriaRequerida: number,
    private readonly _cpuTotal: number,
    private readonly _eventoES: IEventoES = new SinEventoES(),
    private readonly _transiciones: ITablaTransiciones = tablaTransiciones,
    private readonly _guardia: IGuardia = guardia,
    validador: IValidadorEntero = validadorEntero,
  ) {
    this._guardia.asegurar(`${_pid}`.trim().length > 0, () => new ProcesoInvalidoError('el pid no puede estar vacio'));
    validador.exigirEnteroPositivo(
      _memoriaRequerida,
      () => new ProcesoInvalidoError(`memoria requerida invalida para ${_pid}: ${_memoriaRequerida}`),
    );
    validador.exigirEnteroPositivo(_cpuTotal, () => new ProcesoInvalidoError(`cpu total invalida para ${_pid}: ${_cpuTotal}`));
    this._guardia.asegurar(
      _eventoES.trasTicksCpu() < _cpuTotal,
      () => new EventoESInvalidoError(`la e/s de ${_pid} debe dispararse antes de terminar (cpu total ${_cpuTotal})`),
    );
    this._cpuRestante = _cpuTotal;
  }

  // consultas basicas del estado del proceso
  pid(): string {
    return this._pid;
  }

  memoriaRequerida(): number {
    return this._memoriaRequerida;
  }

  cpuTotal(): number {
    return this._cpuTotal;
  }

  cpuRestante(): number {
    return this._cpuRestante;
  }

  estado(): EstadoProceso {
    return this._estado;
  }

  quantumConsumido(): number {
    return this._quantumConsumido;
  }

  bloqueoRestante(): number {
    return this._bloqueoRestante;
  }

  termino(): boolean {
    return this._cpuRestante === 0;
  }

  agotoQuantum(quantum: number): boolean {
    return this._quantumConsumido >= quantum;
  }

  debeBloquearse(): boolean {
    return this._eventoES.seDisparaCon(this._cpuConsumida);
  }

  bloqueoVencido(): boolean {
    return this._bloqueoRestante === 0;
  }

  // transiciones controladas de estado
  esperarMemoria(): void {
    this._aplicar(EventoProceso.ESPERAR_MEMORIA);
  }

  admitir(): void {
    this._aplicar(EventoProceso.ADMITIR);
  }

  despachar(): void {
    this._aplicar(EventoProceso.DESPACHAR);
    this._quantumConsumido = 0;
  }

  expropiar(): void {
    this._aplicar(EventoProceso.EXPROPIAR);
    this._quantumConsumido = 0;
  }

  bloquear(): void {
    this._aplicar(EventoProceso.BLOQUEAR);
    this._bloqueoRestante = this._eventoES.duracion();
  }

  desbloquear(): void {
    this._aplicar(EventoProceso.DESBLOQUEAR);
  }

  terminar(): void {
    this._aplicar(EventoProceso.TERMINAR);
  }

  // contadores y avance protegido
  ejecutarUnidad(): void {
    this._exigirEstado(EstadoProceso.EJECUTANDO, 'ejecutar cpu');
    this._cpuRestante -= 1;
    this._cpuConsumida += 1;
    this._quantumConsumido += 1;
  }

  renovarQuantum(): void {
    this._exigirEstado(EstadoProceso.EJECUTANDO, 'renovar quantum');
    this._quantumConsumido = 0;
  }

  avanzarBloqueo(): void {
    this._exigirEstado(EstadoProceso.BLOQUEADO, 'avanzar el bloqueo');
    this._bloqueoRestante -= 1;
  }

  instantanea(): IInstantaneaProceso {
    return Object.freeze({
      pid: this._pid,
      memoriaRequerida: this._memoriaRequerida,
      cpuTotal: this._cpuTotal,
      cpuRestante: this._cpuRestante,
      estado: this._estado,
      quantumConsumido: this._quantumConsumido,
      bloqueoRestante: this._bloqueoRestante,
    });
  }

  // metodos internos auxiliares
  private _aplicar(evento: EventoProceso): void {
    this._guardia.asegurar(
      this._transiciones.permite(this._estado, evento),
      () => new TransicionInvalidaError(`${this._pid}: el evento ${evento} no es valido en estado ${this._estado}`),
    );
    this._estado = this._transiciones.destino(evento);
  }

  private _exigirEstado(esperado: EstadoProceso, accion: string): void {
    this._guardia.asegurar(
      this._estado === esperado,
      () => new TransicionInvalidaError(`${this._pid}: no puede ${accion} en estado ${this._estado}`),
    );
  }
}
