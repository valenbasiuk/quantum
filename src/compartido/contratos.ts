// interfaz de clase guardia con aseguraciones de reglas
export interface IGuardia {
  asegurar(condicion: boolean, crearError: () => Error): void;
}
// validador de enteros positivos
export interface IValidadorEntero {
  exigirEnteroPositivo(valor: number, crearError: () => Error): void;
}

/*
todo: definir contratos para otros componentes
*/