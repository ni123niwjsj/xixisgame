/**
 * 果甜派对消消乐 - UI系统
 * 负责：菜单、关卡选择、HUD、胜利/失败界面
 */

class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.buttons = [];
        this.animFrame = 0;

        // 关卡选择翻页
        this.levelPage = 0;
        this.levelsPerPage = 10;
    }

    // ============================================================
    // 主菜单
    // ============================================================
    renderMenu(ctx) {
        this.buttons = [];
        const cw = CANVAS_WIDTH;
        const ch = CANVAS_HEIGHT;

        // 背景渐变
        const bg = ctx.createLinearGradient(0, 0, 0, ch);
        bg.addColorStop(0, '#1a0a2e');
        bg.addColorStop(0.5, '#2d1b69');
        bg.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cw, ch);

        // 装饰粒子
        this.animFrame += 0.02;
        for (let i = 0; i < 20; i++) {
            const x = (Math.sin(this.animFrame + i * 0.5) * 0.5 + 0.5) * cw;
            const y = (Math.cos(this.animFrame * 0.7 + i * 0.3) * 0.5 + 0.5) * ch;
            const size = 2 + Math.sin(this.animFrame + i) * 1;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(this.animFrame + i) * 0.1})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 标题
        ctx.save();
        const titleY = ch * 0.22;
        const bounce = Math.sin(this.animFrame * 2) * 5;

        ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 标题阴影
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('果甜派对', cw / 2 + 2, titleY + bounce + 2);
        ctx.fillText('消消乐', cw / 2 + 2, titleY + 52 + bounce + 2);

        // 标题渐变
        const titleGrad = ctx.createLinearGradient(cw / 2 - 120, titleY, cw / 2 + 120, titleY + 50);
        titleGrad.addColorStop(0, '#ff6b6b');
        titleGrad.addColorStop(0.5, '#ffd700');
        titleGrad.addColorStop(1, '#48dbfb');
        ctx.fillStyle = titleGrad;
        ctx.fillText('果甜派对', cw / 2, titleY + bounce);
        ctx.fillText('消消乐', cw / 2, titleY + 52 + bounce);

        ctx.restore();

        // 装饰甜品
        const emojis = ['🍉', '🍓', '🍩', '🧁', '🍮', '🧋'];
        for (let i = 0; i < emojis.length; i++) {
            const angle = this.animFrame + (i / emojis.length) * Math.PI * 2;
            const radius = 100;
            const x = cw / 2 + Math.cos(angle) * radius;
            const y = ch * 0.5 + Math.sin(angle) * 40;
            ctx.font = '32px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emojis[i], x, y);
        }

        // 开始按钮
        const btnW = 200;
        const btnH = 56;
        const btnX = (cw - btnW) / 2;
        const btnY = ch * 0.68;

        this._drawButton(ctx, btnX, btnY, btnW, btnH, '🎮 开始游戏', '#ff6b6b', '#ee5a24');
        this.buttons.push({
            x: btnX, y: btnY, w: btnW, h: btnH,
            action: () => {
                this.engine.audio.playSound('click');
                this.engine.state = GAME_STATE.LEVEL_SELECT;
            }
        });

        // 音效按钮
        const soundBtnW = 140;
        const soundBtnX = (cw - soundBtnW) / 2;
        const soundBtnY = btnY + 70;
        const soundLabel = this.engine.audio.enabled ? '🔊 音效开' : '🔇 音效关';

        this._drawButton(ctx, soundBtnX, soundBtnY, soundBtnW, btnH, soundLabel, '#6c5ce7', '#5f27cd');
        this.buttons.push({
            x: soundBtnX, y: soundBtnY, w: soundBtnW, h: btnH,
            action: () => {
                const enabled = this.engine.audio.toggle();
                this.engine.audio.playSound('click');
            }
        });

        // 版本信息
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('v1.0 | Cloudflare Pages', cw / 2, ch - 20);
    }

    // ============================================================
    // 关卡选择
    // ============================================================
    renderLevelSelect(ctx) {
        this.buttons = [];
        const cw = CANVAS_WIDTH;
        const ch = CANVAS_HEIGHT;

        // 背景
        const bg = ctx.createLinearGradient(0, 0, 0, ch);
        bg.addColorStop(0, '#1a0a2e');
        bg.addColorStop(1, '#2d1b69');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cw, ch);

        // 标题
        ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('选择关卡', cw / 2, 45);

        // 生命值显示
        ctx.font = '16px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`❤️ × ${this.engine.lives}`, cw / 2, 75);

        // 关卡网格
        const cols = 5;
        const rows = 2;
        const cellW = 56;
        const cellH = 64;
        const gap = 8;
        const gridW = cols * cellW + (cols - 1) * gap;
        const gridH = rows * cellH + (rows - 1) * gap;
        const startX = (cw - gridW) / 2;
        const startY = 100;

        const startLevel = this.levelPage * this.levelsPerPage + 1;

        for (let i = 0; i < this.levelsPerPage; i++) {
            const levelNum = startLevel + i;
            if (levelNum > LevelManager.MAX_LEVEL && !LevelManager.levels[levelNum]) continue;

            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cellW + gap);
            const y = startY + row * (cellH + gap);

            const unlocked = levelNum <= (this.engine.progress.maxLevel || 1);
            const stars = this.engine.progress.levels[levelNum]?.stars || 0;

            // 关卡按钮
            ctx.fillStyle = unlocked ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.roundRect(x, y, cellW, cellH, 8);
            ctx.fill();

            if (unlocked) {
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // 关卡编号
            ctx.font = unlocked ? 'bold 20px sans-serif' : '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = unlocked ? '#fff' : 'rgba(255,255,255,0.3)';
            ctx.fillText(unlocked ? levelNum : '🔒', x + cellW / 2, y + cellH / 2 - 5);

            // 星级
            if (stars > 0) {
                ctx.font = '12px serif';
                ctx.fillStyle = '#ffd700';
                ctx.fillText('⭐'.repeat(stars), x + cellW / 2, y + cellH - 12);
            }

            if (unlocked) {
                this.buttons.push({
                    x, y, w: cellW, h: cellH,
                    action: () => {
                        this.engine.audio.playSound('click');
                        this.engine.startLevel(levelNum);
                    }
                });
            }
        }

        // 翻页按钮
        const totalPages = Math.ceil(LevelManager.MAX_LEVEL / this.levelsPerPage);
        if (this.levelPage > 0) {
            const px = 20;
            const py = ch / 2 - 20;
            this._drawButton(ctx, px, py, 40, 40, '◀', '#6c5ce7', '#5f27cd');
            this.buttons.push({
                x: px, y: py, w: 40, h: 40,
                action: () => {
                    this.levelPage--;
                    this.engine.audio.playSound('click');
                }
            });
        }
        if (this.levelPage < totalPages - 1) {
            const px = cw - 60;
            const py = ch / 2 - 20;
            this._drawButton(ctx, px, py, 40, 40, '▶', '#6c5ce7', '#5f27cd');
            this.buttons.push({
                x: px, y: py, w: 40, h: 40,
                action: () => {
                    this.levelPage++;
                    this.engine.audio.playSound('click');
                }
            });
        }

        // 返回按钮
        const backBtnW = 120;
        const backBtnX = (cw - backBtnW) / 2;
        const backBtnY = ch - 60;
        this._drawButton(ctx, backBtnX, backBtnY, backBtnW, 40, '返回主菜单', '#636e72', '#2d3436');
        this.buttons.push({
            x: backBtnX, y: backBtnY, w: backBtnW, h: 40,
            action: () => {
                this.engine.audio.playSound('click');
                this.engine.state = GAME_STATE.MENU;
            }
        });
    }

    // ============================================================
    // 游戏内 HUD
    // ============================================================
    renderHUD(ctx) {
        const cw = CANVAS_WIDTH;

        // 顶部信息栏背景
        const hudBg = ctx.createLinearGradient(0, 0, 0, 90);
        hudBg.addColorStop(0, 'rgba(0,0,0,0.6)');
        hudBg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hudBg;
        ctx.fillRect(0, 0, cw, 90);

        // 关卡名称
        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`第${this.engine.currentLevel}关 - ${LevelManager.getLevelName(this.engine.currentLevel)}`, cw / 2, 20);

        // 剩余步数
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.fillText(`👣 ${this.engine.moves}`, 20, 55);

        // 生命值
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`❤️ × ${this.engine.lives}`, cw - 20, 55);

        // 目标进度
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        let objY = 78;
        for (const obj of this.engine.objectives) {
            const progress = Math.min(obj.current, obj.target);
            const done = progress >= obj.target;
            ctx.fillStyle = done ? '#2ecc71' : 'rgba(255,255,255,0.8)';
            const checkMark = done ? '✓ ' : '';
            ctx.fillText(`${checkMark}${obj.desc}: ${progress}/${obj.target}`, cw / 2, objY);
            objY += 16;
        }

        // 底部信息栏
        const bottomY = CANVAS_HEIGHT - 60;
        const bottomBg = ctx.createLinearGradient(0, bottomY, 0, CANVAS_HEIGHT);
        bottomBg.addColorStop(0, 'rgba(0,0,0,0)');
        bottomBg.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = bottomBg;
        ctx.fillRect(0, bottomY, cw, 60);

        // 连击倍数
        const combo = this.engine.combo;
        if (combo > 0) {
            const comboColors = ['#fff', '#ffd700', '#ff6b6b', '#48dbfb', '#ff9ff3', '#54a0ff'];
            const color = comboColors[Math.min(combo, comboColors.length - 1)];
            ctx.font = `bold ${16 + combo * 2}px "Microsoft YaHei", sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillStyle = color;
            ctx.fillText(`×${Math.min(combo, 5)} COMBO!`, 20, bottomY + 30);
        }

        // 得分
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`🏆 ${this.engine.score}`, cw - 20, bottomY + 30);

        // 暂停按钮
        const pauseBtnW = 36;
        const pauseBtnX = cw / 2 - pauseBtnW / 2;
        const pauseBtnY = bottomY + 10;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(pauseBtnX, pauseBtnY, pauseBtnW, 28, 6);
        ctx.fill();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('⏸', cw / 2, pauseBtnY + 18);
    }

    // ============================================================
    // 背景
    // ============================================================
    renderBackground(ctx) {
        const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bg.addColorStop(0, '#1a0a2e');
        bg.addColorStop(0.3, '#2d1b69');
        bg.addColorStop(0.7, '#1a0a2e');
        bg.addColorStop(1, '#0d0520');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // ============================================================
    // 胜利界面
    // ============================================================
    renderWin(ctx) {
        this.buttons = [];
        const cw = CANVAS_WIDTH;
        const ch = CANVAS_HEIGHT;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, cw, ch);

        // 面板
        const panelW = 280;
        const panelH = 300;
        const panelX = (cw - panelW) / 2;
        const panelY = (ch - panelH) / 2;

        ctx.fillStyle = 'rgba(45, 27, 105, 0.95)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标题
        ctx.font = 'bold 32px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🎉 恭喜过关!', cw / 2, panelY + 50);

        // 星级
        const stars = this.engine._calculateStars();
        ctx.font = '36px serif';
        ctx.fillText('⭐'.repeat(stars) + '☆'.repeat(3 - stars), cw / 2, panelY + 100);

        // 得分
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`得分: ${this.engine.score}`, cw / 2, panelY + 140);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(`最高连击: ×${this.engine.maxCombo}`, cw / 2, panelY + 165);

        // 下一关按钮
        const btnW = 180;
        const btnX = (cw - btnW) / 2;
        const btnY = panelY + 200;

        if (this.engine.currentLevel < LevelManager.MAX_LEVEL) {
            this._drawButton(ctx, btnX, btnY, btnW, 44, '下一关 ▶', '#2ecc71', '#27ae60');
            this.buttons.push({
                x: btnX, y: btnY, w: btnW, h: 44,
                action: () => {
                    this.engine.audio.playSound('click');
                    this.engine.startLevel(this.engine.currentLevel + 1);
                }
            });
        }

        // 返回按钮
        this._drawButton(ctx, btnX, btnY + 56, btnW, 44, '返回关卡', '#636e72', '#2d3436');
        this.buttons.push({
            x: btnX, y: btnY + 56, w: btnW, h: 44,
            action: () => {
                this.engine.audio.playSound('click');
                this.engine.state = GAME_STATE.LEVEL_SELECT;
            }
        });
    }

    // ============================================================
    // 失败界面
    // ============================================================
    renderLose(ctx) {
        this.buttons = [];
        const cw = CANVAS_WIDTH;
        const ch = CANVAS_HEIGHT;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, cw, ch);

        const panelW = 280;
        const panelH = 260;
        const panelX = (cw - panelW) / 2;
        const panelY = (ch - panelH) / 2;

        ctx.fillStyle = 'rgba(45, 27, 105, 0.95)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.fill();
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('😢 挑战失败', cw / 2, panelY + 50);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`剩余生命: ❤️ × ${this.engine.lives}`, cw / 2, panelY + 90);

        const btnW = 180;
        const btnX = (cw - btnW) / 2;

        if (this.engine.lives > 0) {
            this._drawButton(ctx, btnX, panelY + 120, btnW, 44, '🔄 重新挑战', '#e17055', '#d63031');
            this.buttons.push({
                x: btnX, y: panelY + 120, w: btnW, h: 44,
                action: () => {
                    this.engine.audio.playSound('click');
                    this.engine.startLevel(this.engine.currentLevel);
                }
            });
        } else {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText('生命值已耗尽', cw / 2, panelY + 130);
        }

        this._drawButton(ctx, btnX, panelY + 176, btnW, 44, '返回关卡', '#636e72', '#2d3436');
        this.buttons.push({
            x: btnX, y: panelY + 176, w: btnW, h: 44,
            action: () => {
                this.engine.audio.playSound('click');
                if (this.engine.lives <= 0) this.engine.lives = 3;
                this.engine.state = GAME_STATE.LEVEL_SELECT;
            }
        });
    }

    // ============================================================
    // 暂停界面
    // ============================================================
    renderPause(ctx) {
        this.buttons = [];
        const cw = CANVAS_WIDTH;
        const ch = CANVAS_HEIGHT;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, cw, ch);

        const panelW = 240;
        const panelH = 200;
        const panelX = (cw - panelW) / 2;
        const panelY = (ch - panelH) / 2;

        ctx.fillStyle = 'rgba(45, 27, 105, 0.95)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.fill();

        ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('⏸ 游戏暂停', cw / 2, panelY + 45);

        const btnW = 160;
        const btnX = (cw - btnW) / 2;

        this._drawButton(ctx, btnX, panelY + 80, btnW, 40, '▶ 继续游戏', '#2ecc71', '#27ae60');
        this.buttons.push({
            x: btnX, y: panelY + 80, w: btnW, h: 40,
            action: () => {
                this.engine.audio.playSound('click');
                this.engine.state = GAME_STATE.PLAYING;
            }
        });

        this._drawButton(ctx, btnX, panelY + 130, btnW, 40, '返回关卡', '#636e72', '#2d3436');
        this.buttons.push({
            x: btnX, y: panelY + 130, w: btnW, h: 40,
            action: () => {
                this.engine.audio.playSound('click');
                this.engine.state = GAME_STATE.LEVEL_SELECT;
            }
        });
    }

    // ============================================================
    // 通用按钮绘制
    // ============================================================
    _drawButton(ctx, x, y, w, h, text, color1, color2) {
        ctx.save();
        // 按钮渐变
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, h / 2);
        ctx.fill();

        // 按钮高光
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h / 2, [h / 2, h / 2, 0, 0]);
        ctx.fill();

        // 按钮文字
        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x + w / 2, y + h / 2);
        ctx.restore();
    }

    // ============================================================
    // 点击处理
    // ============================================================
    handleClick(screenX, screenY) {
        const rect = this.engine.canvas.getBoundingClientRect();
        const x = (screenX - rect.left) / this.engine.scale;
        const y = (screenY - rect.top) / this.engine.scale;

        for (const btn of this.buttons) {
            if (x >= btn.x && x <= btn.x + btn.w &&
                y >= btn.y && y <= btn.y + btn.h) {
                btn.action();
                return;
            }
        }

        // 游戏中暂停按钮检测
        if (this.engine.state === GAME_STATE.PLAYING) {
            const pauseBtnX = CANVAS_WIDTH / 2 - 18;
            const pauseBtnY = CANVAS_HEIGHT - 50;
            if (x >= pauseBtnX && x <= pauseBtnX + 36 &&
                y >= pauseBtnY && y <= pauseBtnY + 28) {
                this.engine.state = GAME_STATE.PAUSED;
                this.engine.audio.playSound('click');
            }
        }
    }
}
