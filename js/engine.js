/**
 * 果甜派对消消乐 - 游戏引擎核心
 * 负责：游戏循环、状态机、输入处理、渲染管理
 */

// ============================================================
// Canvas roundRect polyfill（兼容老浏览器）
// ============================================================
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        let r;
        if (typeof radii === 'number') {
            r = { tl: radii, tr: radii, br: radii, bl: radii };
        } else if (Array.isArray(radii)) {
            r = { tl: radii[0] || 0, tr: radii[1] || radii[0] || 0, br: radii[2] || radii[0] || 0, bl: radii[3] || radii[1] || radii[0] || 0 };
        } else {
            r = { tl: 0, tr: 0, br: 0, bl: 0 };
        }
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
        return this;
    };
}

// ============================================================
// 常量定义
// ============================================================
const COLS = 8;
const ROWS = 12;
const CELL_SIZE = 56;
const BOARD_PADDING = 8;
const BOARD_WIDTH = COLS * CELL_SIZE + BOARD_PADDING * 2;
const BOARD_HEIGHT = ROWS * CELL_SIZE + BOARD_PADDING * 2;

// 画布尺寸：棋盘 + 顶部HUD + 底部信息栏
const CANVAS_WIDTH = BOARD_WIDTH + 40;
const CANVAS_HEIGHT = BOARD_HEIGHT + 180;

// 甜品种类
const CANDY_TYPES = [
    { id: 0, emoji: '🍉', name: '西瓜', color: '#ff4757' },
    { id: 1, emoji: '🍓', name: '草莓', color: '#ff6b81' },
    { id: 2, emoji: '🍩', name: '甜甜圈', color: '#ffa502' },
    { id: 3, emoji: '🧁', name: '小蛋糕', color: '#eccc68' },
    { id: 4, emoji: '🍮', name: '小布丁', color: '#7bed9f' },
    { id: 5, emoji: '🧋', name: '奶茶', color: '#70a1ff' },
];

// 特效类型
const SPECIAL_TYPES = {
    NONE: 0,
    BOMB: 1,      // 甜品炸弹（四连）
    RAINBOW: 2,   // 彩虹甜饮（五连）
    GIFT_BOX: 3,  // 缤纷甜品盒（L/T型五连）
};

// 游戏状态
const GAME_STATE = {
    MENU: 'menu',
    LEVEL_SELECT: 'level_select',
    PLAYING: 'playing',
    ANIMATING: 'animating',
    WIN: 'win',
    LOSE: 'lose',
    PAUSED: 'paused',
};

// 动画状态
const ANIM_STATE = {
    IDLE: 'idle',
    SWAPPING: 'swapping',
    SWAP_BACK: 'swap_back',
    MATCHING: 'matching',
    FALLING: 'falling',
    OBSTACLE_SPREAD: 'obstacle_spread',
};

