/**
 * 果甜派对消消乐 - UI系统
 * 负责：菜单、关卡选择、HUD、胜利/失败界面
 */

class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.buttons = [];
        this.animFrame = 0;
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

        // 背景 - 清新绿色渐变
        const bg = ctx.createLinearGradient(0, 0, 0, ch);
        bg.addColorStop(0, '#a8e6cf');
        bg.addColorStop(0.5, '#dcedc1');
        bg.addColorStop(1, '#ffd3b6');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cw, ch);

        // 装饰粒子
        this.animFrame += 0.02;
        for (let i = 0; i < 15; i++) {
            const x = (Math.sin(this.animFrame + i * 0.7) * 0.5 + 0.5) * cw;
            const y = (Math.cos(this.animFrame * 0.6 + i * 0.4) * 0.5 + 0.5) * ch;
            const size = 3 + Math.sin(this.animFrame + i) * 1.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(this.animFrame + i) * 0.15})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 标题
        ctx.save();
        const titleY = ch * 0.2;
        const bounce = Math.sin(this.animFrame * 2) * 4;

        ctx.font = 'bold 44px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 标题阴影
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillText('果甜派对', cw / 2 + 2, titleY + bounce + 2);
        ctx.fillText('消消乐', cw / 2 + 2, titleY + 50 + bounce + 2);

        // 标题渐变
        const titleGrad = ctx.createLinearGradient(cw / 2 - 120, titleY, cw / 2 + 120, titleY + 50);
        titleGrad.addColorStop(0, '#ff6b6b');
        titleGrad.addColorStop(0.5, '#ffa502');
        titleGrad.addColorStop(1, '#ff6348');
        ctx.fillStyle = titleGrad;
        ctx.fillText('果甜派对', cw / 2, titleY + bounce);
        ctx.fillText('消消乐', cw / 2, titleY + 50 + bounce);
        ctx.restore();

        // 装饰甜品
        const emojis = ['🍉', '🍓', '🍩', '🧁', '🍮', '🧋'];
        for (let i = 0; i < emojis.length; i++) {
            const angle = this.animFrame + (i / emojis.length) * Math.PI * 2;
            const radius = 90;
            const x = cw / 2 + Math.cos(angle) * radius;
            const y = ch * 0.48 + Math.sin(angle) * 35;
            ctx.font = '30px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emojis[i], x, y);
        }

        // 开始按钮
        const btnW = 200;
        const btnH = 52;
        const btnX = (cw - btnW) / 2;
        const btnY = ch * 0.66;

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
        const soundBtnY = btnY + 65;
        const soundLabel = this.engine.audio.enabled ? '🔊 音效开' : '🔇 音效关';

        this._drawButton(ctx, soundBtnX, soundBtnY, soundBtnW, btnH, soundLabel, '#6c5ce7', '#5f27cd');
        this.buttons.push({
            x: soundBtnX, y: soundBtnY, w: soundBtnW, h: btnH,
            action: () => {
                this.engine.audio.toggle();
                this.engine.audio.playSound('click');
            }
        });

        // 版本信息
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('v1.0 | Cloudflare Pages', cw / 2, ch - 15);
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
        bg.addColorStop(0, '#a8e6cf');
        bg.addColorStop(1, '#ffd3b6');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cw, ch);

        // 标题
        ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e17055';
        ctx.fillText('选择关卡', cw / 2, 40);

        // 生命值
        ctx.font = '15px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#d63031';
        ctx.fillText(`❤️ × ${this.engine.lives}`, cw / 2, 68);

        // 关卡网格
        const cols = 5;
        const cellW = 56;
        const cellH = 64;
        const gap = 8;
        const gridW = cols * cellW + (cols - 1) * gap;
        const startX = (cw - gridW) / 2;
        const startY = 90;

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

            // 关卡按钮背景
            if (unlocked) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0.08)';
            }
            ctx.beginPath();
            ctx.roundRect(x, y, cellW, cellH, 10);
            ctx.fill();

            if (unlocked) {
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // 关卡编号
            ctx.font = unlocked ? 'bold 20px sans-serif' : '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = unlocked ? '#2d3436' : 'rgba(0,0,0,0.2)';
            ctx.fillText(unlocked ? levelNum : '🔒', x + cellW / 2, y + cellH / 2 - 5);

            // 星级
            if (stars > 0) {
                ctx.font = '11px serif';
                ctx.fillStyle = '#ffa502';
                ctx.fillText('⭐'.repeat(stars), x + cellW / 2, y + cellH - 10);
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
            const px = 15;
            const py = ch / 2 - 18;
            this._drawButton(ctx, px, py, 36, 36, '◀', '#6c5ce7', '#5f27cd');
            this.buttons.push({
                x: px, y: py, w: 36, h: 36,
                action: () => {
                    this.levelPage--;
                    this.engine.audio.playSound('click');
                }
            });
        }
        if (this.levelPage < totalPages - 1) {
            const px = cw - 51;
            const py = ch / 2 - 18;
            this._drawButton(ctx, px, py, 36, 36, '▶', '#6c5ce7', '#5f27cd');
            this.buttons.push({
                x: px, y: py, w: 36, h: 36,
                action: () => {
                    this.levelPage++;
                    this.engine.audio.playSound('click');
                }
            });
        }

        // 返回按钮
        const backBtnW = 120;
        const backBtnX = (cw - backBtnW) / 2;
        const backBtnY = ch - 55;
        this._drawButton(ctx, backBtnX, backBtnY, backBtnW, 38, '返回主菜单', '#b2bec3', '#636e72');
        this.buttons.push({
            x: backBtnX, y: backBtnY, w: backBtnW, h: 38,
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

        // 顶部信息栏
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.roundRect(10, 6, cw - 20, 82, 10);
        ctx.fill();

        // 关卡名称
        ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e17055';
        ctx.fillText(`第${this.engine.currentLevel}关 - ${LevelManager.getLevelName(this.engine.currentLevel)}`, cw / 2, 24);

        // 剩余步数
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#2d3436';
        ctx.fillText(`👣 ${this.engine.moves}`, 24, 52);

        // 生命值
        ctx.textAlign = 'right';
        ctx.fillStyle = '#d63031';
        ctx.fillText(`❤️ × ${this.engine.lives}`, cw - 24, 52);

        // 目标进度
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        let objY = 74;
        for (const obj of this.engine.objectives) {
            const progress = Math.min(obj.current, obj.target);
            const done = progress >= obj.target;
            ctx.fillStyle = done ? '#00b894' : '#636e72';
            const checkMark = done ? '✓ ' : '';
            ctx.fillText(`${checkMark}${obj.desc}: ${progress}/${obj.target}`, cw / 2, objY);
            objY += 14;
        }

        // 底部信息栏
        const bottomY = CANVAS_HEIGHT - 52;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.roundRect(10, bottomY, cw - 20, 44, 10);
        ctx.fill();

        // 连击倍数
        const combo = this.engine.combo;
        if (combo > 0) {
            const comboColors = ['#636e72', '#ffa502', '#e17055', '#6c5ce7', '#00b894', '#0984e3'];
            const color = comboColors[Math.min(combo, comboColors.length - 1)];
            ctx.font = `bold ${15 + combo * 2}px "Microsoft YaHei", sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillStyle = color;
            ctx.fillText(`×${Math.min(combo, 5)} COMBO!`, 24, bottomY + 26);
        }

        // 得分
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e17055';
        ctx.fillText(`🏆 ${this.engine.score}`, cw - 24, bottomY + 26);

        // 暂停按钮
        const pauseBtnW = 34;
        const pauseBtnX = cw / 2 - pauseBtnW / 2;
        const pauseBtnY = bottomY + 8;
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.roundRect(pauseBtnX, pauseBtnY, pauseBtnW, 26, 6);
        ctx.fill();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#636e72';
        ctx.fillText('⏸', cw / 2, pauseBtnY + 17);
    }

    // ============================================================
    // 背景
    // ============================================================
    renderBackground(ctx) {
        const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bg.addColorStop(0, '#a8e6cf');
        bg.addColorStop(0.4, '#dcedc1');
        bg.addColorStop(0.7, '#ffd3b6');
        bg.addColorStop(1, '#ffccc7');
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, cw, ch);

        // 面板
        const panelW = 270;
        const panelH = 280;
        const panelX = (cw - panelW) / 2;
        const panelY = (ch - panelH) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.fill();
        ctx.strokeStyle = '#ffa502';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标题
        ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e17055';
        ctx.fillText('🎉 恭喜过关!', cw / 2, panelY + 45);

        // 星级
        const stars = this.engine._calculateStars();
        ctx.font = '32px serif';
        ctx.fillStyle = '#ffa502';
        ctx.fillText('⭐'.repeat(stars) + '☆'.repeat(3 - stars), cw / 2, panelY + 90);

        // 得分
        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#2d3436';
        ctx.fillText(`得分: ${this.engine.score}`, cw / 2, panelY + 130);
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#636e72';
        ctx.fillText(`最高连击: ×${this.engine.maxCombo}`, cw / 2, panelY + 155);

        // 按钮
        const btnW = 170;
        const btnX = (cw - btnW) / 2;
        const btnY = panelY + 185;

        if (this.engine.currentLevel < LevelManager.MAX_LEVEL) {
            this._drawButton(ctx, btnX, btnY, btnW, 42, '下一关 ▶', '#00b894', '#00a884');
            this.buttons.push({
                x: btnX, y: btnY, w: btnW, h: 42,
                action: () => {
                    this.engine.audio.playSound('click');
                    this.engine.startLevel(this.engine.currentLevel + 1);
                }
            });
        }

        this._drawButton(ctx, btnX, btnY + 52, btnW, 42, '返回关卡', '#b2bec3', '#636e72');
        this.buttons.push({
            x: btnX, y: btnY + 52, w: btnW, h: 42,
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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, cw, ch);

        const panelW = 270;
        const panelH = 240;
        const panelX = (cw - panelW) / 2;
        const panelY = (ch - panelH) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.fill();
        ctx.strokeStyle = '#e17055';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d63031';
        ctx.fillText('😢 挑战失败', cw / 2, panelY + 45);

        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#636e72';
        ctx.fillText(`剩余生命: ❤️ × ${this.engine.lives}`, cw / 2, panelY + 80);

        const btnW = 170;
        const btnX = (cw - btnW) / 2;

        if (this.engine.lives > 0) {
            this._drawButton(ctx, btnX, panelY + 105, btnW, 42, '🔄 重新挑战', '#e17055', '#d63031');
            this.buttons.push({
                x: btnX, y: panelY + 105, w: btnW, h: 42,
                action: () => {
                    this.engine.audio.playSound('click');
                    this.engine.startLevel(this.engine.currentLevel);
                }
            });
        } else {
            ctx.font = '13px sans-serif';
            ctx.fillStyle = '#d63031';
            ctx.fillText('生命值已耗尽', cw / 2, panelY + 115);
        }

        this._drawButton(ctx, btnX, panelY + 157, btnW, 42, '返回关卡', '#b2bec3', '#636e72');
        this.buttons.push({
            x: btnX, y: panelY + 157, w: btnW, h: 42,
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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, cw, ch);

        const panelW = 220;
        const panelH = 180;
        const panelX = (cw - panelW) / 2;
        const panelY = (ch - panelH) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 16);
        ctx.fill();

        ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#2d3436';
        ctx.fillText('⏸ 游戏暂停', cw / 2, panelY + 40);

        const btnW = 150;
        const btnX = (cw - btnW) / 2;

        this._drawButton(ctx, btnX, panelY + 70, btnW, 38, '▶ 继续游戏', '#00b894', '#00a884');
        this.buttons.push({
            x: btnX, y: panelY + 70, w: btnW, h: 38,
            action: () => {
                this.engine.audio.playSound('click');
                this.engine.state = GAME_STATE.PLAYING;
            }
        });

        this._drawButton(ctx, btnX, panelY + 118, btnW, 38, '返回关卡', '#b2bec3', '#636e72');
        this.buttons.push({
            x: btnX, y: panelY + 118, w: btnW, h: 38,
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
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, h / 2);
        ctx.fill();

        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h / 2, [h / 2, h / 2, 0, 0]);
        ctx.fill();

        ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
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
        const canvas = this.engine.canvas;
        const rect = canvas.getBoundingClientRect();
        // 用画布实际渲染尺寸计算缩放，避免 scale 值不同步
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (screenX - rect.left) * scaleX;
        const y = (screenY - rect.top) * scaleY;

        for (const btn of this.buttons) {
            if (x >= btn.x && x <= btn.x + btn.w &&
                y >= btn.y && y <= btn.y + btn.h) {
                btn.action();
                return;
            }
        }

        // 游戏中暂停按钮
        if (this.engine.state === GAME_STATE.PLAYING) {
            const pauseBtnX = CANVAS_WIDTH / 2 - 17;
            const pauseBtnY = CANVAS_HEIGHT - 44;
            if (x >= pauseBtnX && x <= pauseBtnX + 34 &&
                y >= pauseBtnY && y <= pauseBtnY + 26) {
                this.engine.state = GAME_STATE.PAUSED;
                this.engine.audio.playSound('click');
            }
        }
    }
}
