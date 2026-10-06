# Aplicación de consola — AE2 Sistemas Operativos

Programa que **usa** la biblioteca `../biblioteca-simulador` y muestra en pantalla, tick a tick,
los eventos, las colas, el mapa de memoria y las métricas.

> La biblioteca es la que se entrega en Paradigmas II (sin `main` ni consola, como pide esa consigna).
> Esta carpeta es aparte y existe solo para Sistemas Operativos, que pide ver la aplicación funcionando.

## Requisitos

Node.js 20 o superior.

## Instalación

```bash
cd ../biblioteca-simulador && npm install
cd ../aplicacion-consola && npm install
```

## Uso

```bash
npm run simular                                          # escenario base, First-Fit, Q = 2, 1024 KB
npm run simular -- --politica best --quantum 3           # política: first | best | worst
npm run simular -- --memoria 768 --escenario llegadas
npm run simular -- --escenario entrada-salida
npm run simular -- --escenario llegadas --liberar B@3    # finaliza B al terminar el tick 3
npm run simular -- --paso                                # un tick por cada Enter
npm run simular -- --listar                              # escenarios disponibles
npm run comparar                                         # First vs Best vs Worst-Fit
```

## Archivos

| Archivo | Qué hace |
|---|---|
| `src/main.ts` | Lee las opciones, arma el simulador y recorre los ticks |
| `src/Escenarios.ts` | Escenarios de prueba (procesos y su tick de llegada) |
| `src/CargadorEscenario.ts` | Da de alta cada proceso justo antes del tick en que llega |
| `src/DetectorEventos.ts` | Compara dos fotos del estado y traduce los cambios en mensajes |
| `src/PresentadorTick.ts` | Dibuja el panel de cada tick |
| `src/Comparador.ts` | Corre un escenario con las tres políticas y compara |
