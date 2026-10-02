import type { IPoliticaAsignacion } from '../memoria/contratos.js';

// parametros de configuracion del simulador
export interface IConfiguracionSimulacion {
  memoriaTotal(): number;
  quantum(): number;
  politica(): IPoliticaAsignacion;
}

// opciones de entrada con valores por defecto (referencia de la consigna: 1024 KB, quantum 2)
export interface OpcionesSimulacion {
  readonly memoriaTotal?: number;
  readonly quantum?: number;
  readonly politica?: IPoliticaAsignacion;
}
