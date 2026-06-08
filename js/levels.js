/**
 * 果甜派对消消乐 - 关卡数据系统
 * 数据驱动配置，每5关新增一种障碍
 */

class LevelManager {
    // 关卡数据
    static levels = {
        // ============================================================
        // 第1-5关：无障碍，教学关
        // ============================================================
        1: {
            name: '新手入门',
            moves: 30,
            objectives: [
                { type: 'collect', candyType: 0, target: 10, current: 0, desc: '收集10个西瓜' },
            ],
            obstacles: [],
            trapped: [],
        },
        2: {
            name: '甜蜜起步',
            moves: 30,
            objectives: [
                { type: 'collect', candyType: 1, target: 15, current: 0, desc: '收集15个草莓' },
            ],
            obstacles: [],
            trapped: [],
        },
        3: {
            name: '双色挑战',
            moves: 30,
            objectives: [
                { type: 'collect', candyType: 0, target: 12, current: 0, desc: '收集12个西瓜' },
                { type: 'collect', candyType: 2, target: 12, current: 0, desc: '收集12个甜甜圈' },
            ],
            obstacles: [],
            trapped: [],
        },
        4: {
            name: '速度考验',
            moves: 25,
            objectives: [
                { type: 'collect', candyType: 3, target: 20, current: 0, desc: '收集20个小蛋糕' },
            ],
            obstacles: [],
            trapped: [],
        },
        5: {
            name: '初级毕业',
            moves: 28,
            objectives: [
                { type: 'collect', candyType: 4, target: 15, current: 0, desc: '收集15个布丁' },
                { type: 'collect', candyType: 5, target: 15, current: 0, desc: '收集15个奶茶' },
            ],
            obstacles: [],
            trapped: [],
        },

        // ============================================================
        // 第6-10关：引入糖霜薄冰
        // ============================================================
        6: {
            name: '冰霜初现',
            moves: 30,
            objectives: [
                { type: 'collect', candyType: 0, target: 15, current: 0, desc: '收集15个西瓜' },
                { type: 'clear_obstacle', target: 3, current: 0, desc: '清除3个糖霜' },
            ],
            obstacles: [
                { row: 2, col: 3, type: 'frost', hp: 1 },
                { row: 5, col: 5, type: 'frost', hp: 1 },
                { row: 8, col: 2, type: 'frost', hp: 1 },
            ],
            trapped: [],
        },
        7: {
            name: '冰封甜品',
            moves: 30,
            objectives: [
                { type: 'rescue', target: 2, current: 0, desc: '解救2个被困甜品' },
            ],
            obstacles: [
                { row: 3, col: 4, type: 'frost', hp: 1 },
                { row: 7, col: 3, type: 'frost', hp: 1 },
            ],
            trapped: [
                { row: 3, col: 4 },
                { row: 7, col: 3 },
            ],
        },
        8: {
            name: '霜冻蔓延',
            moves: 28,
            objectives: [
                { type: 'collect', candyType: 2, target: 20, current: 0, desc: '收集20个甜甜圈' },
                { type: 'clear_obstacle', target: 5, current: 0, desc: '清除5个糖霜' },
            ],
            obstacles: [
                { row: 1, col: 2, type: 'frost', hp: 1 },
                { row: 3, col: 6, type: 'frost', hp: 1 },
                { row: 5, col: 1, type: 'frost', hp: 1 },
                { row: 7, col: 5, type: 'frost', hp: 1 },
                { row: 9, col: 3, type: 'frost', hp: 1 },
            ],
            trapped: [],
        },
        9: {
            name: '冰晶迷宫',
            moves: 30,
            objectives: [
                { type: 'clear_obstacle', target: 6, current: 0, desc: '清除所有糖霜' },
            ],
            obstacles: [
                { row: 2, col: 2, type: 'frost', hp: 1 },
                { row: 2, col: 5, type: 'frost', hp: 1 },
                { row: 5, col: 3, type: 'frost', hp: 1 },
                { row: 5, col: 4, type: 'frost', hp: 1 },
                { row: 8, col: 1, type: 'frost', hp: 1 },
                { row: 8, col: 6, type: 'frost', hp: 1 },
            ],
            trapped: [],
        },
        10: {
            name: 'BOSS登场',
            moves: 35,
            objectives: [
                { type: 'boss', target: 50, current: 0, desc: '击败焦糖BOSS' },
            ],
            obstacles: [
                { row: 4, col: 3, type: 'caramel', hp: 3 },
                { row: 4, col: 4, type: 'caramel', hp: 3 },
            ],
            trapped: [],
            boss: {
                hp: 50,
                maxHP: 50,
                interval: 5, // 每5回合生成焦糖硬壳
                shellCount: 1,
            },
        },

        // ============================================================
        // 第11-15关：引入巧克力牢笼
        // ============================================================
        11: {
            name: '巧克力陷阱',
            moves: 30,
            objectives: [
                { type: 'collect', candyType: 1, target: 18, current: 0, desc: '收集18个草莓' },
                { type: 'clear_obstacle', target: 3, current: 0, desc: '清除3个巧克力牢笼' },
            ],
            obstacles: [
                { row: 3, col: 2, type: 'chocolate', hp: 2 },
                { row: 5, col: 5, type: 'chocolate', hp: 2 },
                { row: 8, col: 4, type: 'chocolate', hp: 2 },
            ],
            trapped: [],
        },
        12: {
            name: '牢笼之困',
            moves: 30,
            objectives: [
                { type: 'rescue', target: 3, current: 0, desc: '解救3个被困甜品' },
            ],
            obstacles: [
                { row: 2, col: 3, type: 'chocolate', hp: 2 },
                { row: 5, col: 1, type: 'chocolate', hp: 2 },
                { row: 8, col: 5, type: 'chocolate', hp: 2 },
            ],
            trapped: [
                { row: 2, col: 3 },
                { row: 5, col: 1 },
                { row: 8, col: 5 },
            ],
        },
        13: {
            name: '混合障碍',
            moves: 30,
            objectives: [
                { type: 'clear_obstacle', target: 6, current: 0, desc: '清除所有障碍' },
            ],
            obstacles: [
                { row: 2, col: 2, type: 'frost', hp: 1 },
                { row: 4, col: 5, type: 'chocolate', hp: 2 },
                { row: 6, col: 1, type: 'frost', hp: 1 },
                { row: 6, col: 6, type: 'chocolate', hp: 2 },
                { row: 9, col: 3, type: 'frost', hp: 1 },
                { row: 9, col: 4, type: 'frost', hp: 1 },
            ],
            trapped: [],
        },
        14: {
            name: '巧克力迷阵',
            moves: 28,
            objectives: [
                { type: 'collect', candyType: 3, target: 25, current: 0, desc: '收集25个小蛋糕' },
                { type: 'clear_obstacle', target: 4, current: 0, desc: '清除4个巧克力牢笼' },
            ],
            obstacles: [
                { row: 1, col: 1, type: 'chocolate', hp: 2 },
                { row: 1, col: 6, type: 'chocolate', hp: 2 },
                { row: 6, col: 3, type: 'chocolate', hp: 2 },
                { row: 10, col: 5, type: 'chocolate', hp: 2 },
            ],
            trapped: [],
        },
        15: {
            name: 'BOSS巧克力',
            moves: 35,
            objectives: [
                { type: 'boss', target: 80, current: 0, desc: '击败巧克力BOSS' },
            ],
            obstacles: [
                { row: 3, col: 3, type: 'chocolate', hp: 2 },
                { row: 3, col: 4, type: 'chocolate', hp: 2 },
                { row: 7, col: 3, type: 'chocolate', hp: 2 },
                { row: 7, col: 4, type: 'chocolate', hp: 2 },
            ],
            trapped: [],
            boss: {
                hp: 80,
                maxHP: 80,
                interval: 4,
                shellCount: 2,
            },
        },

        // ============================================================
        // 第16-20关：引入奶油藤蔓
        // ============================================================
        16: {
            name: '藤蔓入侵',
            moves: 30,
            objectives: [
                { type: 'collect', candyType: 4, target: 20, current: 0, desc: '收集20个布丁' },
                { type: 'clear_obstacle', target: 3, current: 0, desc: '清除3个藤蔓' },
            ],
            obstacles: [
                { row: 3, col: 2, type: 'vine', hp: 1 },
                { row: 6, col: 5, type: 'vine', hp: 1 },
                { row: 9, col: 3, type: 'vine', hp: 1 },
            ],
            trapped: [],
        },
        17: {
            name: '蔓延危机',
            moves: 28,
            objectives: [
                { type: 'clear_obstacle', target: 5, current: 0, desc: '清除所有藤蔓' },
            ],
            obstacles: [
                { row: 2, col: 3, type: 'vine', hp: 1 },
                { row: 4, col: 1, type: 'vine', hp: 1 },
                { row: 6, col: 5, type: 'vine', hp: 1 },
                { row: 8, col: 2, type: 'vine', hp: 1 },
                { row: 10, col: 4, type: 'vine', hp: 1 },
            ],
            trapped: [],
        },
        18: {
            name: '藤蔓迷宫',
            moves: 30,
            objectives: [
                { type: 'rescue', target: 2, current: 0, desc: '解救2个被困甜品' },
                { type: 'clear_obstacle', target: 4, current: 0, desc: '清除4个藤蔓' },
            ],
            obstacles: [
                { row: 3, col: 3, type: 'vine', hp: 1 },
                { row: 5, col: 5, type: 'vine', hp: 1 },
                { row: 7, col: 1, type: 'vine', hp: 1 },
                { row: 9, col: 4, type: 'vine', hp: 1 },
            ],
            trapped: [
                { row: 3, col: 3 },
                { row: 9, col: 4 },
            ],
        },
        19: {
            name: '三重混合',
            moves: 30,
            objectives: [
                { type: 'clear_obstacle', target: 8, current: 0, desc: '清除所有障碍' },
            ],
            obstacles: [
                { row: 1, col: 2, type: 'frost', hp: 1 },
                { row: 3, col: 5, type: 'chocolate', hp: 2 },
                { row: 5, col: 1, type: 'vine', hp: 1 },
                { row: 5, col: 6, type: 'vine', hp: 1 },
                { row: 7, col: 3, type: 'frost', hp: 1 },
                { row: 7, col: 4, type: 'chocolate', hp: 2 },
                { row: 9, col: 2, type: 'vine', hp: 1 },
                { row: 10, col: 5, type: 'vine', hp: 1 },
            ],
            trapped: [],
        },
        20: {
            name: 'BOSS藤蔓',
            moves: 35,
            objectives: [
                { type: 'boss', target: 120, current: 0, desc: '击败藤蔓BOSS' },
            ],
            obstacles: [
                { row: 2, col: 2, type: 'vine', hp: 1 },
                { row: 2, col: 5, type: 'vine', hp: 1 },
                { row: 5, col: 3, type: 'vine', hp: 1 },
                { row: 5, col: 4, type: 'vine', hp: 1 },
            ],
            trapped: [],
            boss: {
                hp: 120,
                maxHP: 120,
                interval: 3,
                shellCount: 2,
            },
        },

        // ============================================================
        // 第21-25关：引入焦糖硬壳
        // ============================================================
        21: {
            name: '焦糖来袭',
            moves: 30,
            objectives: [
                { type: 'collect', candyType: 5, target: 20, current: 0, desc: '收集20个奶茶' },
                { type: 'clear_obstacle', target: 2, current: 0, desc: '清除2个焦糖硬壳' },
            ],
            obstacles: [
                { row: 4, col: 3, type: 'caramel', hp: 3 },
                { row: 8, col: 4, type: 'caramel', hp: 3 },
            ],
            trapped: [],
        },
        22: {
            name: '硬壳迷阵',
            moves: 30,
            objectives: [
                { type: 'clear_obstacle', target: 4, current: 0, desc: '清除所有焦糖硬壳' },
            ],
            obstacles: [
                { row: 2, col: 2, type: 'caramel', hp: 3 },
                { row: 2, col: 5, type: 'caramel', hp: 3 },
                { row: 8, col: 2, type: 'caramel', hp: 3 },
                { row: 8, col: 5, type: 'caramel', hp: 3 },
            ],
            trapped: [],
        },
        23: {
            name: '四重障碍',
            moves: 30,
            objectives: [
                { type: 'clear_obstacle', target: 10, current: 0, desc: '清除所有障碍' },
            ],
            obstacles: [
                { row: 1, col: 1, type: 'frost', hp: 1 },
                { row: 2, col: 4, type: 'chocolate', hp: 2 },
                { row: 4, col: 2, type: 'vine', hp: 1 },
                { row: 5, col: 5, type: 'caramel', hp: 3 },
                { row: 7, col: 1, type: 'vine', hp: 1 },
                { row: 7, col: 6, type: 'chocolate', hp: 2 },
                { row: 9, col: 3, type: 'frost', hp: 1 },
                { row: 9, col: 4, type: 'caramel', hp: 3 },
                { row: 10, col: 2, type: 'vine', hp: 1 },
                { row: 10, col: 5, type: 'vine', hp: 1 },
            ],
            trapped: [],
        },
        24: {
            name: '终极混合',
            moves: 30,
            objectives: [
                { type: 'rescue', target: 3, current: 0, desc: '解救3个被困甜品' },
                { type: 'clear_obstacle', target: 8, current: 0, desc: '清除8个障碍' },
            ],
            obstacles: [
                { row: 2, col: 3, type: 'chocolate', hp: 2 },
                { row: 4, col: 1, type: 'vine', hp: 1 },
                { row: 4, col: 5, type: 'caramel', hp: 3 },
                { row: 6, col: 2, type: 'frost', hp: 1 },
                { row: 6, col: 4, type: 'chocolate', hp: 2 },
                { row: 8, col: 5, type: 'vine', hp: 1 },
                { row: 10, col: 1, type: 'caramel', hp: 3 },
                { row: 10, col: 4, type: 'frost', hp: 1 },
            ],
            trapped: [
                { row: 2, col: 3 },
                { row: 6, col: 4 },
                { row: 10, col: 4 },
            ],
        },
        25: {
            name: '最终BOSS',
            moves: 40,
            objectives: [
                { type: 'boss', target: 200, current: 0, desc: '击败最终BOSS' },
            ],
            obstacles: [
                { row: 3, col: 2, type: 'caramel', hp: 3 },
                { row: 3, col: 5, type: 'caramel', hp: 3 },
                { row: 6, col: 3, type: 'chocolate', hp: 2 },
                { row: 6, col: 4, type: 'chocolate', hp: 2 },
                { row: 9, col: 2, type: 'caramel', hp: 3 },
                { row: 9, col: 5, type: 'caramel', hp: 3 },
            ],
            trapped: [],
            boss: {
                hp: 200,
                maxHP: 200,
                interval: 3,
                shellCount: 3,
            },
        },
    };

