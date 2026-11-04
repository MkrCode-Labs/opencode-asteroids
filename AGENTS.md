# AGENTS.md

## Proyecto
Clon de Asteroids en HTML5 Canvas + JavaScript vanilla. Sin dependencias, bundler, tests, linter ni CI. No agregar tooling de build salvo que se pida.

## Ejecutar
- Abrir `index.html` en el navegador o `npx serve .` (la partida inicia sola).
- No hay comandos de test/lint; la verificación es manual en el navegador.

## Arquitectura
- `game.js` contiene todo el juego; `index.html` solo define el canvas 800x600, estilos y carga el script.
- El tamaño del canvas está duplicado: atributos `width`/`height` del HTML y constantes `W`/`H` de `game.js`. Mantenerlos sincronizados.
- Clases: `Ship`, `Asteroid`, `Bullet`, `Particle`. Estado global: `ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`.
- `state` es `'playing' | 'dead' | 'gameover'` y se gestiona en `update(dt)`.
- Loop con `requestAnimationFrame`; `dt` va en segundos y se limita a 0.05 s. Toda la física usa segundos.

## Trampas y convenciones
- Input: `keys` para estado continuo; `pressed(code)` consume `justPressed` (one-shot). `Space` dispara y también reinicia en gameover; no llamar `pressed('Space')` dos veces por frame.
- `wrap()` aplica el espacio toroidal a nave, asteroides y balas; las partículas no hacen wrap.
- `Asteroid.size` va de 1 a 3 e indexa `RADII`, `SPEEDS` y `POINTS` (1 = pequeño, 3 = grande). Al destruirse suma `POINTS[size]` y `split()` genera dos del tamaño inferior.
- Los nombres van en inglés; los comentarios, en español.
- El README menciona power-ups y una "estrella fugaz" que no existen en `game.js`. El código es la fuente de verdad.
