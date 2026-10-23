/**
 * Japanese Sakura & Golden Flakes Celebration Particle System
 */
export class SakuraConfetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.isActive = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start(durationMs = 6000) {
    this.stop();
    this.resize();
    this.particles = [];
    this.isActive = true;

    // Spawn 150 petals and gold foils
    for (let i = 0; i < 140; i++) {
      this.particles.push(this.createParticle(true));
    }

    const startTime = Date.now();
    const loop = () => {
      this.update();
      this.render();

      if (Date.now() - startTime < durationMs || this.particles.length > 0) {
        if (Date.now() - startTime < durationMs && this.particles.length < 140) {
          this.particles.push(this.createParticle(false));
        }
        this.animId = requestAnimationFrame(loop);
      } else {
        this.stop();
      }
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.isActive = false;
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  createParticle(initialSpread = false) {
    const isGold = Math.random() < 0.28;
    const isBig = Math.random() < 0.15;
    return {
      x: Math.random() * this.canvas.width,
      y: initialSpread ? Math.random() * this.canvas.height : -20 - Math.random() * 40,
      size: isBig ? 14 + Math.random() * 8 : 8 + Math.random() * 7,
      isGold,
      color: isGold
        ? (Math.random() < 0.5 ? '#f5d77f' : '#e6b422') // Gold
        : (Math.random() < 0.5 ? '#ffb7c5' : '#ffc0cb'), // Sakura pink
      alpha: 0.7 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 1.5 + 0.5,
      vy: 1.8 + Math.random() * 2.2,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.05,
      flip: Math.random() * Math.PI,
      vFlip: 0.03 + Math.random() * 0.04,
      curl: Math.random() * 0.5,
    };
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx + Math.sin(p.flip) * 0.8;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.flip += p.vFlip;

      if (p.y > this.canvas.height + 30) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.scale(1, Math.cos(p.flip));

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;

      if (p.isGold) {
        // Gold foil square / rhombus
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        // Sakura petal shape
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size);
        this.ctx.bezierCurveTo(
          p.size * 0.8, -p.size * 0.7,
          p.size * 0.9, p.size * 0.4,
          0, p.size
        );
        this.ctx.bezierCurveTo(
          -p.size * 0.9, p.size * 0.4,
          -p.size * 0.8, -p.size * 0.7,
          0, -p.size
        );
        this.ctx.fill();

        // Delicate notch in petal tip
        this.ctx.beginPath();
        this.ctx.arc(0, -p.size, p.size * 0.25, 0, Math.PI);
        this.ctx.fillStyle = '#fff0f3';
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }
}
