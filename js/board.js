/**
 * 果甜派对消消乐 - 棋盘和元素系统
 * 负责：网格管理、元素渲染、交换动画、下落动画
 */

class GameBoard {
    constructor(engine) {
        this.engine = engine;
        this.grid = []; // grid[row][col] = { type, special, obstacle, obstacleHP, ... }

        // 棋盘绘制区域
        this.boardLeft = (CANVAS_WIDTH - BOARD_WIDTH) / 2;
        this.boardTop = 100; // 顶部留空给HUD

        // 动画相关
        this.animatingCells = [];
        this.animProgress = 0;
        this.animDuration = 250; // ms
        this.swapAnim = null;
        this.fallAnim = null;
        this.clearAnim = null;

        // 选中高亮
        this.selectedCell = null;
        this.selectedPulse = 0;
    }

    // ============================================================
    // 初始化
    // ============================================================
    initLevel(levelNum) {
        this.grid = [];
        const levelData = LevelManager.getLevelData(levelNum);

        // 创建空网格
        for (let r = 0; r < ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < COLS; c++) {
                this.grid[r][c] = {
                    type: -1,
                    special: SPECIAL_TYPES.NONE,
                    obstacle: null,      // 'frost', 'chocolate', 'vine', 'caramel'
                    obstacleHP: 0,
                    trapped: false,       // 是否被困住的甜品
                    empty: false,         // 是否为空位
                };
            }
        }

        // 放置障碍物
        if (levelData && levelData.obstacles) {
            for (const obs of levelData.obstacles) {
                const cell = this.grid[obs.row][obs.col];
                cell.obstacle = obs.type;
                cell.obstacleHP = obs.hp;
            }
        }

        // 填充甜品（避免天然4/5连）
        this._fillBoard();

