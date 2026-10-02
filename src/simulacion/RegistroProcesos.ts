import type { IAltaProcesos, IBusquedaProcesos, IConsultaTerminados, IRegistroTerminados } from './contratos.js';
import type { IIdentificable, IProceso } from '../procesos/contratos.js';
import type { IGuardia } from '../compartido/contratos.js';
import { guardia } from '../compartido/Guardia.js';
import { PidDuplicadoError, ProcesoInexistenteError } from '../errores/ErrorDominio.js';

// coleccion de todos los procesos en orden de registro (map conserva el orden de insercion)
// y lista de terminados en orden de finalizacion
export class RegistroProcesos implements IAltaProcesos, IBusquedaProcesos, IRegistroTerminados, IConsultaTerminados {
  private readonly _procesos = new Map<string, IProceso>();
  private readonly _terminados: string[] = [];

  constructor(private readonly _guardia: IGuardia = guardia) {}

  alta(proceso: IProceso): void {
    this._guardia.asegurar(
      !this._procesos.has(proceso.pid()),
      () => new PidDuplicadoError(`Ya existe un proceso con PID ${proceso.pid()}`),
    );
    this._procesos.set(proceso.pid(), proceso);
  }

  buscar(pid: string): IProceso {
    this._guardia.asegurar(this._procesos.has(pid), () => new ProcesoInexistenteError(`No existe el proceso ${pid}`));
    return this._procesos.get(pid) as IProceso;
  }

  todos(): readonly IProceso[] {
    return Object.freeze([...this._procesos.values()]);
  }

  registrarTerminado(proceso: IIdentificable): void {
    this._terminados.push(proceso.pid());
  }

  terminados(): readonly string[] {
    return Object.freeze([...this._terminados]);
  }
}
