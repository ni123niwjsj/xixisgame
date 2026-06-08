/**
 * 果甜派对消消乐 - 主入口
 * 初始化游戏引擎并启动
 */

(function () {
    'use strict';

    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }

    function initGame() {
        console.log('🍉 果甜派对消消乐 v1.0 启动中...');

        // 创建游戏引擎实例
        const engine = new GameEngine('game-canvas');

        // 初始化所有子系统
        engine.init();

        // 暴露到全局（调试用）
        window.gameEngine = engine;

        console.log('✅ 游戏初始化完成！');
        console.log('🎮 操作方式: 鼠标点击/拖拽 交换相邻甜品');
        console.log('📱 支持触屏操作');
    }
})();
