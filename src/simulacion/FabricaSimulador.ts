import type { IFabricaSimulador, IFaseTick } from './contratos.js';
import type { IConfiguracionSimulacion, OpcionesSimulacion } from '../configuracion/contratos.js';
import type { IReglaPostEjecucion } from '../planificacion/contratos.js';
import type { ILiberadorMemoria } from '../memoria/contratos.js';
import type { IGestorBloqueados } from '../entrada-salida/contratos.js';
import type { IRegistroCambiosContexto } from '../metricas/contratos.js';
import type { IRegistroTerminados } from './contratos.js';
import { ConfiguracionSimulacion } from '../configuracion/ConfiguracionSimulacion.js';
import { AdministradorMemoria } from '../memoria/AdministradorMemoria.js';
import { PlanificadorRoundRobin } from '../planificacion/PlanificadorRoundRobin.js';
import { ReglaFinalizacion } from '../planificacion/reglas/ReglaFinalizacion.js';
import { ReglaBloqueoES } from '../planificacion/reglas/ReglaBloqueoES.js';
import { ReglaExpropiacionQuantum } from '../planificacion/reglas/ReglaExpropiacionQuantum.js';
import { ReglaRenovacionQuantum } from '../planificacion/reglas/ReglaRenovacionQuantum.js';
import { ReglaContinuar } from '../planificacion/reglas/ReglaContinuar.js';
import { GestorES } from '../entrada-salida/GestorES.js';
import { ControladorAdmision } from '../admision/ControladorAdmision.js';
import { RecolectorMetricas } from '../metricas/RecolectorMetricas.js';
import { Reloj } from './Reloj.js';
import { RegistroProcesos } from './RegistroProcesos.js';
import { FaseAdmision } from './fases/FaseAdmision.js';
import { FaseBloqueados } from './fases/FaseBloqueados.js';
import { FaseCpu } from './fases/FaseCpu.js';
import { FaseRelojMetricas } from './fases/FaseRelojMetricas.js';
import { ServicioRegistro } from './ServicioRegistro.js';
import { ServicioConsulta } from './ServicioConsulta.js';
import { Simulador } from './Simulador.js';

// raiz de composicion: el unico lugar que conoce las clases concretas
// el resto del codigo depende de interfaces (dip)
export class FabricaSimulador implements IFabricaSimulador {
  crear(opciones: OpcionesSimulacion): Simulador {
    const configuracion = ConfiguracionSimulacion.crear(opciones);
    const memoria = new AdministradorMemoria(configuracion.memoriaTotal(), configuracion.politica());
    const metricas = new RecolectorMetricas(memoria);
    const registro = new RegistroProcesos();
    const bloqueados = new GestorES();
    const planificador = new PlanificadorRoundRobin(
      this.crearReglas(configuracion, memoria, registro, bloqueados, metricas),
    );
    const admision = new ControladorAdmision(memoria, planificador);
    const reloj = new Reloj();

    const fases: IFaseTick[] = [
      new FaseAdmision(admision),
      new FaseBloqueados(bloqueados, planificador),
      new FaseCpu(planificador, metricas),
      new FaseRelojMetricas(reloj, metricas, memoria),
    ];

    return new Simulador(
      fases,
      new ServicioRegistro(registro, admision, memoria),
      new ServicioConsulta({ reloj, procesos: registro, planificador, admision, bloqueados, terminados: registro, memoria, metricas }),
    );
  }

  // cadena de reglas en orden de prioridad (rf07 y rf08)
  crearReglas(
    configuracion: IConfiguracionSimulacion,
    memoria: ILiberadorMemoria,
    terminados: IRegistroTerminados,
    bloqueados: IGestorBloqueados,
    cambios: IRegistroCambiosContexto,
  ): IReglaPostEjecucion[] {
    return [
      new ReglaFinalizacion(memoria, terminados),
      new ReglaBloqueoES(bloqueados, cambios),
      new ReglaExpropiacionQuantum(configuracion.quantum(), cambios),
      new ReglaRenovacionQuantum(configuracion.quantum()),
      new ReglaContinuar(),
    ];
  }
}
