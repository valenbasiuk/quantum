// vista inmutable de un bloque para consultas y reportes de estado
export interface IVistaBloque {
  readonly inicio: number;
  readonly tamano: number;
  readonly fin: number;
  readonly libre: boolean;
  readonly pid: string | null;
}

// ubicacion basica de un bloque en la memoria contigua
export interface IUbicacionBloque {
  inicio(): number;
  tamano(): number;
  fin(): number;
}

export interface IBloqueMemoria extends IUbicacionBloque {
  estaLibre(): boolean;
  pid(): string | null;
  perteneceA(pid: string): boolean;
  vista(): IVistaBloque;
}

// bloque libre visto por una politica de asignacion
export interface IBloqueCandidato extends IUbicacionBloque {
  cabe(tamano: number): boolean;
}

// estrategia de asignacion contigua (first fit, best fit, worst fit)
export interface IPoliticaAsignacion {
  nombre(): string;
  elegir<T extends IBloqueCandidato>(libres: readonly T[], tamano: number): T[];
}

// interfaces segregadas para el administrador de memoria

export interface IAsignadorMemoria {
  asignar(pid: string, tamano: number): boolean;
}

export interface ILiberadorMemoria {
  liberar(pid: string): void;
}

export interface IInspectorMemoria {
  memoriaTotal(): number;
  memoriaOcupada(): number;
  memoriaLibreTotal(): number;
  mayorBloqueLibre(): number;
  mapa(): readonly IVistaBloque[];
}
