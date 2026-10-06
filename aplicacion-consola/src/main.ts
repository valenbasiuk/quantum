/**
 * Aplicación de consola para la AE2 de Sistemas Operativos.
 * Usa la biblioteca de clases (carpeta biblioteca-simulador), que no imprime nada:
 * esta capa solo carga los procesos, avanza los ticks, lee el estado y lo muestra.
 *
 *   npx tsx src/main.ts                                  escenario base, First-Fit, Q = 2, 1024 KB
 *   npx tsx src/main.ts --politica best --quantum 3      cambiar política y quantum
 *   npx tsx src/main.ts --memoria 768 --escenario llegadas
 *   npx tsx src/main.ts --escenario entrada-salida
 *   npx tsx src/main.ts --escenario comparativo --comparar
 *   npx tsx src/main.ts --liberar P2@3                   finaliza P2 al terminar el tick 3
 *   npx tsx src/main.ts --paso                           un tick por cada Enter
 *   npx tsx src/main.ts --listar
 */
import { createInterface } from 'node:readline/promises';
import { MejorAjuste, PeorAjuste, PrimerAjuste, Simulador } from '../../biblioteca-simulador/src/index.js';
import type { IPoliticaAsignacion, ISimulador } from '../../biblioteca-simulador/src/index.js';
import type { FotoProceso, OpcionesConsola } from './contratos.js';
import { ESCENARIOS } from './Escenarios.js';
import { DetectorEventos } from './DetectorEventos.js';
import { PresentadorTick } from './PresentadorTick.js';
import { CargadorEscenario } from './CargadorEscenario.js';
import { Comparador } from './Comparador.js';

const POLITICAS: ReadonlyMap<string, () => IPoliticaAsignacion> = new Map<string, () => IPoliticaAsignacion>([
  ['first', () => new PrimerAjuste()],
  ['best', () => new MejorAjuste()],
  ['worst', () => new PeorAjuste()],
]);

/** Lee "--nombre valor" y banderas "--nombre" de la línea de comandos. */
function leerOpciones(argv: readonly string[]): OpcionesConsola {
  const tiene = (nombre: string) => argv.includes(`--${nombre}`);
  const valor = (nombre: string, defecto: string) => [defecto, argv[argv.indexOf(`--${nombre}`) + 1]][Number(tiene(nombre))];
  return {
    escenario: valor('escenario', 'base'),
    politica: valor('politica', 'first'),
    quantum: Number(valor('quantum', '2')),
    memoria: Number(valor('memoria', '1024')),
    ticks: Number(valor('ticks', '100')),
    paso: tiene('paso'),
    comparar: tiene('comparar'),
    liberar: argv.flatMap((arg, i) => [argv[i + 1]].slice(0, Number(arg === '--liberar'))),
    listar: tiene('listar'),
  };
}

function fallar(mensaje: string): never {
  throw new Error(mensaje);
}

const fotos = (sim: ISimulador): Map<string, FotoProceso> =>
  new Map(
    sim.procesos().map((p) => [
      p.pid,
      { estado: p.estado, cpuRestante: p.cpuRestante, memoria: p.memoriaRequerida, bloqueoRestante: p.bloqueoRestante },
    ]),
  );

function resumenFinal(sim: ISimulador): string {
  const m = sim.metricas();
  const orden = sim.estado().terminados;
  return [
    '',
    `Terminaron en este orden: ${orden.join(' → ')}`,
    `Ticks: ${sim.estado().tick} · Uso de CPU: ${m.utilizacionCpu.toFixed(2)} % · Cambios de contexto: ${m.cambiosContexto}`,
  ].join('\n');
}

async function simular(opciones: OpcionesConsola): Promise<void> {
  const escenario = ESCENARIOS.get(opciones.escenario) ?? fallar(`escenario desconocido "${opciones.escenario}" (ver --listar)`);
  const politica = (POLITICAS.get(opciones.politica) ?? fallar(`política desconocida "${opciones.politica}" (first | best | worst)`))();
  const sim = Simulador.crear({ memoriaTotal: opciones.memoria, quantum: opciones.quantum, politica });
  const cargador = new CargadorEscenario(escenario);
  const detector = new DetectorEventos();
  const presentador = new PresentadorTick();
  const liberaciones = new Map(opciones.liberar.map((x) => x.split('@').reverse() as [string, string]));
  const teclado = [createInterface({ input: process.stdin, output: process.stdout })].slice(0, Number(opciones.paso));
  const total = escenario.procesos().length;

  console.log(`SIMULADOR DE PROCESOS Y MEMORIA — escenario "${escenario.nombre()}"`);
  console.log(`${escenario.descripcion()}`);
  console.log(`Memoria ${opciones.memoria} KB · quantum ${opciones.quantum} · política ${politica.nombre()}\n`);

  while (sim.estado().terminados.length < total && sim.estado().tick < opciones.ticks) {
    const llegadas = cargador.cargarLlegadas(sim).map((pid) => `LLEGA      ${pid} entra al sistema como NUEVO`);
    const antes = fotos(sim);
    sim.avanzarTick();
    const despues = fotos(sim);
    const ejecuto = [...despues]
      .filter(([pid, f]) => (antes.get(pid)?.cpuRestante ?? f.cpuRestante) > f.cpuRestante)
      .map(([pid, f]) => `EJECUTA    ${pid} usa la CPU (le quedan ${f.cpuRestante})`);
    const forzadas = [liberaciones.get(`${sim.estado().tick}`)]
      .filter((pid): pid is string => pid !== undefined)
      .map((pid) => {
        sim.finalizarProceso(pid);
        return `FORZADO    ${pid} se finaliza por pedido y libera su memoria`;
      });
    console.log(presentador.presentar(sim, [...llegadas, ...ejecuto, ...detector.detectar(antes, despues), ...forzadas]));
    await Promise.all(teclado.map((t) => t.question('Enter para el próximo tick...')));
  }
  teclado.forEach((t) => t.close());
  console.log(resumenFinal(sim));
}

async function main(): Promise<void> {
  const opciones = leerOpciones(process.argv.slice(2));
  const acciones: readonly (() => Promise<void>)[] = [
    () => simular(opciones),
    async () => {
      const escenario = ESCENARIOS.get(opciones.escenario) ?? fallar(`escenario desconocido "${opciones.escenario}"`);
      console.log(new Comparador().comparar(escenario, opciones.memoria, opciones.quantum));
    },
    async () => ESCENARIOS.forEach((e) => console.log(`${e.nombre().padEnd(16)}${e.descripcion()}`)),
  ];
  // 0 = simular, 1 = comparar, 2 = listar
  const elegida = Math.max(Number(opciones.comparar), 2 * Number(opciones.listar));
  await acciones[elegida]().catch((error: Error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}

void main();
