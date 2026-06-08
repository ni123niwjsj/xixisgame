/**
 * 果甜派对消消乐 - Match-3 消除引擎
 * 负责：匹配检测、特效生成、连锁逻辑
 */

class MatchEngine {
    /**
     * 扫描网格，找出所有 ≥3 连的匹配组
     * @returns {Array} [{ cells: [{row, col}], length, isHorizontal }]
     */
    static findMatches(grid) {
        const matches = [];
        const matched = new Set(); // 去重用

        // 水平扫描
        for (let r = 0; r < ROWS; r++) {
            let count = 1;
            for (let c = 1; c < COLS; c++) {
                const prev = grid[r][c - 1];
                const curr = grid[r][c];

                if (prev.type >= 0 && curr.type >= 0 &&
                    prev.type === curr.type &&
                    !prev.obstacle && !curr.obstacle) {
                    count++;
                } else {
                    if (count >= 3) {
                        const cells = [];
                        for (let i = c - count; i < c; i++) {
                            cells.push({ row: r, col: i });
                            matched.add(`${r},${i}`);
                        }
                        matches.push({
                            cells,
                            length: count,
                            isHorizontal: true,
                            type: grid[r][c - 1].type,
                        });
                    }
                    count = 1;
                }
            }
            // 行尾检查
            if (count >= 3) {
                const cells = [];
                for (let i = COLS - count; i < COLS; i++) {
                    cells.push({ row: r, col: i });
                    matched.add(`${r},${i}`);
                }
                matches.push({
                    cells,
                    length: count,
                    isHorizontal: true,
                    type: grid[r][COLS - 1].type,
                });
            }
        }

        // 垂直扫描
        for (let c = 0; c < COLS; c++) {
            let count = 1;
            for (let r = 1; r < ROWS; r++) {
                const prev = grid[r - 1][c];
                const curr = grid[r][c];

                if (prev.type >= 0 && curr.type >= 0 &&
                    prev.type === curr.type &&
                    !prev.obstacle && !curr.obstacle) {
                    count++;
                } else {
                    if (count >= 3) {
                        const cells = [];
                        for (let i = r - count; i < r; i++) {
                            cells.push({ row: i, col: c });
                            matched.add(`${i},${c}`);
                        }
                        matches.push({
                            cells,
                            length: count,
                            isHorizontal: false,
                            type: grid[r - 1][c].type,
                        });
                    }
                    count = 1;
                }
            }
            // 列尾检查
            if (count >= 3) {
                const cells = [];
                for (let i = ROWS - count; i < ROWS; i++) {
                    cells.push({ row: i, col: c });
                    matched.add(`${i},${c}`);
                }
                matches.push({
                    cells,
                    length: count,
                    isHorizontal: false,
                    type: grid[ROWS - 1][c].type,
                });
            }
        }

        // 合并重叠的匹配
        return MatchEngine._mergeOverlapping(matches);
    }

    /**
     * 合并重叠的匹配组
     */
    static _mergeOverlapping(matches) {
        if (matches.length <= 1) return matches;

        // 构建 cell -> match 索引
        const cellMap = new Map();
        for (let i = 0; i < matches.length; i++) {
            for (const cell of matches[i].cells) {
                const key = `${cell.row},${cell.col}`;
                if (!cellMap.has(key)) cellMap.set(key, []);
                cellMap.get(key).push(i);
            }
        }

        // 并查集合并
        const parent = matches.map((_, i) => i);
        const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));
        const union = (a, b) => { parent[find(a)] = find(b); };

        for (const indices of cellMap.values()) {
            for (let i = 1; i < indices.length; i++) {
                union(indices[0], indices[i]);
            }
        }

        // 按组汇总
        const groups = new Map();
        for (let i = 0; i < matches.length; i++) {
            const root = find(i);
            if (!groups.has(root)) {
                groups.set(root, {
                    cells: [],
                    length: 0,
                    isHorizontal: false,
                    type: matches[i].type,
                    isLShape: false,
                    isTShape: false,
                });
            }
            const g = groups.get(root);
            for (const cell of matches[i].cells) {
                const key = `${cell.row},${cell.col}`;
                if (!g.cells.some(c => c.row === cell.row && c.col === cell.col)) {
                    g.cells.push(cell);
                }
            }
            g.length = g.cells.length;
        }

        // 判断 L/T 形状
        for (const g of groups.values()) {
            if (g.length >= 5) {
                const rows = new Set(g.cells.map(c => c.row));
                const cols = new Set(g.cells.map(c => c.col));
                // L/T 形：既有水平匹配又有垂直匹配
                if (rows.size > 1 && cols.size > 1) {
                    g.isLShape = true;
                }
            }
        }

        return Array.from(groups.values());
    }

    /**
     * 根据匹配结果生成特效
     */
    static createSpecials(matches, grid) {
        const specials = [];

        for (const match of matches) {
            if (match.length < 4) continue;

            let specialType = SPECIAL_TYPES.NONE;
            let targetRow, targetCol;

            if (match.length >= 5 && match.isLShape) {
                // L/T 型五连 → 缤纷甜品盒
                specialType = SPECIAL_TYPES.GIFT_BOX;
                // 放在交叉点
                targetRow = match.cells[2].row;
                targetCol = match.cells[2].col;
            } else if (match.length >= 5) {
                // 五连直线 → 彩虹甜饮
                specialType = SPECIAL_TYPES.RAINBOW;
                targetRow = match.cells[2].row;
                targetCol = match.cells[2].col;
            } else if (match.length === 4) {
                // 四连直线 → 甜品炸弹
                specialType = SPECIAL_TYPES.BOMB;
                targetRow = match.cells[1].row;
                targetCol = match.cells[1].col;
            }

            if (specialType !== SPECIAL_TYPES.NONE) {
                specials.push({
                    row: targetRow,
                    col: targetCol,
                    type: match.type,
                    special: specialType,
                });
            }
        }

        return specials;
    }

    /**
     * 执行特效效果
     * @returns 被特效消除的格子列表
     */
    static executeSpecial(board, row, col) {
        const cell = board.getCell(row, col);
        if (!cell || cell.special === SPECIAL_TYPES.NONE) return [];

        const affected = [];

        switch (cell.special) {
            case SPECIAL_TYPES.BOMB: {
                // 甜品炸弹：十字范围消除
                // 击碎1层初级障碍
                for (let r = 0; r < ROWS; r++) {
                    if (r !== row) {
                        affected.push({ row: r, col, damage: 1 });
                    }
                }
                for (let c = 0; c < COLS; c++) {
                    if (c !== col) {
                        affected.push({ row, col: c, damage: 1 });
                    }
                }
                affected.push({ row, col, damage: 1 });
                board.engine.audio.playSound('special');
                break;
            }

            case SPECIAL_TYPES.RAINBOW: {
                // 彩虹甜饮：整行+整列清场
                for (let r = 0; r < ROWS; r++) {
                    affected.push({ row: r, col, damage: 1 });
                }
                for (let c = 0; c < COLS; c++) {
                    if (c !== col) {
                        affected.push({ row, col: c, damage: 1 });
                    }
                }
                board.engine.audio.playSound('special');
                break;
            }

            case SPECIAL_TYPES.GIFT_BOX: {
                // 缤纷甜品盒：3×3 范围爆炸，击碎2层中级障碍
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = row + dr;
                        const nc = col + dc;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                            affected.push({ row: nr, col: nc, damage: 2 });
                        }
                    }
                }
                board.engine.audio.playSound('special');
                break;
            }
        }

        return affected;
    }
}
