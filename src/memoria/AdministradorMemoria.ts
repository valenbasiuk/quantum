import type {
  IAsignadorMemoria,
  IInspectorMemoria,
  ILiberadorMemoria,
  IPoliticaAsignacion,
  IVistaBloque,
} from './contratos.js';
import type { IGuardia, IValidadorEntero } from '../compartido/contratos.js';
import { BloqueLibre, type BloqueMemoria } from './BloqueMemoria.js';
import { guardia } from '../compartido/Guardia.js';
import { validadorEntero } from '../compartido/ValidadorEntero.js';
import { AsignacionInvalidaError, ProcesoInexistenteError } from '../errores/ErrorDominio.js';

// administra la lista ordenada de bloques contiguos en la memoria simulada
// invariantes: bloques ordenados por direccion, contiguos, sin solapamiento,
// sin tamano cero, suma igual a memoria total, y sin dos libres adyacentes (coalescencia al liberar)
// la politica de asignacion se inyecta por constructor (inversion de dependencias)
export class AdministradorMemoria implements IAsignadorMemoria, ILiberadorMemoria, IInspectorMemoria {
  private _bloques: BloqueMemoria[];

  constructor(
    private readonly _memoriaTotal: number,
    private readonly _politica: IPoliticaAsignacion,
    private readonly _guardia: IGuardia = guardia,
    private readonly _validador: IValidadorEntero = validadorEntero,
  ) {
    this._validador.exigirEnteroPositivo(
      _memoriaTotal,
      () => new AsignacionInvalidaError(`memoria total invalida: ${_memoriaTotal}`),
    );
    this._bloques = [new BloqueLibre(0, _memoriaTotal)];
  }

  asignar(pid: string, tamano: number): boolean {
    this._validador.exigirEnteroPositivo(tamano, () => new AsignacionInvalidaError(`tamano invalido: ${tamano}`));
    this._guardia.asegurar(
      !this._bloques.some((bloque) => bloque.perteneceA(pid)),
      () => new AsignacionInvalidaError(`${pid} ya tiene memoria asignada`),
    );
    const elegidos = this._politica.elegir(this._libres(), tamano);
    elegidos.forEach((bloque) => this._reemplazar(bloque, bloque.asignar(pid, tamano)));
    return elegidos.length > 0;
  }

  liberar(pid: string): void {
    const indice = this._bloques.findIndex((bloque) => bloque.perteneceA(pid));
    this._guardia.asegurar(indice >= 0, () => new ProcesoInexistenteError(`${pid} no tiene memoria asignada`));
    this._bloques.splice(indice, 1, this._bloques[indice].liberar());
    // se aplica coalescencia para fusionar bloques libres contiguos
    this._bloques = this._coalescer(this._bloques);
  }

  memoriaTotal(): number {
    return this._memoriaTotal;
  }

  memoriaLibreTotal(): number {
    return this._sumar(this._libres());
  }

  memoriaOcupada(): number {
    return this._memoriaTotal - this.memoriaLibreTotal();
  }

  mayorBloqueLibre(): number {
    return Math.max(0, ...this._libres().map((bloque) => bloque.tamano()));
  }

  mapa(): readonly IVistaBloque[] {
    return Object.freeze(this._bloques.map((bloque) => bloque.vista()));
  }

  // helpers internos

  private _libres(): BloqueLibre[] {
    return this._bloques.flatMap((bloque) => bloque.comoLibre());
  }

  private _reemplazar(viejo: BloqueMemoria, nuevos: BloqueMemoria[]): void {
    this._bloques.splice(this._bloques.indexOf(viejo), 1, ...nuevos);
  }

  // recorre de izquierda a derecha y fusiona bloques libres contiguos
  private _coalescer(bloques: readonly BloqueMemoria[]): BloqueMemoria[] {
    return bloques
      .slice(1)
      .reduce<BloqueMemoria[]>(
        (resultado, bloque) => [...resultado.slice(0, -1), ...bloque.anexarTrasDe(resultado[resultado.length - 1])],
        [bloques[0]],
      );
  }

  private _sumar(bloques: readonly BloqueMemoria[]): number {
    return bloques.reduce((total, bloque) => total + bloque.tamano(), 0);
  }
}
