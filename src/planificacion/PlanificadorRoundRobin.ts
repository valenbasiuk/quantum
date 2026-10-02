import type { IColaListos, IDespachador, IEjecutorCpu, ILiberadorCpu, IReglaPostEjecucion } from './contratos.js';
import type { IProcesoPlanificable } from '../procesos/contratos.js';
import type { IGuardia } from '../compartido/contratos.js';
import { guardia } from '../compartido/Guardia.js';
import { ColaInvalidaError } from '../errores/ErrorDominio.js';

// planificador round-robin (rf07): administra la cola fifo de listos y la cpu.
// la cpu se modela como una coleccion de capacidad 1: despachar es "llenar la
// capacidad libre desde el frente de la cola", sin preguntar si esta vacia.
// que hacer despues de ejecutar lo deciden las reglas inyectadas, en orden.
export class PlanificadorRoundRobin implements IColaListos, IDespachador, IEjecutorCpu, ILiberadorCpu {
  private static readonly _CAPACIDAD_CPU = 1;
  private readonly _listos: IProcesoPlanificable[] = [];
  private _cpu: IProcesoPlanificable[] = [];

  constructor(
    private readonly _reglas: readonly IReglaPostEjecucion[],
    private readonly _guardia: IGuardia = guardia,
  ) {}

  encolar(proceso: IProcesoPlanificable): void {
    this._guardia.asegurar(
      ![...this._listos, ...this._cpu].includes(proceso),
      () => new ColaInvalidaError(`${proceso.pid()} ya está en Listos o en CPU`),
    );
    this._listos.push(proceso);
  }

  hayListos(): boolean {
    return this._listos.length > 0;
  }

  ordenListos(): readonly string[] {
    return Object.freeze(this._listos.map((proceso) => proceso.pid()));
  }

  despacharSiLibre(): void {
    const entrantes = this._listos.splice(0, PlanificadorRoundRobin._CAPACIDAD_CPU - this._cpu.length);
    entrantes.forEach((proceso) => proceso.despachar());
    this._cpu.push(...entrantes);
  }

  procesoEnCpu(): string | null {
    return this._cpu.map((proceso) => proceso.pid())[0] ?? null;
  }

  ejecutarUnidad(): number {
    const enEjecucion = [...this._cpu];
    enEjecucion.forEach((proceso) => {
      proceso.ejecutarUnidad();
      this._reglaAplicable(proceso).ejecutar(proceso, this);
    });
    return enEjecucion.length;
  }

  liberarCpu(): void {
    this._cpu = [];
  }

  private _reglaAplicable(proceso: IProcesoPlanificable): IReglaPostEjecucion {
    return this._reglas.find((regla) => regla.aplica(proceso, this)) as IReglaPostEjecucion;
  }
}
