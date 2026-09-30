# Simulador de procesos y memoria (TypeScript)

simula procesos que comparten una memoria contigua y una única CPU: admisión con first-fit / best-fit / worst-fit, liberación con coalescencia, planificación Round-Robin con quantum configurable, bloqueos por E/S deterministas y métricas por tick.

No tiene main, menú ni salida por consola. el funcionamiento se demuestra con los tests.

## Requisitos

- Node.js 20 o superior (probado con Node 22)
- npm 10

## Instalación

```bash
npm ci
```

## Tests y cobertura

```bash
npm test            # corre toda la suite (Vitest)
npm run coverage    # suite + reporte de cobertura (texto, HTML en coverage/index.html, lcov)
npm run typecheck   # verificación de tipos estricta
npm run build       # compila la biblioteca a dist/
```