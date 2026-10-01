// estados posibles durante el ciclo de vida del proceso en el so
export enum EstadoProceso {
  NUEVO = 'NUEVO',
  ESPERANDO_MEMORIA = 'ESPERANDO_MEMORIA',
  LISTO = 'LISTO',
  EJECUTANDO = 'EJECUTANDO',
  BLOQUEADO = 'BLOQUEADO',
  TERMINADO = 'TERMINADO',
}