// ============================================================
// 引擎类
// ============================================================
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // 适配屏幕
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());

        // 游戏状态
        this.state = GAME_STATE.MENU;
        this.animState = ANIM_STATE.IDLE;
        this.score = 0;
        this.moves = 30;
        this.lives = 3;
        this.currentLevel = 1;
        this.combo = 0;
        this.maxCombo = 0;

        // 关卡目标
        this.objectives = [];

        // 时间
        this.lastTime = 0;
        this.deltaTime = 0;
        this.accumulator = 0;
        this.FIXED_DT = 1000 / 60; // 60FPS

        // 输入
        this.input = new InputManager(this.canvas, this);
        this.touchStartPos = null;
        this.selectedCell = null;
        this.swapTarget = null;

        // 子系统（后续初始化）
        this.board = null;
        this.audio = null;
        this.ui = null;
        this.effects = null;

        // 渲染缩放
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // 动画队列
        this.animations = [];
        this.animCallback = null;
    }

    _resizeCanvas() {
        const container = this.canvas.parentElement;
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        const scaleX = cw / CANVAS_WIDTH;
        const scaleY = ch / CANVAS_HEIGHT;
        this.scale = Math.min(scaleX, scaleY, 2); // 最大2倍缩放

        this.canvas.style.width = (CANVAS_WIDTH * this.scale) + 'px';
        this.canvas.style.height = (CANVAS_HEIGHT * this.scale) + 'px';

        // 计算偏移（用于输入坐标转换）
        const rect = this.canvas.getBoundingClientRect();
        this.offsetX = rect.left;
        this.offsetY = rect.top;
    }

    // 初始化所有子系统
    init() {
        this.audio = new AudioManager();
        this.board = new GameBoard(this);
        this.effects = new EffectsManager(this);
        this.ui = new UIManager(this);

        // 加载玩家进度
        this._loadProgress();

        // 启动游戏循环
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this._gameLoop(t));
    }

    _gameLoop(timestamp) {
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // 限制最大delta，防止跳帧
        if (this.deltaTime > 100) this.deltaTime = 100;

        this.accumulator += this.deltaTime;

        // 固定步长更新
        while (this.accumulator >= this.FIXED_DT) {
            this._update(this.FIXED_DT);
            this.accumulator -= this.FIXED_DT;
        }

        this._render();

        requestAnimationFrame((t) => this._gameLoop(t));
    }

    _update(dt) {
        // 更新特效
        if (this.effects) {
            this.effects.update(dt);
        }

        // 根据状态更新
        switch (this.state) {
            case GAME_STATE.PLAYING:
                this._updatePlaying(dt);
                break;
        }
    }

    _updatePlaying(dt) {
        // 检查动画状态
        if (this.animState !== ANIM_STATE.IDLE) {
            this._updateAnimations(dt);
            return;
        }
    }

    _updateAnimations(dt) {
        // 由 board.js 中的动画逻辑处理
        if (this.board && this.board.updateAnimations) {
            this.board.updateAnimations(dt);
        }
    }

    _render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 根据状态渲染
        switch (this.state) {
            case GAME_STATE.MENU:
                this.ui.renderMenu(ctx);
                break;
            case GAME_STATE.LEVEL_SELECT:
                this.ui.renderLevelSelect(ctx);
                break;
            case GAME_STATE.PLAYING:
            case GAME_STATE.ANIMATING:
                this._renderGame(ctx);
                break;
            case GAME_STATE.WIN:
                this._renderGame(ctx);
                this.ui.renderWin(ctx);
                break;
            case GAME_STATE.LOSE:
                this._renderGame(ctx);
                this.ui.renderLose(ctx);
                break;
            case GAME_STATE.PAUSED:
                this._renderGame(ctx);
                this.ui.renderPause(ctx);
                break;
        }
    }

    _renderGame(ctx) {
        // 背景
        this.ui.renderBackground(ctx);

        // 棋盘
        if (this.board) {
            this.board.render(ctx);
        }

        // 特效层
        if (this.effects) {
            this.effects.render(ctx);
        }

        // UI层
        if (this.ui) {
            this.ui.renderHUD(ctx);
        }
    }

    // ============================================================
    // 关卡管理
    // ============================================================
    startLevel(levelNum) {
        this.currentLevel = levelNum;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.moves = LevelManager.getMoves(levelNum);
        this.animState = ANIM_STATE.IDLE;

        // 初始化关卡目标
        this.objectives = LevelManager.getObjectives(levelNum);

        // 初始化棋盘
        this.board.initLevel(levelNum);

        this.state = GAME_STATE.PLAYING;
        this.audio.playSound('level_start');
    }

    // ============================================================
    // 消除流程核心
    // ============================================================
    trySwap(r1, c1, r2, c2) {
        if (this.state !== GAME_STATE.PLAYING) return;
        if (this.animState !== ANIM_STATE.IDLE) return;

        // 检查是否相邻
        const dr = Math.abs(r1 - r2);
        const dc = Math.abs(c1 - c2);
        if (dr + dc !== 1) return;

        // 检查是否有障碍阻挡
        if (this.board.isBlocked(r1, c1) || this.board.isBlocked(r2, c2)) {
            this.audio.playSound('blocked');
            return;
        }

        this.animState = ANIM_STATE.SWAPPING;
        this.board.animateSwap(r1, c1, r2, c2, () => {
            // 交换后检查匹配
            const matches = MatchEngine.findMatches(this.board.grid);

            if (matches.length > 0) {
                // 有效交换，扣步数
                this.moves--;
                this.combo = 0;
                this._processMatches(matches);
            } else {
                // 无效交换，换回
                this.animState = ANIM_STATE.SWAP_BACK;
                this.board.animateSwap(r2, c2, r1, c1, () => {
                    this.animState = ANIM_STATE.IDLE;
                });
            }
        });
    }

    _processMatches(matches) {
        this.animState = ANIM_STATE.MATCHING;
        this.combo++;

        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // 计算得分
        const comboMultiplier = Math.min(this.combo, 5);
        const matchScore = matches.reduce((sum, m) => sum + m.cells.length * 10, 0) * comboMultiplier;
        this.score += matchScore;

        // 更新目标进度
        this._updateObjectives(matches);

        // 播放消除音效
        this.audio.playCombo(this.combo);

        // 生成特效
        const specials = MatchEngine.createSpecials(matches, this.board.grid);

        // 执行消除动画
        this.board.animateClear(matches, specials, () => {
            // 下落补位
            this.animState = ANIM_STATE.FALLING;
            this.board.animateFall(() => {
                // 连锁检测
                const newMatches = MatchEngine.findMatches(this.board.grid);
                if (newMatches.length > 0) {
                    this._processMatches(newMatches);
                } else {
                    // 连锁结束，处理障碍蔓延
                    this._endTurn();
                }
            });
        });
    }

    _endTurn() {
        // 奶油藤蔓蔓延
        const vineSpread = this.board.spreadVines();
        if (vineSpread > 0) {
            this.animState = ANIM_STATE.OBSTACLE_SPREAD;
            setTimeout(() => {
                this._checkGameState();
            }, 300);
        } else {
            this._checkGameState();
        }
    }

    _checkGameState() {
        this.animState = ANIM_STATE.IDLE;

        // 检查胜利
        if (this._checkWin()) {
            this.state = GAME_STATE.WIN;
            this._onWin();
            return;
        }

        // 检查失败
        if (this._checkLose()) {
            this.state = GAME_STATE.LOSE;
            this._onLose();
            return;
        }
    }

    _checkWin() {
        return this.objectives.every(obj => obj.current >= obj.target);
    }

    _checkLose() {
        // 步数用完且目标未完成
        if (this.moves <= 0) return true;
        // 棋盘被封堵
        if (!this.board.hasValidMoves()) return true;
        return false;
    }

    _onWin() {
        this.audio.playSound('win');
        const stars = this._calculateStars();
        this._saveProgress(stars);
    }

    _onLose() {
        this.audio.playSound('lose');
        this.lives--;
        if (this.lives <= 0) {
            // 生命归零，返回关卡选择
            setTimeout(() => {
                this.lives = 3;
                this.state = GAME_STATE.LEVEL_SELECT;
            }, 2000);
        }
    }

    _calculateStars() {
        // 根据剩余步数计算星级
        const maxMoves = LevelManager.getMoves(this.currentLevel);
        const ratio = this.moves / maxMoves;
        if (ratio > 0.5) return 3;
        if (ratio > 0.2) return 2;
        return 1;
    }

    _updateObjectives(matches) {
        for (const obj of this.objectives) {
            switch (obj.type) {
                case 'collect':
                    for (const m of matches) {
                        for (const cell of m.cells) {
                            const candy = this.board.grid[cell.row][cell.col];
                            if (candy && candy.type === obj.candyType) {
                                obj.current++;
                            }
                        }
                    }
                    break;
                case 'clear_obstacle':
                    // 障碍消除时由 board 更新
                    break;
                case 'rescue':
                    // 解救目标由 board 更新
                    break;
                case 'boss':
                    // BOSS 伤害由特效系统更新
                    break;
            }
        }
    }

    // ============================================================
    // 进度存储
    // ============================================================
    _loadProgress() {
        try {
            const data = localStorage.getItem('fruit_sweet_progress');
            this.progress = data ? JSON.parse(data) : { levels: {}, maxLevel: 1 };
        } catch (e) {
            this.progress = { levels: {}, maxLevel: 1 };
        }
    }

    _saveProgress(stars) {
        const lv = this.currentLevel;
        const prev = this.progress.levels[lv] || { stars: 0, score: 0 };
        this.progress.levels[lv] = {
            stars: Math.max(prev.stars, stars),
            score: Math.max(prev.score, this.score),
        };
        if (lv >= this.progress.maxLevel) {
            this.progress.maxLevel = lv + 1;
        }
        try {
            localStorage.setItem('fruit_sweet_progress', JSON.stringify(this.progress));
        } catch (e) {}
    }

    // ============================================================
    // 输入坐标转换
    // ============================================================
    screenToGrid(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (screenX - rect.left) * scaleX;
        const y = (screenY - rect.top) * scaleY;

        const boardLeft = (CANVAS_WIDTH - BOARD_WIDTH) / 2 + BOARD_PADDING;
        const boardTop = 100 + BOARD_PADDING; // HUD高度100

        const col = Math.floor((x - boardLeft) / CELL_SIZE);
        const row = Math.floor((y - boardTop) / CELL_SIZE);

        if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
            return { row, col };
        }
        return null;
    }
}

