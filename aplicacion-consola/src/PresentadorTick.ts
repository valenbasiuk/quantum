import type { ISimulador, IVistaBloque } from '../../src/index.js';
import type { IPresentadorTick } from './contratos.js';

const ANCHO = 78;

/** Arma el "panel" de un tick: eventos, colas, mapa de memoria y métricas. */
export class PresentadorTick implements IPresentadorTick {
  presentar(simulador: ISimulador, eventos: readonly string[]): string {
    const estado = simulador.estado();
    const m = simulador.metricas();
    const total = estado.mapaMemoria.reduce((suma, b) => suma + b.tamano, 0);
    return [
      `┌${'─'.repeat(ANCHO)}┐`,
      this._fila(` TICK ${estado.tick}`),
      `├${'─'.repeat(ANCHO)}┤`,
      ...[...eventos, ...['(sin cambios de estado)'].slice(Math.min(eventos.length, 1))].map((e) => this._fila(` ${e}`)),
      `├${'─'.repeat(ANCHO)}┤`,
      this._fila(` CPU          : ${estado.enCpu ?? 'libre'}`),
      this._fila(` Listos       : [${estado.listos.join(', ')}]`),
      this._fila(` Esp. memoria : [${estado.esperandoMemoria.join(', ')}]`),
      this._fila(` Bloqueados   : [${estado.bloqueados.join(', ')}]`),
      this._fila(` Terminados   : [${estado.terminados.join(', ')}]`),
      `├${'─'.repeat(ANCHO)}┤`,
      this._fila(` Memoria  ${this.barra(estado.mapaMemoria, total, 58)}`),
      ...estado.mapaMemoria.map((b) =>
        this._fila(`   ${String(b.inicio).padStart(5)} - ${String(b.fin).padStart(5)} KB  ${String(b.tamano).padStart(5)} KB  ${b.pid ?? '· libre'}`),
      ),
      `├${'─'.repeat(ANCHO)}┤`,
      this._fila(` Ocupación ${m.ocupacionMemoria.toFixed(2).padStart(6)} %   Uso CPU ${m.utilizacionCpu.toFixed(2).padStart(6)} %   Ctx ${m.cambiosContexto}`),
      this._fila(` Libre ${String(m.memoriaLibreTotal).padStart(5)} KB   Mayor hueco ${String(m.mayorBloqueLibre).padStart(5)} KB   Frag. ${m.fragmentacionExterna.toFixed(2).padStart(6)} %`),
      `└${'─'.repeat(ANCHO)}┘`,
    ].join('\n');
  }

  /** Barra proporcional: '#' ocupado (con el PID al principio), '.' libre. */
  barra(mapa: readonly IVistaBloque[], total: number, ancho: number): string {
    const tramos = mapa.map((b) => {
      const largo = Math.max(1, Math.round((b.tamano / total) * ancho));
      const relleno = ['#', '.'][Number(b.libre)];
      return `${b.pid ?? ''}${relleno.repeat(largo)}`.slice(0, largo);
    });
    return `[${tramos.join('|')}]`;
  }

  private _fila(texto: string): string {
    return `│${texto.slice(0, ANCHO).padEnd(ANCHO)}│`;
  }
}
