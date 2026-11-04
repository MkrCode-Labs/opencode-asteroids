# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Algunos asteroides sueltan un power-up de velocidad y, de vez en cuando, una estrella fugaz cruza la pantalla.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla          | Acción                    |
| -------------- | ------------------------- |
| `←` `→` / `A` `D` | Rotar nave             |
| `↑` / `W`      | Propulsar                 |
| `S`            | Frenar                    |
| `Espacio`      | Disparar (mantener)       |

## Puntuación

| Objetivo       | Puntos |
| -------------- | ------ |
| Grande         | 20     |
| Mediano        | 50     |
| Pequeño        | 100    |
| Estrella fugaz | 150    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad: duplica el empuje durante 5 segundos
- Estrella fugaz: asteroide veloz que cruza la pantalla y se desvanece; otorga 150 puntos