// ============================================================
// 输入管理器
// ============================================================
class InputManager {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.isDragging = false;
        this.startPos = null;
        this.startCell = null;

        // 鼠标事件
        canvas.addEventListener('mousedown', (e) => this._onPointerDown(e.clientX, e.clientY));
        canvas.addEventListener('mousemove', (e) => this._onPointerMove(e.clientX, e.clientY));
        canvas.addEventListener('mouseup', (e) => this._onPointerUp(e.clientX, e.clientY));

        // 触摸事件
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this._onPointerDown(t.clientX, t.clientY);
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this._onPointerMove(t.clientX, t.clientY);
        }, { passive: false });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this._onPointerUp();
        }, { passive: false });
    }

    _onPointerDown(x, y) {
        // 非游戏中状态：所有UI点击统一走 handleClick
        if (this.engine.state === GAME_STATE.MENU ||
            this.engine.state === GAME_STATE.LEVEL_SELECT ||
            this.engine.state === GAME_STATE.WIN ||
            this.engine.state === GAME_STATE.LOSE ||
            this.engine.state === GAME_STATE.PAUSED) {
            if (this.engine.ui) {
                this.engine.ui.handleClick(x, y);
            }
            return;
        }

        // 动画中不响应操作
        if (this.engine.state !== GAME_STATE.PLAYING) return;

        const cell = this.engine.screenToGrid(x, y);
        if (!cell) return;

        this.isDragging = true;
        this.startPos = { x, y };
        this.startCell = cell;
        this.engine.selectedCell = cell;
    }

    _onPointerMove(x, y) {
        if (!this.isDragging || !this.startCell) return;

        const dx = x - this.startPos.x;
        const dy = y - this.startPos.y;
        const threshold = CELL_SIZE * 0.4;

        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            // 确定滑动方向
            let dr = 0, dc = 0;
            if (Math.abs(dx) > Math.abs(dy)) {
                dc = dx > 0 ? 1 : -1;
            } else {
                dr = dy > 0 ? 1 : -1;
            }

            const tr = this.startCell.row + dr;
            const tc = this.startCell.col + dc;

            if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) {
                this.engine.trySwap(this.startCell.row, this.startCell.col, tr, tc);
            }

            this.isDragging = false;
            this.startCell = null;
            this.engine.selectedCell = null;
        }
    }

    _onPointerUp() {
        this.isDragging = false;
        this.startCell = null;
    }
}
