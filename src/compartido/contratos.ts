/** Contrato de verificación de reglas: centraliza cómo se rechaza un estado inválido. */
export interface IGuardia {
  asegurar(condicion: boolean, crearError: () => Error): void;
}

/** Contrato de validación de valores numéricos del dominio. */
export interface IValidadorEntero {
  exigirEnteroPositivo(valor: number, crearError: () => Error): void;
}
