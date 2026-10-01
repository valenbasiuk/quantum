import type { ITablaTransiciones } from './contratos.js';
import { EstadoProceso } from './EstadoProceso.js';
import { EventoProceso } from './EventoProceso.js';

const { NUEVO, ESPERANDO_MEMORIA, LISTO, EJECUTANDO, BLOQUEADO, TERMINADO } = EstadoProceso;

interface Transicion {
  readonly desde: ReadonlySet<EstadoProceso>;
  readonly hacia: EstadoProceso;
}

// maquina de estados declarativa: (estado actual, evento) -> estado siguiente
// mapea directamente el diagrama de estados del simulador
// cumple ocp: para sumar una transicion agregamos una fila a la tabla sin tocar proceso
export class TablaTransiciones implements ITablaTransiciones {
  private readonly _transiciones: ReadonlyMap<EventoProceso, Transicion> = new Map([
    [EventoProceso.ESPERAR_MEMORIA, { desde: new Set([NUEVO, ESPERANDO_MEMORIA]), hacia: ESPERANDO_MEMORIA }],
    [EventoProceso.ADMITIR, { desde: new Set([NUEVO, ESPERANDO_MEMORIA]), hacia: LISTO }],
    [EventoProceso.DESPACHAR, { desde: new Set([LISTO]), hacia: EJECUTANDO }],
    [EventoProceso.EXPROPIAR, { desde: new Set([EJECUTANDO]), hacia: LISTO }],
    [EventoProceso.BLOQUEAR, { desde: new Set([EJECUTANDO]), hacia: BLOQUEADO }],
    [EventoProceso.DESBLOQUEAR, { desde: new Set([BLOQUEADO]), hacia: LISTO }],
    [EventoProceso.TERMINAR, { desde: new Set([EJECUTANDO]), hacia: TERMINADO }],
  ]);

  permite(desde: EstadoProceso, evento: EventoProceso): boolean {
    return this._transicion(evento).desde.has(desde);
  }

  destino(evento: EventoProceso): EstadoProceso {
    return this._transicion(evento).hacia;
  }

  private _transicion(evento: EventoProceso): Transicion {
    return this._transiciones.get(evento) as Transicion;
  }
}

export const tablaTransiciones: ITablaTransiciones = new TablaTransiciones();
