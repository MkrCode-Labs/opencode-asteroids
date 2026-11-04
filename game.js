'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

const POWERUP_CHANCE   = 0.1;
const SPEED_DURATION   = 5;
const SHIELD_DURATION  = 6;
const SHIELD_RADIUS    = 22;
const TRIPLE_DURATION  = 5;
const TRIPLE_SPREAD    = 0.18;  // rad de apertura entre balas del abanico (~10°)
const POWERUP_TTL      = 15;

const STAR_INTERVAL_MIN = 10;
const STAR_INTERVAL_MAX = 14;
const STAR_TTL          = 6;
const STAR_SPEED        = 230;
const STAR_POINTS       = 150;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

const KEY_LEFT   = ['ArrowLeft', 'KeyA'];
const KEY_RIGHT  = ['ArrowRight', 'KeyD'];
const KEY_THRUST = ['ArrowUp', 'KeyW'];
const KEY_BRAKE  = ['KeyS'];
const MATCHED_KEYS = [...KEY_LEFT, ...KEY_RIGHT, ...KEY_THRUST, ...KEY_BRAKE, 'Space', 'ArrowDown'];

const held = codes => codes.some(code => keys[code]);

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (MATCHED_KEYS.includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
class ShootingStar {
  constructor() {
    const edge = randInt(0, 3);
    if (edge === 0)      { this.x = rand(0, W); this.y = -20; }
    else if (edge === 1) { this.x = W + 20;    this.y = rand(0, H); }
    else if (edge === 2) { this.x = rand(0, W); this.y = H + 20; }
    else                 { this.x = -20;       this.y = rand(0, H); }

    const target = {
      x: W / 2 + rand(-W / 4, W / 4),
      y: H / 2 + rand(-H / 4, H / 4),
    };
    this.angle  = Math.atan2(target.y - this.y, target.x - this.x);
    this.vx     = Math.cos(this.angle) * STAR_SPEED;
    this.vy     = Math.sin(this.angle) * STAR_SPEED;
    this.radius = 12;
    this.ttl    = STAR_TTL;
    this.dead   = false;

    // Estrella de 5 puntas: solo contorno, estilo vectorial
    this.rot      = rand(0, Math.PI * 2);
    this.rotSpeed = rand(1.5, 3);
    this.verts    = [];
    const OUTER = 16;
    const INNER = 6;
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? OUTER : INNER;
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    // Sin wrap: cruza la pantalla y se apaga solo con el tiempo
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = Math.min(1, this.ttl / 1.2);
    ctx.save();
    ctx.translate(this.x, this.y);

    // Estela alineada con el movimiento
    ctx.save();
    ctx.rotate(this.angle);
    ctx.strokeStyle = `rgba(255,190,80,${(alpha * 0.55).toFixed(2)})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(-34, 0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,150,50,${(alpha * 0.22).toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(-34, 0); ctx.lineTo(-56, 0);
    ctx.stroke();
    ctx.restore();

    // Cuerpo estrellado con brillo
    ctx.rotate(this.rot);
    ctx.strokeStyle = `rgba(255,213,74,${alpha.toFixed(2)})`;
    ctx.lineWidth   = 1.8;
    ctx.lineJoin    = 'round';
    ctx.shadowColor = 'rgba(255,190,60,0.9)';
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.shieldTimer   = 0;
    this.shieldRot     = 0;
    this.tripleTimer   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    const ROT   = 3.5;   // rad/s
    const boosted = this.speedTimer > 0;
    if (boosted) this.speedTimer -= dt;
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      this.shieldRot += 2.2 * dt;   // giro lento del aro de escudo
    }
    if (this.tripleTimer > 0) this.tripleTimer -= dt;

    const THRUST = boosted ? 520 : 260;  // px/s² (x2 con power-up)
    const DRAG   = boosted ? 0.995 : 0.987;

    if (held(KEY_LEFT))  this.angle -= ROT * dt;
    if (held(KEY_RIGHT)) this.angle += ROT * dt;

    this.thrusting = held(KEY_THRUST);
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    } else if (held(KEY_BRAKE)) {
      // Freno: reduce la velocidad sin invertir el sentido
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > 0) {
        const factor = Math.max(0, speed - THRUST * dt) / speed;
        this.vx *= factor;
        this.vy *= factor;
      }
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;

    // Triple shot: abanico de 3 balas centrado en el ángulo de la nave
    if (this.tripleTimer > 0) {
      return [-1, 0, 1].map(i => new Bullet(ox, oy, this.angle + i * TRIPLE_SPREAD));
    }

    return [new Bullet(ox, oy, this.angle)];
  }

  drawShield() {
    if (this.shieldTimer <= 0) return;
    // Parpadeo justo antes de agotarse
    if (this.shieldTimer < 1 && Math.floor(this.shieldTimer * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.shieldRot);
    ctx.strokeStyle = 'rgba(255,110,180,0.85)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([10, 6]);   // aro discontinuado giratorio
    ctx.beginPath();
    ctx.arc(0, 0, SHIELD_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();

    this.drawShield();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up (velocidad / triple disparo) ─────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    const types = ['speed', 'triple', 'shield'];
    this.type   = type || types[Math.floor(Math.random() * types.length)];
    this.radius = 12;
    this.ttl    = POWERUP_TTL;
    this.age    = 0;
    this.dead   = false;
  }

  update(dt) {
    this.age += dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const pulse = 1 + Math.sin(this.age * 6) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';

    if (this.type === 'speed') {
      // Doble flecha cian: empuje x2
      ctx.strokeStyle = '#4ff';
      ctx.beginPath();
      ctx.moveTo(-9, -8); ctx.lineTo(0, 0);  ctx.lineTo(-9, 8);
      ctx.moveTo( 1, -8); ctx.lineTo(10, 0); ctx.lineTo( 1, 8);
      ctx.stroke();
    } else if (this.type === 'triple') {
      // Tres puntos en línea: triple disparo
      ctx.fillStyle = '#fa4';
      for (const x of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.arc(x, 0, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Contorno de escudo rosa: aro protector
      ctx.strokeStyle = '#f6a';
      ctx.beginPath();
      ctx.moveTo(-7, -9); ctx.lineTo(7, -9);
      ctx.lineTo(7, 1);   ctx.lineTo(0, 9);
      ctx.lineTo(-7, 1);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, stars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer, starTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  stars     = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  starTimer = rand(STAR_INTERVAL_MIN, STAR_INTERVAL_MAX);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  stars     = [];
  starTimer = rand(STAR_INTERVAL_MIN, STAR_INTERVAL_MAX);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedTimer  = 0;
  ship.shieldTimer = 0;
  ship.tripleTimer = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    stars.forEach(s => s.update(dt));
    stars = stars.filter(s => !s.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    stars.forEach(s => s.update(dt));
    stars = stars.filter(s => !s.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar (mantener Espacio; el cooldown limita la cadencia)
  if (keys['Space']) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));
  stars.forEach(s => s.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);
  stars     = stars.filter(s => !s.dead);

  // Aparición de estrellas fugaces
  starTimer -= dt;
  if (starTimer <= 0) {
    if (stars.length < 2) stars.push(new ShootingStar());
    starTimer = rand(STAR_INTERVAL_MIN, STAR_INTERVAL_MAX);
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (Math.random() < POWERUP_CHANCE) {
          const type = Math.random() < 0.5 ? 'speed' : 'triple';
          powerups.push(new PowerUp(a.x, a.y, type));
        }
      }
    }
  }

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of stars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += STAR_POINTS;
        explode(s.x, s.y, 10);
      }
    }
  }

  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);
  stars     = stars.filter(s => !s.dead);

  // Nave vs asteroide y estrella fugaz (el escudo absorbe los impactos)
  const hitRadius  = ship.shieldTimer > 0 ? SHIELD_RADIUS : ship.radius;
  const shielded   = ship.shieldTimer > 0;

  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < hitRadius + a.radius * 0.82) {
        if (shielded) {
          // El escudo destruye la amenaza: no se parte ni suelta power-ups
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
        } else {
          killShip();
          break;
        }
      }
    }
    if (!ship.dead) {
      for (const s of stars) {
        if (dist(ship, s) < hitRadius + s.radius * 0.82) {
          if (shielded) {
            s.dead = true;
            score += STAR_POINTS;
            explode(s.x, s.y, 10);
          } else {
            killShip();
            break;
          }
        }
      }
    }
  }

  asteroids = asteroids.filter(a => !a.dead);
  stars     = stars.filter(s => !s.dead);

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'shield') ship.shieldTimer = SHIELD_DURATION;
      else if (p.type === 'triple') ship.tripleTimer = TRIPLE_DURATION;
      else                     ship.speedTimer = SPEED_DURATION;
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawPowerBar(label, timer, duration, solid, faint, row) {
  const blink = timer < 1 && Math.floor(timer * 8) % 2 === 0;
  const BAR_W = 120;
  const BAR_H = 6;
  const BAR_X = 14;
  const BAR_Y = H - 10 - row * 14;

  ctx.textAlign = 'left';
  ctx.fillStyle = blink ? faint : solid;
  ctx.fillText(`${label}  ${timer.toFixed(1)}s`, BAR_X, BAR_Y - 6);

  ctx.fillStyle = faint;
  ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);
  ctx.fillStyle = solid;
  ctx.fillRect(BAR_X, BAR_Y, BAR_W * (timer / duration), BAR_H);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  let barRow = 0;
  if (ship.shieldTimer > 0)
    drawPowerBar('ESCUDO', ship.shieldTimer, SHIELD_DURATION,
      '#f6a', 'rgba(255,110,180,0.3)', barRow++);
  if (ship.tripleTimer > 0)
    drawPowerBar('TRIPLE', ship.tripleTimer, TRIPLE_DURATION,
      '#fa4', 'rgba(255,170,60,0.3)', barRow++);
  if (ship.speedTimer > 0)
    drawPowerBar('VEL x2', ship.speedTimer, SPEED_DURATION,
      '#4ff', 'rgba(120,255,255,0.3)', barRow++);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  stars.forEach(s => s.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
