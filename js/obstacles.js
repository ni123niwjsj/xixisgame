/**
 * 果甜派对消消乐 - 障碍物系统
 * 负责：障碍物定义、交互逻辑
 */

// 障碍物配置
const OBSTACLE_CONFIG = {
    frost: {
        name: '糖霜薄冰',
        maxHP: 1,
        canBreakByNormal: true,  // 普通消除可击碎
        canBreakByBomb: true,
        canBreakByGiftBox: true,
        emoji: '🧊',
        description: '1层护甲，普通消除/炸弹可击碎',
    },
    chocolate: {
        name: '巧克力牢笼',
        maxHP: 2,
        canBreakByNormal: false,
        canBreakByBomb: true,
        canBreakByGiftBox: true,
        emoji: '🍫',
        description: '2层护甲，需炸弹/甜品盒击破',
    },
    vine: {
        name: '奶油藤蔓',
        maxHP: 1,
        canBreakByNormal: true,
        canBreakByBomb: true,
        canBreakByGiftBox: true,
        emoji: '🌿',
        description: '每回合蔓延1格，常规消除可切断',
    },
    caramel: {
        name: '焦糖硬壳',
        maxHP: 3,
        canBreakByNormal: false,
        canBreakByBomb: false,
        canBreakByGiftBox: true,
        emoji: '🍬',
        description: '3层护甲，仅高阶特效可击碎',
    },
};

class ObstacleManager {
    /**
     * 处理特效对障碍物的伤害
     */
    static processSpecialEffect(board, affected) {
        for (const a of affected) {
            const cell = board.getCell(a.row, a.col);
            if (!cell) continue;

            if (cell.obstacle) {
                const config = OBSTACLE_CONFIG[cell.obstacle];
                if (!config) continue;

                // 检查是否可以被该特效伤害
                let canDamage = false;
                if (a.damage >= 2 && config.canBreakByGiftBox) canDamage = true;
                else if (a.damage >= 1 && config.canBreakByBomb) canDamage = true;
                else if (config.canBreakByNormal) canDamage = true;

                if (canDamage) {
                    board.damageObstacleAt(a.row, a.col, a.damage);
                }
            }

            // 被困甜品解救
            if (cell.trapped && cell.obstacle === null) {
                cell.trapped = false;
                for (const obj of board.engine.objectives) {
                    if (obj.type === 'rescue') obj.current++;
                }
            }
        }
    }

    /**
     * 检查是否可以交换两个格子
     */
    static canSwap(board, r1, c1, r2, c2) {
        const cell1 = board.getCell(r1, c1);
        const cell2 = board.getCell(r2, c2);
        if (!cell1 || !cell2) return false;

        // 被封锁的格子不可操作
        if (cell1.obstacle === 'chocolate' && cell1.obstacleHP > 0) return false;
        if (cell1.obstacle === 'caramel' && cell1.obstacleHP > 0) return false;
        if (cell2.obstacle === 'chocolate' && cell2.obstacleHP > 0) return false;
        if (cell2.obstacle === 'caramel' && cell2.obstacleHP > 0) return false;

        return true;
    }
}