        // 放置被困甜品（解救目标）
        if (levelData && levelData.trapped) {
            for (const t of levelData.trapped) {
                this.grid[t.row][t.col].trapped = true;
            }
        }
    }

    _fillBoard() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c].obstacle || this.grid[r][c].empty) continue;
                this.grid[r][c].type = this._randomTypeNoMatch(r, c);
            }
        }
    }

    _randomTypeNoMatch(row, col) {
        // 随机生成，但避免形成3连
        let attempts = 0;
        let type;
        do {
            type = Math.floor(Math.random() * CANDY_TYPES.length);
            attempts++;
        } while (attempts < 20 && this._wouldMatch(row, col, type));
        return type;
    }

    _wouldMatch(row, col, type) {
        // 检查水平方向
        if (col >= 2) {
            const g1 = this.grid[row][col - 1];
            const g2 = this.grid[row][col - 2];
            if (g1.type === type && g2.type === type && !g1.obstacle && !g2.obstacle) {
                return true;
            }
        }
        // 检查垂直方向
        if (row >= 2) {
            const g1 = this.grid[row - 1][col];
            const g2 = this.grid[row - 2][col];
            if (g1.type === type && g2.type === type && !g1.obstacle && !g2.obstacle) {
                return true;
            }
        }
        return false;
    }

    // ============================================================
    // 网格查询
    // ============================================================
    getCell(row, col) {
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
        return this.grid[row][col];
    }

    isBlocked(row, col) {
        const cell = this.getCell(row, col);
        if (!cell) return true;
        if (cell.obstacle === 'chocolate' && cell.obstacleHP > 0) return true;
        if (cell.obstacle === 'caramel' && cell.obstacleHP > 0) return true;
        return false;
    }

    hasValidMoves() {
        // 检查是否有可用的交换
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.isBlocked(r, c)) continue;
                if (this.grid[r][c].type < 0) continue;

                // 尝试右交换
                if (c < COLS - 1 && !this.isBlocked(r, c + 1) && this.grid[r][c + 1].type >= 0) {
                    this._swapTypes(r, c, r, c + 1);
                    const matches = MatchEngine.findMatches(this.grid);
                    this._swapTypes(r, c, r, c + 1);
                    if (matches.length > 0) return true;
                }
                // 尝试下交换
                if (r < ROWS - 1 && !this.isBlocked(r + 1, c) && this.grid[r + 1][c].type >= 0) {
                    this._swapTypes(r, c, r + 1, c);
                    const matches = MatchEngine.findMatches(this.grid);
                    this._swapTypes(r, c, r + 1, c);
                    if (matches.length > 0) return true;
                }
            }
        }
        return false;
    }

    _swapTypes(r1, c1, r2, c2) {
        const tmp = this.grid[r1][c1].type;
        this.grid[r1][c1].type = this.grid[r2][c2].type;
        this.grid[r2][c2].type = tmp;
    }

    // ============================================================
    // 动画系统
    // ============================================================
    animateSwap(r1, c1, r2, c2, callback) {
        const cellSize = CELL_SIZE;
        const x1 = this.boardLeft + BOARD_PADDING + c1 * cellSize;
        const y1 = this.boardTop + BOARD_PADDING + r1 * cellSize;
        const x2 = this.boardLeft + BOARD_PADDING + c2 * cellSize;
        const y2 = this.boardTop + BOARD_PADDING + r2 * cellSize;

        this.swapAnim = {
            r1, c1, r2, c2,
            startX1: x1, startY1: y1,
            startX2: x2, startY2: y2,
            progress: 0,
            callback,
        };

        this.engine.audio.playSound('swap');
    }

    animateClear(matches, specials, callback) {
        const cells = [];
        for (const m of matches) {
            for (const cell of m.cells) {
                cells.push({
                    row: cell.row,
                    col: cell.col,
                    scale: 1,
                    alpha: 1,
                });
            }
        }

        this.clearAnim = {
            cells,
            specials,
            progress: 0,
            callback,
        };

        this.engine.audio.playSound('match');
    }

    animateFall(callback) {
        // 计算每列需要下落的距离
        const falls = [];
        for (let c = 0; c < COLS; c++) {
            let emptyCount = 0;
            for (let r = ROWS - 1; r >= 0; r--) {
                const cell = this.grid[r][c];
                if (cell.empty || cell.type < 0) {
                    emptyCount++;
                } else if (emptyCount > 0) {
                    falls.push({
                        fromRow: r,
                        toRow: r + emptyCount,
                        col: c,
                        distance: emptyCount,
                        type: cell.type,
                        special: cell.special,
                    });
                }
            }

            // 顶部生成新元素
            for (let i = 0; i < emptyCount; i++) {
                falls.push({
                    fromRow: -1 - i,
                    toRow: emptyCount - 1 - i,
                    col: c,
                    distance: emptyCount,
                    type: Math.floor(Math.random() * CANDY_TYPES.length),
                    special: SPECIAL_TYPES.NONE,
                    isNew: true,
                });
            }
        }

        if (falls.length === 0) {
            callback();
            return;
        }

        this.fallAnim = {
            falls,
            progress: 0,
            callback,
        };
    }

    // ============================================================
    // 动画更新
    // ============================================================
    updateAnimations(dt) {
        // 交换动画
        if (this.swapAnim) {
            this.swapAnim.progress += dt / this.animDuration;
            if (this.swapAnim.progress >= 1) {
                this.swapAnim.progress = 1;
                // 执行实际交换
                const { r1, c1, r2, c2 } = this.swapAnim;
                const tmp = this.grid[r1][c1].type;
                const tmpSpecial = this.grid[r1][c1].special;
                this.grid[r1][c1].type = this.grid[r2][c2].type;
                this.grid[r1][c1].special = this.grid[r2][c2].special;
                this.grid[r2][c2].type = tmp;
                this.grid[r2][c2].special = tmpSpecial;

                const cb = this.swapAnim.callback;
                this.swapAnim = null;
                if (cb) cb();
            }
            return;
        }

        // 消除动画
        if (this.clearAnim) {
            this.clearAnim.progress += dt / 300;
            if (this.clearAnim.progress >= 1) {
                // 执行实际消除
                for (const cell of this.clearAnim.cells) {
                    this.grid[cell.row][cell.col].type = -1;
                    this.grid[cell.row][cell.col].special = SPECIAL_TYPES.NONE;
                    this.grid[cell.row][cell.col].empty = true;

                    // 处理障碍物
                    this._damageObstacle(cell.row, cell.col);
                }

                // 放置特效
                for (const sp of this.clearAnim.specials) {
                    this.grid[sp.row][sp.col].type = sp.type;
                    this.grid[sp.row][sp.col].special = sp.special;
                    this.grid[sp.row][sp.col].empty = false;
                }

                const cb = this.clearAnim.callback;
                this.clearAnim = null;
                if (cb) cb();
            }
            return;
        }

        // 下落动画
        if (this.fallAnim) {
            this.fallAnim.progress += dt / 350;
            if (this.fallAnim.progress >= 1) {
                // 执行实际下落
                for (const fall of this.fallAnim.falls) {
                    if (fall.fromRow >= 0) {
                        this.grid[fall.toRow][fall.col].type = this.grid[fall.fromRow][fall.col].type;
                        this.grid[fall.toRow][fall.col].special = this.grid[fall.fromRow][fall.col].special;
                        this.grid[fall.toRow][fall.col].empty = false;
                    } else {
                        this.grid[fall.toRow][fall.col].type = fall.type;
                        this.grid[fall.toRow][fall.col].special = fall.special;
                        this.grid[fall.toRow][fall.col].empty = false;
                    }
                }

                // 清空顶部空位
                for (let c = 0; c < COLS; c++) {
                    for (let r = 0; r < ROWS; r++) {
                        const cell = this.grid[r][c];
                        if (cell.type < 0 && !cell.obstacle) {
                            cell.empty = true;
                        }
                    }
                }

                const cb = this.fallAnim.callback;
                this.fallAnim = null;
                if (cb) cb();
            }
        }
    }

    // ============================================================
    // 障碍物处理
    // ============================================================
    _damageObstacle(row, col) {
        const cell = this.getCell(row, col);
        if (!cell || !cell.obstacle) return;

        // 检查周围是否有消除
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of dirs) {
            const nr = row + dr;
            const nc = col + dc;
            const neighbor = this.getCell(nr, nc);
            if (neighbor && neighbor.obstacle && neighbor.obstacleHP > 0) {
                neighbor.obstacleHP--;
                if (neighbor.obstacleHP <= 0) {
                    neighbor.obstacle = null;
                    this.engine.audio.playSound('obstacle_break');
                    // 更新清障目标
                    for (const obj of this.engine.objectives) {
                        if (obj.type === 'clear_obstacle') {
                            obj.current++;
                        }
                    }
                }
            }
        }

        // 被困甜品解救
        if (cell.trapped) {
            cell.trapped = false;
            for (const obj of this.engine.objectives) {
                if (obj.type === 'rescue') {
                    obj.current++;
                }
            }
        }
    }

    damageObstacleAt(row, col, damage) {
        const cell = this.getCell(row, col);
        if (!cell || !cell.obstacle) return;
        cell.obstacleHP -= damage;
        if (cell.obstacleHP <= 0) {
            cell.obstacle = null;
            cell.obstacleHP = 0;
            this.engine.audio.playSound('obstacle_break');
            for (const obj of this.engine.objectives) {
                if (obj.type === 'clear_obstacle') obj.current++;
            }
        }
    }

    spreadVines() {
        // 奶油藤蔓蔓延逻辑
        const vinePositions = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c].obstacle === 'vine') {
                    vinePositions.push({ row: r, col: c });
                }
            }
        }

        let spreadCount = 0;
        for (const vine of vinePositions) {
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            const shuffled = dirs.sort(() => Math.random() - 0.5);
            for (const [dr, dc] of shuffled) {
                const nr = vine.row + dr;
                const nc = vine.col + dc;
                const neighbor = this.getCell(nr, nc);
                if (neighbor && !neighbor.obstacle && !neighbor.empty && neighbor.type >= 0) {
                    neighbor.obstacle = 'vine';
                    neighbor.obstacleHP = 1;
                    spreadCount++;
                    this.engine.audio.playSound('vine_spread');
                    break; // 每个藤蔓只蔓延1格
                }
            }
        }

        return spreadCount;
    }

    // ============================================================
    // 渲染
    // ============================================================
    render(ctx) {
        const cs = CELL_SIZE;
        const bl = this.boardLeft;
        const bt = this.boardTop;

        // 棋盘背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(bl, bt, BOARD_WIDTH, BOARD_HEIGHT, 12);
        ctx.fill();

        // 棋盘格子
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = bl + BOARD_PADDING + c * cs;
                const y = bt + BOARD_PADDING + r * cs;

                // 格子底色
                const isLight = (r + c) % 2 === 0;
                ctx.fillStyle = isLight ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)';
                ctx.beginPath();
                ctx.roundRect(x + 1, y + 1, cs - 2, cs - 2, 6);
                ctx.fill();
            }
        }

        // 渲染元素
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = this.grid[r][c];
                if (cell.empty || cell.type < 0) continue;

                const x = bl + BOARD_PADDING + c * cs + cs / 2;
                const y = bt + BOARD_PADDING + r * cs + cs / 2;

                // 检查是否在动画中
                let drawX = x, drawY = y, scale = 1, alpha = 1;

                if (this.swapAnim) {
                    const sa = this.swapAnim;
                    const t = this._easeInOutCubic(sa.progress);
                    if (r === sa.r1 && c === sa.c1) {
                        drawX = sa.startX1 + (bl + BOARD_PADDING + sa.c2 * cs + cs/2 - sa.startX1) * t;
                        drawY = sa.startY1 + (bt + BOARD_PADDING + sa.r2 * cs + cs/2 - sa.startY1) * t;
                    } else if (r === sa.r2 && c === sa.c2) {
                        drawX = sa.startX2 + (bl + BOARD_PADDING + sa.c1 * cs + cs/2 - sa.startX2) * t;
                        drawY = sa.startY2 + (bt + BOARD_PADDING + sa.r1 * cs + cs/2 - sa.startY2) * t;
                    }
                }

                if (this.clearAnim) {
                    const ca = this.clearAnim;
                    for (const cc of ca.cells) {
                        if (cc.row === r && cc.col === c) {
                            scale = 1 - ca.progress;
                            alpha = 1 - ca.progress;
                        }
                    }
                }

                if (this.fallAnim) {
                    const fa = this.fallAnim;
                    for (const fall of fa.falls) {
                        if (fall.toRow === r && fall.col === c) {
                            const startY = fall.fromRow < 0
                                ? bt + BOARD_PADDING + fall.fromRow * cs + cs/2
                                : bt + BOARD_PADDING + fall.fromRow * cs + cs/2;
                            const endY = bt + BOARD_PADDING + r * cs + cs/2;
                            const t = this._easeOutBounce(fa.progress);
                            drawY = startY + (endY - startY) * t;
                        }
                    }
                }

                this._drawCell(ctx, cell, drawX, drawY, scale, alpha);
            }
        }

        // 选中高亮
        if (this.engine.selectedCell && this.engine.state === GAME_STATE.PLAYING) {
            const { row, col } = this.engine.selectedCell;
            const x = bl + BOARD_PADDING + col * cs;
            const y = bt + BOARD_PADDING + row * cs;
            this.selectedPulse += 0.08;
            const pulse = Math.sin(this.selectedPulse) * 0.15 + 0.85;
            ctx.strokeStyle = `rgba(255, 255, 100, ${pulse})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, cs - 4, cs - 4, 6);
            ctx.stroke();
        }
    }

    _drawCell(ctx, cell, cx, cy, scale, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        const cs = CELL_SIZE;

        // 障碍物背景
        if (cell.obstacle) {
            this._drawObstacle(ctx, cell, cs);
        }

        // 甜品
        if (cell.type >= 0) {
            // 被困甜品变暗
            if (cell.trapped) {
                ctx.globalAlpha = alpha * 0.5;
            }

            // 特效边框
            if (cell.special === SPECIAL_TYPES.BOMB) {
                ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, cs * 0.42, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ff6400';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (cell.special === SPECIAL_TYPES.RAINBOW) {
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cs * 0.42);
                gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
                gradient.addColorStop(0.33, 'rgba(0, 255, 0, 0.3)');
                gradient.addColorStop(0.66, 'rgba(0, 0, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 0, 255, 0.3)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, cs * 0.42, 0, Math.PI * 2);
                ctx.fill();
            } else if (cell.special === SPECIAL_TYPES.GIFT_BOX) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, cs * 0.42, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 绘制 Emoji
            const emoji = CANDY_TYPES[cell.type].emoji;
            ctx.font = `${cs * 0.6}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 0, 2);
        }

        ctx.restore();
    }

    _drawObstacle(ctx, cell, cs) {
        const half = cs / 2 - 2;

        switch (cell.obstacle) {
            case 'frost':
                ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
                ctx.fillRect(-half, -half, half * 2, half * 2);
                ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.strokeRect(-half, -half, half * 2, half * 2);
                // 裂纹指示层数
                if (cell.obstacleHP > 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.font = '10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(cell.obstacleHP, 0, half - 4);
                }
                break;

            case 'chocolate':
                ctx.fillStyle = 'rgba(101, 67, 33, 0.7)';
                ctx.beginPath();
                ctx.roundRect(-half, -half, half * 2, half * 2, 4);
                ctx.fill();
                ctx.strokeStyle = 'rgba(60, 40, 20, 0.9)';
                ctx.lineWidth = 2;
                ctx.stroke();
                // 栅栏条纹
                ctx.strokeStyle = 'rgba(139, 90, 43, 0.6)';
                ctx.lineWidth = 1;
                for (let i = -half + 6; i < half; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(i, -half);
                    ctx.lineTo(i, half);
                    ctx.stroke();
                }
                if (cell.obstacleHP > 0) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(cell.obstacleHP, 0, half - 4);
                }
                break;

            case 'vine':
                ctx.fillStyle = 'rgba(34, 139, 34, 0.4)';
                ctx.beginPath();
                ctx.arc(0, 0, half, 0, Math.PI * 2);
                ctx.fill();
                // 藤蔓线条
                ctx.strokeStyle = 'rgba(0, 100, 0, 0.7)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2 + this.engine.lastTime * 0.001;
                    ctx.beginPath();
                    ctx.arc(0, 0, half * 0.7, angle, angle + 1);
                    ctx.stroke();
                }
                break;

            case 'caramel':
                ctx.fillStyle = 'rgba(210, 150, 50, 0.7)';
                ctx.beginPath();
                ctx.roundRect(-half, -half, half * 2, half * 2, 8);
                ctx.fill();
                ctx.strokeStyle = 'rgba(180, 120, 30, 0.9)';
                ctx.lineWidth = 3;
                ctx.stroke();
                // 焦糖光泽
                ctx.fillStyle = 'rgba(255, 220, 100, 0.3)';
                ctx.beginPath();
                ctx.ellipse(-half * 0.3, -half * 0.3, half * 0.4, half * 0.2, -0.5, 0, Math.PI * 2);
                ctx.fill();
                if (cell.obstacleHP > 0) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(cell.obstacleHP, 0, 2);
                }
                break;
        }
    }

    // ============================================================
    // 缓动函数
    // ============================================================
    _easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    _easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
}