    static MAX_LEVEL = 25;

    static getLevelData(levelNum) {
        return this.levels[levelNum] || this._generateLevel(levelNum);
    }

    static getMoves(levelNum) {
        const data = this.getLevelData(levelNum);
        return data.moves || 30;
    }

    static getObjectives(levelNum) {
        const data = this.getLevelData(levelNum);
        return data.objectives.map(o => ({ ...o, current: 0 }));
    }

    static getLevelName(levelNum) {
        const data = this.getLevelData(levelNum);
        return data.name || `第${levelNum}关`;
    }

    /**
     * 动态生成超出预设范围的关卡
     */
    static _generateLevel(levelNum) {
        const difficulty = Math.floor((levelNum - 1) / 5);
        const obstacleTypes = ['frost'];
        if (difficulty >= 1) obstacleTypes.push('chocolate');
        if (difficulty >= 2) obstacleTypes.push('vine');
        if (difficulty >= 3) obstacleTypes.push('caramel');

        const obstacleCount = 3 + difficulty * 2;
        const obstacles = [];
        const usedPositions = new Set();

        for (let i = 0; i < obstacleCount; i++) {
            let row, col, attempts = 0;
            do {
                row = 1 + Math.floor(Math.random() * (ROWS - 2));
                col = 1 + Math.floor(Math.random() * (COLS - 2));
                attempts++;
            } while (usedPositions.has(`${row},${col}`) && attempts < 50);

            usedPositions.add(`${row},${col}`);
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            const hp = type === 'caramel' ? 3 : type === 'chocolate' ? 2 : 1;
            obstacles.push({ row, col, type, hp });
        }

        const candyA = Math.floor(Math.random() * 6);
        let candyB = (candyA + 1 + Math.floor(Math.random() * 5)) % 6;

        return {
            name: `挑战${levelNum}`,
            moves: Math.max(20, 30 - Math.floor(levelNum / 10)),
            objectives: [
                { type: 'collect', candyType: candyA, target: 15 + difficulty * 5, current: 0, desc: `收集${15 + difficulty * 5}个${CANDY_TYPES[candyA].name}` },
                { type: 'clear_obstacle', target: obstacleCount, current: 0, desc: `清除${obstacleCount}个障碍` },
            ],
            obstacles,
            trapped: [],
        };
    }
}
