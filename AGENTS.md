# AGENTS.md

## Proyecto
Clon de Asteroids en HTML5 Canvas + JavaScript vanilla. Sin dependencias, bundler, tests, linter ni CI. No agregar tooling de build salvo que se pida.

## Ejecutar
- Abrir `index.html` en el navegador o `npx serve .` (la partida inicia sola).
- No hay comandos de test/lint; la verificación es manual en el navegador.

## Arquitectura
- `game.js` contiene todo el juego; `index.html` solo define el canvas 800x600, estilos y carga el script.
- El tamaño del canvas está duplicado: atributos `width`/`height` del HTML y constantes `W`/`H` de `game.js`. Mantenerlos sincronizados.
- Clases: `Ship`, `Asteroid`, `Bullet`, `Particle`, `PowerUp`, `ShootingStar`. Estado global: `ship`, `bullets`, `asteroids`, `particles`, `powerups`, `stars`, `score`, `lives`, `level`, `state`.
- `state` es `'playing' | 'dead' | 'gameover'` y se gestiona en `update(dt)`.
- Loop con `requestAnimationFrame`; `dt` va en segundos y se limita a 0.05 s. Toda la física usa segundos.

## Trampas y convenciones
- Input: `keys` para estado continuo; `held(KEY_*)` mapea flechas + WASD (W/A/D mueven, S frena). `Space` dispara mientras se mantiene (cooldown 0.2 s) y `pressed('Space')` solo reinicia en gameover; `pressed()` consume `justPressed` (one-shot), no llamarlo dos veces por frame.
- `wrap()` aplica el espacio toroidal a nave, asteroides y balas; las partículas no hacen wrap.
- `Asteroid.size` va de 1 a 3 e indexa `RADII`, `SPEEDS` y `POINTS` (1 = pequeño, 3 = grande). Al destruirse suma `POINTS[size]` y `split()` genera dos del tamaño inferior.
- `PowerUp` tiene 10 % de drop por asteroide destruido y elige su `type` al azar entre `'speed'`, `'triple'` y `'shield'`: `'speed'` otorga `SPEED_DURATION` (5 s) de empuje x2 (doble flecha cian), `'triple'` otorga `TRIPLE_DURATION` (5 s) disparando un abanico de 3 balas con apertura `TRIPLE_SPREAD` (tres puntos naranjas) y `'shield'` otorga `SHIELD_DURATION` (6 s) de escudo (contorno rosa). Recoger otro power-up solo reinicia el timer de su propio tipo; las habilidades coexisten.
- El escudo (`SHIELD_RADIUS` = 22, aro discontinuado giratorio) absorbe los impactos de asteroides y estrellas fugaces: destruye la amenaza, otorga sus puntos y su explosión, pero el asteroide no se parte ni suelta power-ups. Con escudo activo la nave no muere por estos choques.
- `ShootingStar` aparece cada 10–14 s solo en `playing` (máx. 2), no hace wrap, se apaga con `STAR_TTL` y vale `STAR_POINTS` (150). No se parte ni suelta power-ups; chocar con ella destruye la nave.
- Skins: `SKINS` define nombre, color, llama y `verts` (silueta). `Comma` (`<`) / `Period` (`>`) ciclan skin en cualquier estado; persiste en `localStorage` (`asteroids.skin`, con `try/catch`). `skinToast` muestra el nombre activo ~1.5 s. `drawLifeIcon` usa el color de la skin.
- Los nombres van en inglés; los comentarios, en español.
