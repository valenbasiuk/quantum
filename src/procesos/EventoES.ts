import type { IEventoES } from './contratos.js';
import type { IValidadorEntero } from '../compartido/contratos.js';
import { validadorEntero } from '../compartido/ValidadorEntero.js';
import { EventoESInvalidoError } from '../errores/ErrorDominio.js';

// evento de e/s determinista
// tras trasTicksCpu de ejecucion el proceso pasa a bloqueado durante duracion ticks
export class EventoES implements IEventoES {
  constructor(
    private readonly _trasTicksCpu: number,
    private readonly _duracion: number,
    validador: IValidadorEntero = validadorEntero,
  ) {
    validador.exigirEnteroPositivo(
      _trasTicksCpu,
      () => new EventoESInvalidoError(`el disparo de e/s debe ser un entero positivo: ${_trasTicksCpu}`),
    );
    validador.exigirEnteroPositivo(
      _duracion,
      () => new EventoESInvalidoError(`la duracion de e/s debe ser un entero positivo: ${_duracion}`),
    );
  }

  trasTicksCpu(): number {
    return this._trasTicksCpu;
  }

  duracion(): number {
    return this._duracion;
  }

  seDisparaCon(cpuConsumida: number): boolean {
    return cpuConsumida === this._trasTicksCpu;
  }
}

// objeto nulo para procesos sin e/s
// evita chequear if (evento != null) en el ciclo principal
export class SinEventoES implements IEventoES {
  trasTicksCpu(): number {
    return 0;
  }

  duracion(): number {
    return 0;
  }

  seDisparaCon(): boolean {
    return false;
  }
}
