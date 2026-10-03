// raiz de los errores del simulador. la herencia aqui esta justificada:
// cada error concreto es un ErrorDominio y puede capturarse por la base.
// permite distinguir fallos de reglas de negocio de bugs no controlados
export class ErrorDominio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

// Errores de configuracion y creacion
export class ConfiguracionInvalidaError extends ErrorDominio {}
export class ProcesoInvalidoError extends ErrorDominio {}
export class PidDuplicadoError extends ErrorDominio {}
export class ProcesoInexistenteError extends ErrorDominio {}

// Errores de recursos y ciclo de vida
export class MemoriaExcedidaError extends ErrorDominio {}
export class TransicionInvalidaError extends ErrorDominio {}
export class EventoESInvalidoError extends ErrorDominio {}
export class AsignacionInvalidaError extends ErrorDominio {}
export class ColaInvalidaError extends ErrorDominio {}
