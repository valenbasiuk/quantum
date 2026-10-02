import type { IReloj } from './contratos.js';

// reloj logico: empieza en 0 y solo avanza de a una unidad. no usa el tiempo real
export class Reloj implements IReloj {
  private _tick = 0;

  actual(): number {
    return this._tick;
  }

  avanzar(): void {
    this._tick += 1;
  }
}
