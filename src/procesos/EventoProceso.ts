// eventos que disparan transiciones entre los estados del proceso
// representan las transiciones del diagrama de estados
export enum EventoProceso {
  ESPERAR_MEMORIA = 'ESPERAR_MEMORIA',
  ADMITIR = 'ADMITIR',
  DESPACHAR = 'DESPACHAR',
  EXPROPIAR = 'EXPROPIAR',
  BLOQUEAR = 'BLOQUEAR',
  DESBLOQUEAR = 'DESBLOQUEAR',
  TERMINAR = 'TERMINAR',
}
