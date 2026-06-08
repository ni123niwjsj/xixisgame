/**
 * 果甜派对消消乐 - 特效系统
 * 负责：粒子动画、消除特效、特效视觉反馈
 */

class EffectsManager {
    constructor(engine) {
        this.engine = engine;
        this.particles = [];
        this.floatingTexts = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };
    }

    update(dt) {
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt / 1000;
            p.y += p.vy * dt / 1000;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            p.size *= 0.99;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 更新浮动文字
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 30 * dt / 1000;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life / ft.maxLife);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // 更新屏幕震动
        if (this.screenShake.intensity > 0.5) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= this.screenShake.decay;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }
    }

    render(ctx) {
        ctx.save();

        // 应用屏幕震动
        if (this.screenShake.intensity > 0) {
            ctx.translate(this.screenShake.x, this.screenShake.y);
        }

        // 渲染粒子
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            if (p.shape === 'circle') {
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            } else if (p.shape === 'star') {
                this._drawStar(ctx, p.x, p.y, p.size);
            } else if (p.shape === 'square') {
                ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
            }
            ctx.fill();
        }

        // 渲染浮动文字
        for (const ft of this.floatingTexts) {
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size}px 'Microsoft YaHei', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ft.text, ft.x, ft.y);
        }

        ctx.restore();
    }

    // ============================================================
    // 特效生成
    // ============================================================

    // 消除闪光效果
    spawnClearEffect(x, y, color) {
        const count = 8;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 80 + Math.random() * 60;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color,
                alpha: 1,
                life: 400 + Math.random() * 200,
                maxLife: 600,
                shape: 'circle',
            });
        }
    }

    // 连击特效
    spawnComboEffect(x, y, combo) {
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
        const color = colors[Math.min(combo - 1, colors.length - 1)];

        this.floatingTexts.push({
            x, y,
            text: `${combo} COMBO!`,
            color,
            size: 20 + combo * 4,
            alpha: 1,
            life: 1000,
            maxLife: 1000,
        });

        // 环形粒子
        const count = 12 + combo * 4;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 100 + Math.random() * 80;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 3,
                color,
                alpha: 1,
                life: 600 + Math.random() * 300,
                maxLife: 900,
                shape: 'star',
            });
        }
    }

    // 得分浮动
    spawnScoreEffect(x, y, score) {
        this.floatingTexts.push({
            x, y,
            text: `+${score}`,
            color: '#ffd700',
            size: 16,
            alpha: 1,
            life: 800,
            maxLife: 800,
        });
    }

    // 特效爆炸（炸弹/甜品盒）
    spawnExplosionEffect(x, y, radius) {
        this.screenShake.intensity = radius * 2;
        const count = 20 + radius * 5;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 60 + Math.random() * 120;
            const colors = ['#ff4757', '#ffa502', '#ff6348', '#ffd700'];
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                life: 500 + Math.random() * 400,
                maxLife: 900,
                shape: Math.random() > 0.5 ? 'star' : 'circle',
            });
        }
    }

    // 彩虹清场效果
    spawnRainbowEffect(x, y) {
        const count = 30;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 150 + Math.random() * 100;
            const hue = (i / count) * 360;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5 + Math.random() * 4,
                color: `hsl(${hue}, 100%, 60%)`,
                alpha: 1,
                life: 800 + Math.random() * 400,
                maxLife: 1200,
                shape: 'circle',
            });
        }
        this.screenShake.intensity = 5;
    }

    // 障碍破碎效果
    spawnObstacleBreakEffect(x, y, obstacleType) {
        const colors = {
            frost: ['#b8d4e3', '#ffffff'],
            chocolate: ['#6f4e37', '#3c280d'],
            vine: ['#228b22', '#006400'],
            caramel: ['#d29632', '#b4781e'],
        };
        const palette = colors[obstacleType] || ['#888', '#666'];

        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 50 + Math.random() * 80;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 4,
                color: palette[Math.floor(Math.random() * palette.length)],
                alpha: 1,
                life: 500 + Math.random() * 300,
                maxLife: 800,
                shape: 'square',
            });
        }
    }

    _drawStar(ctx, cx, cy, r) {
        const spikes = 5;
        const outer = r;
        const inner = r * 0.5;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const radius = i % 2 === 0 ? outer : inner;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }
}
