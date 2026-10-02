import type { IBloqueCandidato, IBloqueMemoria, IVistaBloque } from './contratos.js';

// particion contigua e inmutable de la memoria
// clase abstracta base: bloque libre y bloque ocupado heredan y cambian el comportamiento
export abstract class BloqueMemoria implements IBloqueMemoria {
  protected constructor(
    protected readonly _inicio: number,
    protected readonly _tamano: number,
  ) {}

  inicio(): number {
    return this._inicio;
  }

  tamano(): number {
    return this._tamano;
  }

  fin(): number {
    return this._inicio + this._tamano;
  }

  vista(): IVistaBloque {
    return Object.freeze({
      inicio: this._inicio,
      tamano: this._tamano,
      fin: this.fin(),
      libre: this.estaLibre(),
      pid: this.pid(),
    });
  }

  abstract estaLibre(): boolean;
  abstract pid(): string | null;
  abstract perteneceA(pid: string): boolean;

  // filtra bloques libres sin preguntar por tipo en el llamador
  abstract comoLibre(): BloqueLibre[];

  // convierte el bloque a libre
  abstract liberar(): BloqueMemoria;

  // coalescencia por doble despacho: un bloque se anexa detras del anterior
  // si dos bloques contiguos son libres se absorben en uno solo mas grande
  abstract anexarTrasDe(anterior: BloqueMemoria): BloqueMemoria[];
  abstract absorberLibre(libre: BloqueLibre): BloqueMemoria[];
}

export class BloqueLibre extends BloqueMemoria implements IBloqueCandidato {
  constructor(inicio: number, tamano: number) {
    super(inicio, tamano);
  }

  estaLibre(): boolean {
    return true;
  }

  pid(): string | null {
    return null;
  }

  perteneceA(): boolean {
    return false;
  }

  cabe(tamano: number): boolean {
    return tamano <= this._tamano;
  }

  comoLibre(): BloqueLibre[] {
    return [this];
  }

  liberar(): BloqueMemoria {
    return this;
  }

  // divide el bloque: ocupado al inicio y sobrante libre si tamano < total
  asignar(pid: string, tamano: number): BloqueMemoria[] {
    const partes: BloqueMemoria[] = [
      new BloqueOcupado(this._inicio, tamano, pid),
      new BloqueLibre(this._inicio + tamano, this._tamano - tamano),
    ];
    return partes.filter((parte) => parte.tamano() > 0);
  }

  anexarTrasDe(anterior: BloqueMemoria): BloqueMemoria[] {
    return anterior.absorberLibre(this);
  }

  absorberLibre(libre: BloqueLibre): BloqueMemoria[] {
    return [new BloqueLibre(this._inicio, this._tamano + libre.tamano())];
  }
}

export class BloqueOcupado extends BloqueMemoria {
  constructor(
    inicio: number,
    tamano: number,
    private readonly _pid: string,
  ) {
    super(inicio, tamano);
  }

  estaLibre(): boolean {
    return false;
  }

  pid(): string | null {
    return this._pid;
  }

  perteneceA(pid: string): boolean {
    return this._pid === pid;
  }

  comoLibre(): BloqueLibre[] {
    return [];
  }

  liberar(): BloqueMemoria {
    return new BloqueLibre(this._inicio, this._tamano);
  }

  anexarTrasDe(anterior: BloqueMemoria): BloqueMemoria[] {
    return [anterior, this];
  }

  absorberLibre(libre: BloqueLibre): BloqueMemoria[] {
    return [this, libre];
  }
}
