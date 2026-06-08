/**
 * 果甜派对消消乐 - 音频系统
 * 使用 Web Audio API 动态生成音效
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.5;
        this._initOnInteraction();
    }

    _initOnInteraction() {
        // Web Audio API 需要用户交互后才能初始化
        const init = () => {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', init);
            document.removeEventListener('touchstart', init);
        };
        document.addEventListener('click', init);
        document.addEventListener('touchstart', init);
    }

    _ensureContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    // 播放基础音效
    playSound(name) {
        if (!this.enabled) return;
        try {
            const ctx = this._ensureContext();
            switch (name) {
                case 'swap': this._playSwap(ctx); break;
                case 'match': this._playMatch(ctx); break;
                case 'combo': this._playCombo(ctx); break;
                case 'special': this._playSpecial(ctx); break;
                case 'blocked': this._playBlocked(ctx); break;
                case 'win': this._playWin(ctx); break;
                case 'lose': this._playLose(ctx); break;
                case 'level_start': this._playLevelStart(ctx); break;
                case 'click': this._playClick(ctx); break;
                case 'obstacle_break': this._playObstacleBreak(ctx); break;
                case 'vine_spread': this._playVineSpread(ctx); break;
            }
        } catch (e) {
            // 静默处理音频错误
        }
    }

    // 连击音效
    playCombo(combo) {
        if (!this.enabled) return;
        try {
            const ctx = this._ensureContext();
            const baseFreq = 400 + combo * 100;
            this._playTone(ctx, baseFreq, 0.15, 'sine', 0.3 * this.volume);
            setTimeout(() => {
                this._playTone(ctx, baseFreq * 1.25, 0.1, 'sine', 0.2 * this.volume);
            }, 50);
        } catch (e) {}
    }

    // ============================================================
    // 音效合成
    // ============================================================

    _playTone(ctx, freq, duration, type = 'sine', vol = 0.3) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    _playNoise(ctx, duration, vol = 0.1) {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
    }

    _playSwap(ctx) {
        this._playTone(ctx, 600, 0.08, 'sine', 0.2);
        this._playTone(ctx, 800, 0.06, 'sine', 0.15);
    }

    _playMatch(ctx) {
        this._playTone(ctx, 523, 0.12, 'sine', 0.25);
        setTimeout(() => this._playTone(ctx, 659, 0.1, 'sine', 0.2), 60);
    }

    _playCombo(ctx) {
        const freqs = [523, 659, 784, 880, 1047];
        freqs.forEach((f, i) => {
            setTimeout(() => this._playTone(ctx, f, 0.15, 'sine', 0.2), i * 50);
        });
    }

    _playSpecial(ctx) {
        this._playTone(ctx, 400, 0.3, 'triangle', 0.3);
        this._playTone(ctx, 600, 0.2, 'triangle', 0.2);
        this._playNoise(ctx, 0.15, 0.08);
    }

    _playBlocked(ctx) {
        this._playTone(ctx, 200, 0.15, 'square', 0.15);
        this._playTone(ctx, 150, 0.15, 'square', 0.1);
    }

    _playWin(ctx) {
        const melody = [523, 659, 784, 1047, 784, 1047];
        melody.forEach((f, i) => {
            setTimeout(() => this._playTone(ctx, f, 0.2, 'sine', 0.25), i * 100);
        });
    }

    _playLose(ctx) {
        const melody = [400, 350, 300, 250];
        melody.forEach((f, i) => {
            setTimeout(() => this._playTone(ctx, f, 0.25, 'sawtooth', 0.15), i * 150);
        });
    }

    _playLevelStart(ctx) {
        this._playTone(ctx, 440, 0.15, 'sine', 0.2);
        setTimeout(() => this._playTone(ctx, 554, 0.15, 'sine', 0.2), 100);
        setTimeout(() => this._playTone(ctx, 659, 0.2, 'sine', 0.25), 200);
    }

    _playClick(ctx) {
        this._playTone(ctx, 800, 0.05, 'sine', 0.15);
    }

    _playObstacleBreak(ctx) {
        this._playNoise(ctx, 0.1, 0.1);
        this._playTone(ctx, 300, 0.15, 'triangle', 0.2);
    }

    _playVineSpread(ctx) {
        this._playTone(ctx, 150, 0.2, 'sawtooth', 0.1);
        this._playNoise(ctx, 0.15, 0.05);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
