import type { FotoProceso, IDetectorEventos } from './contratos.js';

type Mensaje = (pid: string, foto: FotoProceso) => string;

const fin: Mensaje = (pid, f) => `FIN        ${pid} terminó: libera ${f.memoria} KB y se fusionan los huecos vecinos`;
const bloqueo: Mensaje = (pid, f) =>
  `E/S        ${pid} se bloquea ${f.bloqueoRestante} tick(s), conserva su memoria (+1 cambio ctx)`;
const quantum: Mensaje = (pid) => `QUANTUM    ${pid} agotó el quantum, vuelve al final de Listos (+1 cambio ctx)`;

/**
 * La biblioteca no imprime nada: solo expone su estado. Esta clase compara dos fotos
 * consecutivas y traduce cada cambio en un mensaje con una tabla
 * "estado anterior>estado nuevo[*]" → mensaje, donde * indica que el proceso usó CPU.
 */
export class DetectorEventos implements IDetectorEventos {
  private static readonly _MENSAJES: ReadonlyMap<string, Mensaje> = new Map<string, Mensaje>([
    ['NUEVO>LISTO', (pid, f) => `MEMORIA    ${pid} recibe ${f.memoria} KB y pasa a LISTO`],
    ['ESPERANDO_MEMORIA>LISTO', (pid, f) => `MEMORIA    ${pid} por fin consigue ${f.memoria} KB y pasa a LISTO`],
    ['NUEVO>EJECUTANDO*', (pid) => `MEMORIA    ${pid} recibe memoria y ejecuta en el mismo tick`],
    ['ESPERANDO_MEMORIA>EJECUTANDO*', (pid) => `MEMORIA    ${pid} consigue memoria y ejecuta en el mismo tick`],
    ['NUEVO>ESPERANDO_MEMORIA', (pid, f) => `SIN LUGAR  ${pid} necesita ${f.memoria} KB contiguos: queda ESPERANDO MEMORIA`],
    ['LISTO>EJECUTANDO*', (pid) => `CPU        ${pid} es despachado (quantum en 0)`],
    ['EJECUTANDO>LISTO*', quantum],
    ['LISTO>LISTO*', quantum],
    ['NUEVO>LISTO*', quantum],
    ['EJECUTANDO>BLOQUEADO*', bloqueo],
    ['LISTO>BLOQUEADO*', bloqueo],
    ['NUEVO>BLOQUEADO*', bloqueo],
    ['BLOQUEADO>LISTO', (pid) => `E/S LISTA  ${pid} termina su E/S y vuelve al final de Listos`],
    ['BLOQUEADO>EJECUTANDO*', (pid) => `E/S LISTA  ${pid} termina su E/S y toma la CPU en este mismo tick`],
    ['EJECUTANDO>TERMINADO*', fin],
    ['LISTO>TERMINADO*', fin],
    ['NUEVO>TERMINADO*', fin],
    ['ESPERANDO_MEMORIA>TERMINADO*', fin],
    ['BLOQUEADO>TERMINADO*', fin],
  ]);

  detectar(antes: ReadonlyMap<string, FotoProceso>, despues: ReadonlyMap<string, FotoProceso>): string[] {
    return [...despues.entries()]
      .map(([pid, foto]) => this._mensaje(pid, foto, antes.get(pid) ?? foto))
      .filter((mensaje) => mensaje.length > 0);
  }

  private _mensaje(pid: string, foto: FotoProceso, anterior: FotoProceso): string {
    const uso = ['', '*'][Number(anterior.cpuRestante > foto.cpuRestante)];
    const clave = `${anterior.estado}>${foto.estado}${uso}`;
    const mensaje = DetectorEventos._MENSAJES.get(clave) ?? DetectorEventos._MENSAJES.get(clave.replace('*', ''));
    return (mensaje ?? (() => ''))(pid, foto);
  }
}
