/**
 * ============================================================================
 * REFLEX REACTOR — CORE GAME ENGINE & LOGIC
 * Built for IKARUS Competition — KG Reddy College
 * Pure Client-Side Architecture (Vanilla HTML5 / CSS3 / ES6+ JavaScript)
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * CONSTANTS & CONFIGURATION
   * -------------------------------------------------------------------------- */
  const GAME_DURATION_SEC = 30;

  const DIFFICULTY_CONFIG = {
    easy: {
      name: 'EASY (RECRUIT)',
      baseWindowMs: 1250,
      minWindowMs: 800,
      spawnDelayMs: 350,
      speedupPerHits: 25 // ms reduction every 5 hits
    },
    medium: {
      name: 'MEDIUM (CYBER PILOT)',
      baseWindowMs: 900,
      minWindowMs: 550,
      spawnDelayMs: 250,
      speedupPerHits: 30
    },
    hard: {
      name: 'HARD (HYPER REFLEX)',
      baseWindowMs: 650,
      minWindowMs: 380,
      spawnDelayMs: 180,
      speedupPerHits: 35
    }
  };

  const STORAGE_KEY = 'reflex_reactor_data_v2';

  /* --------------------------------------------------------------------------
   * AUDIO SYNTHESIZER (Web Audio API - Zero External Dependencies)
   * -------------------------------------------------------------------------- */
  class SoundEngine {
    constructor() {
      this.audioCtx = null;
      this.enabled = true;
      this.loadSettings();
    }

    loadSettings() {
      try {
        const saved = localStorage.getItem('reflex_reactor_sound_enabled');
        if (saved !== null) {
          this.enabled = saved === 'true';
        }
      } catch (e) {
        this.enabled = true;
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      try {
        localStorage.setItem('reflex_reactor_sound_enabled', String(this.enabled));
      } catch (e) {
        // Safe fallback
      }
      return this.enabled;
    }

    initContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    playHit(streak = 0) {
      if (!this.enabled) return;
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const baseFreq = 580 + Math.min(streak * 25, 400);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }

    playStreakMilestone() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [659.25, 830.61, 987.77, 1318.51].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const startTime = now + i * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.22);
      });
    }

    playMiss() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    }

    playCountdownTick(isFinal = false) {
      if (!this.enabled) return;
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const freq = isFinal ? 880 : 440;
      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(isFinal ? 0.35 : 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.12));

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + (isFinal ? 0.38 : 0.14));
    }

    playGameOver() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [440, 392, 349.23, 293.66];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const start = now + idx * 0.1;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    }
  }

  /* --------------------------------------------------------------------------
   * CANVAS VISUAL EFFECTS (Sparks & Ambient Background)
   * -------------------------------------------------------------------------- */
  class VisualEffectsEngine {
    constructor(ambientCanvas, effectsCanvas) {
      this.ambientCanvas = ambientCanvas;
      this.effectsCanvas = effectsCanvas;
      this.ambientCtx = ambientCanvas ? ambientCanvas.getContext('2d') : null;
      this.effectsCtx = effectsCanvas ? effectsCanvas.getContext('2d') : null;

      this.particles = [];
      this.bgMotes = [];
      this.animationFrameId = null;

      this.initCanvasSizes();
      this.initBgMotes();
      this.startLoop();

      window.addEventListener('resize', () => {
        this.initCanvasSizes();
        this.initBgMotes();
      });
    }

    initCanvasSizes() {
      if (this.ambientCanvas) {
        this.ambientCanvas.width = window.innerWidth;
        this.ambientCanvas.height = window.innerHeight;
      }
      if (this.effectsCanvas && this.effectsCanvas.parentElement) {
        const rect = this.effectsCanvas.parentElement.getBoundingClientRect();
        this.effectsCanvas.width = rect.width;
        this.effectsCanvas.height = rect.height;
      }
    }

    initBgMotes() {
      this.bgMotes = [];
      const count = Math.floor(window.innerWidth / 30);
      for (let i = 0; i < count; i++) {
        this.bgMotes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          radius: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.4 - 0.1,
          color: Math.random() > 0.5 ? 'rgba(0, 245, 255, 0.4)' : 'rgba(168, 85, 247, 0.4)',
          pulse: Math.random() * Math.PI
        });
      }
    }

    spawnBurst(x, y, count = 16, color = '#00f5ff') {
      if (!this.effectsCtx) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 2,
          color,
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02
        });
      }
    }

    startLoop() {
      const render = () => {
        this.updateAmbient();
        this.updateEffects();
        this.animationFrameId = requestAnimationFrame(render);
      };
      this.animationFrameId = requestAnimationFrame(render);
    }

    updateAmbient() {
      if (!this.ambientCtx || !this.ambientCanvas) return;
      const ctx = this.ambientCtx;
      const w = this.ambientCanvas.width;
      const h = this.ambientCanvas.height;

      ctx.clearRect(0, 0, w, h);

      // Draw subtle cyber grid
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Update and draw motes
      for (let i = 0; i < this.bgMotes.length; i++) {
        const m = this.bgMotes[i];
        m.x += m.vx;
        m.y += m.vy;
        m.pulse += 0.03;

        if (m.y < -10) m.y = h + 10;
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;

        const currentAlpha = 0.2 + Math.sin(m.pulse) * 0.15;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fillStyle = m.color.replace('0.4', Math.max(0, currentAlpha).toFixed(2));
        ctx.fill();
      }
    }

    updateEffects() {
      if (!this.effectsCtx || !this.effectsCanvas) return;
      const ctx = this.effectsCtx;
      const w = this.effectsCanvas.width;
      const h = this.effectsCanvas.height;

      ctx.clearRect(0, 0, w, h);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  /* --------------------------------------------------------------------------
   * STORAGE MANAGER (Safe LocalStorage abstraction)
   * -------------------------------------------------------------------------- */
  class StorageManager {
    static getDefaults() {
      return {
        highScore: 0,
        bestReactionMs: null,
        totalHits: 0,
        totalMisses: 0,
        sessionsCompleted: 0
      };
    }

    static load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return this.getDefaults();
        const parsed = JSON.parse(raw);
        return {
          highScore: Number(parsed.highScore) || 0,
          bestReactionMs: parsed.bestReactionMs !== null && parsed.bestReactionMs !== undefined ? Number(parsed.bestReactionMs) : null,
          totalHits: Number(parsed.totalHits) || 0,
          totalMisses: Number(parsed.totalMisses) || 0,
          sessionsCompleted: Number(parsed.sessionsCompleted) || 0
        };
      } catch (e) {
        console.warn('LocalStorage unavailable, running in-memory session only.', e);
        return this.getDefaults();
      }
    }

    static save(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }

    static reset() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // Safe fallback
      }
    }
  }

  /* --------------------------------------------------------------------------
   * TOAST NOTIFICATION UTILITY
   * -------------------------------------------------------------------------- */
  function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, duration);
  }

  /* --------------------------------------------------------------------------
   * REFLEX REACTOR CONTROLLER (State Machine & Logic)
   * -------------------------------------------------------------------------- */
  class ReflexReactorGame {
    constructor() {
      // Sound & FX
      this.sound = new SoundEngine();
      this.fx = new VisualEffectsEngine(
        document.getElementById('ambient-canvas'),
        document.getElementById('effects-canvas')
      );

      // Persistent Data
      this.storageData = StorageManager.load();

      // State Management: 'START' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'RESULTS'
      this.gameState = 'START';
      this.selectedDifficulty = 'easy';

      // Live Round Telemetry
      this.score = 0;
      this.hits = 0;
      this.misses = 0;
      this.streak = 0;
      this.maxStreak = 0;
      this.currentMultiplier = 1.0;
      this.reactionTimes = [];
      this.bestReactionTimeThisRound = null;
      this.lastReactionTimeThisRound = null;

      // Timer & Target State
      this.timeLeft = GAME_DURATION_SEC;
      this.gameTimerInterval = null;
      this.targetTimeout = null;
      this.spawnTimeout = null;
      this.countdownInterval = null;

      // Current Active Target
      this.activeTargetIndex = -1;
      this.targetSpawnTime = 0;
      this.isTargetResolved = false;

      // AI Auto-Pilot Demonstration Mode
      this.isAiAutoPilot = false;
      this.aiReactionTimeout = null;

      // Cache DOM Elements
      this.cacheDOMElements();

      // Bind Event Listeners
      this.bindEvents();

      // Initialize UI
      this.updateDifficultyDisplay();
      this.updateSoundButtonUI();
      this.updateLifetimeStatsUI();
      this.updateHUD();
    }

    cacheDOMElements() {
      // Header & Navigation
      this.soundToggleBtn = document.getElementById('sound-toggle-btn');
      this.soundIconOn = document.getElementById('sound-icon-on');
      this.soundIconOff = document.getElementById('sound-icon-off');
      this.soundLabel = document.getElementById('sound-label');

      // Hero Elements
      this.heroStartBtn = document.getElementById('hero-start-btn');

      // HUD Elements
      this.hudScore = document.getElementById('hud-score');
      this.streakBadge = document.getElementById('streak-badge');
      this.streakText = document.getElementById('streak-text');
      this.hudTimer = document.getElementById('hud-timer');
      this.timerRingBar = document.getElementById('timer-ring-progress');
      this.hudHits = document.getElementById('hud-hits');
      this.hudMisses = document.getElementById('hud-misses');
      this.hudBestReaction = document.getElementById('hud-best-reaction');
      this.hudLastReaction = document.getElementById('hud-last-reaction');
      this.gameStatusBar = document.getElementById('game-status-bar');
      this.gameStatusMsg = document.getElementById('game-status-message');
      this.activeDiffDisplay = document.getElementById('active-difficulty-display');

      // Grid & Panels
      this.reactorGrid = document.getElementById('reactor-grid');
      this.panels = Array.from(document.querySelectorAll('.reactor-panel'));

      // Overlays
      this.startOverlay = document.getElementById('start-overlay');
      this.countdownOverlay = document.getElementById('countdown-overlay');
      this.countdownNumber = document.getElementById('countdown-number');
      this.resultsOverlay = document.getElementById('results-overlay');
      this.pauseOverlay = document.getElementById('pause-overlay');

      // AI Auto-Pilot Elements
      this.aiDemoToggleBtn = document.getElementById('ai-demo-toggle-btn');
      this.aiDemoLabel = document.getElementById('ai-demo-label');
      this.startAiDemoBtn = document.getElementById('start-ai-demo-btn');

      // Buttons
      this.startGameBtn = document.getElementById('start-game-btn');
      this.playAgainBtn = document.getElementById('play-again-btn');
      this.shareResultsBtn = document.getElementById('share-results-btn');
      this.shareBtnText = document.getElementById('share-btn-text');
      this.backHomeBtn = document.getElementById('back-home-btn');
      this.resumeBtn = document.getElementById('resume-btn');
      this.abortBtn = document.getElementById('abort-btn');
      this.resetStatsBtn = document.getElementById('reset-stats-btn');
      this.diffButtons = Array.from(document.querySelectorAll('.diff-btn'));

      // Results Modal Elements
      this.resultsRankBadge = document.getElementById('results-rank-badge');
      this.resultsFeedback = document.getElementById('results-feedback');
      this.newRecordBanner = document.getElementById('new-record-banner');
      this.resultScore = document.getElementById('result-score');
      this.resultHits = document.getElementById('result-hits');
      this.resultMisses = document.getElementById('result-misses');
      this.resultAccuracy = document.getElementById('result-accuracy');
      this.resultBestTime = document.getElementById('result-best-time');
      this.resultAvgTime = document.getElementById('result-avg-time');

      // Lifetime Stats Elements
      this.statsHighScore = document.getElementById('stats-high-score');
      this.statsBestSpeed = document.getElementById('stats-best-speed');
      this.statsLifetimeAccuracy = document.getElementById('stats-lifetime-accuracy');
      this.statsLifetimeHits = document.getElementById('stats-lifetime-hits');
      this.statsLifetimeMisses = document.getElementById('stats-lifetime-misses');
      this.statsSessionsCount = document.getElementById('stats-sessions-count');
    }

    bindEvents() {
      // Sound Toggle
      if (this.soundToggleBtn) {
        this.soundToggleBtn.addEventListener('click', () => {
          const isEnabled = this.sound.toggle();
          this.updateSoundButtonUI();
          showToast(`Audio Sound Effects: ${isEnabled ? 'ENABLED' : 'MUTED'}`);
        });
      }

      // Difficulty Selector
      this.diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (this.gameState === 'PLAYING' || this.gameState === 'COUNTDOWN') {
            showToast('Cannot switch difficulty during an active round.');
            return;
          }
          const diff = btn.getAttribute('data-difficulty');
          if (diff && DIFFICULTY_CONFIG[diff]) {
            this.setDifficulty(diff);
          }
        });
      });

      // Panel Clicks (Delegated or Direct)
      this.panels.forEach(panel => {
        panel.addEventListener('pointerdown', (e) => {
          const idx = parseInt(panel.getAttribute('data-index'), 10);
          this.handlePanelInteraction(idx, e.clientX, e.clientY);
        });
      });

      // Start & Replay Buttons
      if (this.startGameBtn) {
        this.startGameBtn.addEventListener('click', () => {
          this.isAiAutoPilot = false;
          this.updateAiDemoUI();
          this.startCountdown();
        });
      }
      if (this.startAiDemoBtn) {
        this.startAiDemoBtn.addEventListener('click', () => {
          this.toggleAiAutoPilot(true);
        });
      }
      if (this.aiDemoToggleBtn) {
        this.aiDemoToggleBtn.addEventListener('click', () => {
          this.toggleAiAutoPilot();
        });
      }
      if (this.heroStartBtn) {
        this.heroStartBtn.addEventListener('click', () => {
          const arenaEl = document.getElementById('arena');
          if (arenaEl) {
            arenaEl.scrollIntoView({ behavior: 'smooth' });
          }
          if (this.gameState === 'START' || this.gameState === 'RESULTS') {
            setTimeout(() => this.startCountdown(), 400);
          }
        });
      }
      if (this.playAgainBtn) {
        this.playAgainBtn.addEventListener('click', () => this.startCountdown());
      }
      if (this.backHomeBtn) {
        this.backHomeBtn.addEventListener('click', () => this.returnToStartScreen());
      }

      // Pause & Resume Controls
      if (this.resumeBtn) {
        this.resumeBtn.addEventListener('click', () => this.resumeGame());
      }
      if (this.abortBtn) {
        this.abortBtn.addEventListener('click', () => this.abortGame());
      }

      // Share / Copy Stats
      if (this.shareResultsBtn) {
        this.shareResultsBtn.addEventListener('click', () => this.copyStatsCard());
      }

      // Reset Telemetry Records
      if (this.resetStatsBtn) {
        this.resetStatsBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to reset all saved high scores and reaction records?')) {
            StorageManager.reset();
            this.storageData = StorageManager.getDefaults();
            this.updateLifetimeStatsUI();
            this.updateHUD();
            showToast('All saved telemetry records have been cleared.');
          }
        });
      }

      // Keyboard Controls
      window.addEventListener('keydown', (e) => this.handleKeyboard(e));

      // Window Visibility (Auto pause if tab switched during play)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.gameState === 'PLAYING') {
          this.pauseGame();
        }
      });

      // Active Section Navigation Spy
      this.initNavScrollSpy();
    }

    initNavScrollSpy() {
      const sections = ['hero', 'arena', 'how-to-play', 'statistics']
        .map(id => document.getElementById(id))
        .filter(Boolean);
      const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link'));

      window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + 140;
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          if (section.offsetTop <= scrollPosition) {
            const targetId = `#${section.id}`;
            navLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === targetId);
            });
            break;
          }
        }
      }, { passive: true });
    }

    setDifficulty(diff) {
      this.selectedDifficulty = diff;
      this.diffButtons.forEach(btn => {
        const matches = btn.getAttribute('data-difficulty') === diff;
        btn.classList.toggle('active', matches);
        btn.setAttribute('aria-checked', matches ? 'true' : 'false');
      });
      this.updateDifficultyDisplay();
    }

    updateDifficultyDisplay() {
      const config = DIFFICULTY_CONFIG[this.selectedDifficulty];
      if (this.activeDiffDisplay && config) {
        this.activeDiffDisplay.textContent = config.name;
      }
    }

    updateSoundButtonUI() {
      const on = this.sound.enabled;
      if (this.soundIconOn && this.soundIconOff && this.soundLabel) {
        this.soundIconOn.classList.toggle('hidden', !on);
        this.soundIconOff.classList.toggle('hidden', on);
        this.soundLabel.textContent = on ? 'AUDIO ON' : 'AUDIO OFF';
      }
    }

    toggleAiAutoPilot(forceState = null) {
      this.isAiAutoPilot = forceState !== null ? forceState : !this.isAiAutoPilot;
      this.updateAiDemoUI();

      if (this.isAiAutoPilot) {
        showToast('🤖 AI AUTO-PILOT ENGAGED (Observer Mode)');
        this.setStatusMessage('🤖 AI SYNAPTIC AUTO-PILOT ENGAGED • DEMONSTRATION RUN', 'success');
        if (this.gameState === 'START' || this.gameState === 'RESULTS') {
          this.startCountdown();
        } else if (this.gameState === 'PLAYING' && this.activeTargetIndex >= 0 && !this.isTargetResolved) {
          this.scheduleAiHit(this.activeTargetIndex);
        }
      } else {
        if (this.aiReactionTimeout) clearTimeout(this.aiReactionTimeout);
        this.aiReactionTimeout = null;
        showToast('Manual Pilot Restored.');
        this.setStatusMessage('MANUAL PILOT ENGAGED', 'success');
      }
    }

    updateAiDemoUI() {
      if (this.aiDemoToggleBtn) {
        this.aiDemoToggleBtn.classList.toggle('active', this.isAiAutoPilot);
      }
      if (this.aiDemoLabel) {
        this.aiDemoLabel.textContent = this.isAiAutoPilot ? 'AI AUTO-PILOT: ON' : 'AI AUTO-PILOT: OFF';
      }
    }

    scheduleAiHit(targetIndex) {
      if (!this.isAiAutoPilot || this.gameState !== 'PLAYING') return;
      if (this.aiReactionTimeout) clearTimeout(this.aiReactionTimeout);

      // Simulates superhuman esports reflex latency (170ms - 220ms) with realistic micro-jitter
      const simulatedLatency = Math.floor(Math.random() * 50) + 170;
      this.aiReactionTimeout = setTimeout(() => {
        if (this.isAiAutoPilot && this.gameState === 'PLAYING' && this.activeTargetIndex === targetIndex && !this.isTargetResolved) {
          const targetPanel = this.panels[targetIndex];
          if (targetPanel) {
            const rect = targetPanel.getBoundingClientRect();
            this.handlePanelInteraction(targetIndex, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        }
      }, simulatedLatency);
    }

    /* --------------------------------------------------------------------------
     * STATE 1: START SCREEN & COUNTDOWN
     * -------------------------------------------------------------------------- */
    returnToStartScreen() {
      this.clearAllTimers();
      this.gameState = 'START';
      this.resetRoundData();

      this.resultsOverlay.classList.add('hidden');
      this.pauseOverlay.classList.add('hidden');
      this.countdownOverlay.classList.add('hidden');
      this.startOverlay.classList.remove('hidden');

      this.setStatusMessage('STANDBY • SELECT DIFFICULTY AND PRESS START', '');
      this.clearActiveTargetVisuals();
    }

    startCountdown() {
      this.clearAllTimers();
      this.gameState = 'COUNTDOWN';
      this.resetRoundData();

      this.startOverlay.classList.add('hidden');
      this.resultsOverlay.classList.add('hidden');
      this.pauseOverlay.classList.add('hidden');
      this.countdownOverlay.classList.remove('hidden');

      let counter = 3;
      this.countdownNumber.textContent = counter;
      this.sound.playCountdownTick(false);
      this.setStatusMessage('PREPARING REACTOR PROTOCOL...', 'warning');

      this.countdownInterval = setInterval(() => {
        counter--;
        if (counter > 0) {
          this.countdownNumber.textContent = counter;
          this.sound.playCountdownTick(false);
        } else if (counter === 0) {
          this.countdownNumber.textContent = 'GO!';
          this.sound.playCountdownTick(true);
        } else {
          clearInterval(this.countdownInterval);
          this.countdownOverlay.classList.add('hidden');
          this.startActivePlay();
        }
      }, 900);
    }

    /* --------------------------------------------------------------------------
     * STATE 2: ACTIVE PLAY
     * -------------------------------------------------------------------------- */
    startActivePlay() {
      this.gameState = 'PLAYING';
      this.timeLeft = GAME_DURATION_SEC;
      this.updateHUD();
      this.setStatusMessage('SYSTEM OVERCLOCKED • STRIKE LIT PANELS IMMEDIATELY', 'success');

      // Countdown 30 seconds timer
      const startTime = Date.now();
      const endTime = startTime + GAME_DURATION_SEC * 1000;

      this.gameTimerInterval = setInterval(() => {
        const remainingMs = Math.max(0, endTime - Date.now());
        this.timeLeft = Math.ceil(remainingMs / 1000);
        this.updateTimerDial(remainingMs / (GAME_DURATION_SEC * 1000));

        if (remainingMs <= 0) {
          this.endGame();
        }
      }, 100);

      // Spawn initial target
      this.scheduleNextTarget(100);
    }

    calculateCurrentTargetWindow() {
      const config = DIFFICULTY_CONFIG[this.selectedDifficulty];
      const speedup = Math.floor(this.hits / 5) * config.speedupPerHits;
      return Math.max(config.minWindowMs, config.baseWindowMs - speedup);
    }

    scheduleNextTarget(delayMs = null) {
      if (this.gameState !== 'PLAYING') return;

      const config = DIFFICULTY_CONFIG[this.selectedDifficulty];
      const delay = delayMs !== null ? delayMs : config.spawnDelayMs;

      this.spawnTimeout = setTimeout(() => {
        if (this.gameState !== 'PLAYING') return;
        this.activateRandomTarget();
      }, delay);
    }

    activateRandomTarget() {
      if (this.gameState !== 'PLAYING') return;

      let nextIndex = Math.floor(Math.random() * 9);
      if (nextIndex === this.activeTargetIndex) {
        nextIndex = (nextIndex + 1 + Math.floor(Math.random() * 8)) % 9;
      }

      this.clearActiveTargetVisuals();
      this.activeTargetIndex = nextIndex;
      this.isTargetResolved = false;

      const targetPanel = this.panels[nextIndex];
      if (!targetPanel) return;

      targetPanel.classList.add('target-active');
      if (this.streak >= 10) {
        targetPanel.classList.add('super-streak');
      } else if (this.streak >= 5) {
        targetPanel.classList.add('high-streak');
      }

      this.targetSpawnTime = window.performance.now();

      const windowMs = this.calculateCurrentTargetWindow();
      this.targetTimeout = setTimeout(() => {
        this.handleTargetExpiry(nextIndex);
      }, windowMs);

      // Auto-Pilot Autonomous Trigger
      if (this.isAiAutoPilot) {
        this.scheduleAiHit(nextIndex);
      }
    }

    handleTargetExpiry(targetIdx) {
      if (this.isTargetResolved || this.gameState !== 'PLAYING') return;
      if (this.activeTargetIndex !== targetIdx) return;

      this.isTargetResolved = true;
      this.misses++;
      this.breakStreak();
      this.sound.playMiss();

      const panel = this.panels[targetIdx];
      if (panel) {
        panel.classList.remove('target-active', 'high-streak', 'super-streak');
        panel.classList.add('target-expired');
        this.spawnFloatingText(panel, 'EXPIRED!', 'miss');
      }

      this.setStatusMessage('TARGET DECAYED • MULTIPLIER RESET', 'warning');
      this.updateHUD();

      setTimeout(() => {
        if (panel) panel.classList.remove('target-expired');
        this.clearActiveTargetVisuals();
        this.scheduleNextTarget();
      }, 180);
    }

    handlePanelInteraction(clickedIndex, clientX = null, clientY = null) {
      if (this.gameState !== 'PLAYING') return;

      const panel = this.panels[clickedIndex];
      if (!panel) return;

      // Case A: Correct Hit on Active Target
      if (clickedIndex === this.activeTargetIndex && !this.isTargetResolved) {
        this.isTargetResolved = true;
        clearTimeout(this.targetTimeout);

        const reactionMs = Math.round(window.performance.now() - this.targetSpawnTime);
        this.reactionTimes.push(reactionMs);
        this.lastReactionTimeThisRound = reactionMs;

        if (this.bestReactionTimeThisRound === null || reactionMs < this.bestReactionTimeThisRound) {
          this.bestReactionTimeThisRound = reactionMs;
        }

        this.streak++;
        if (this.streak > this.maxStreak) {
          this.maxStreak = this.streak;
        }

        const prevMultiplier = this.currentMultiplier;
        if (this.streak >= 15) {
          this.currentMultiplier = 2.5;
        } else if (this.streak >= 10) {
          this.currentMultiplier = 2.0;
        } else if (this.streak >= 5) {
          this.currentMultiplier = 1.5;
        } else {
          this.currentMultiplier = 1.0;
        }

        if (this.currentMultiplier > prevMultiplier) {
          this.sound.playStreakMilestone();
          showToast(`⚡ STREAK OVERCLOCK: ${this.currentMultiplier}x MULTIPLIER!`);
        } else {
          this.sound.playHit(this.streak);
        }

        const pointsAwarded = Math.round(10 * this.currentMultiplier);
        this.score += pointsAwarded;
        this.hits++;

        panel.classList.remove('target-active', 'high-streak', 'super-streak');
        panel.classList.add('hit-success');

        const floatLabel = this.currentMultiplier > 1.0 ? `+${pointsAwarded} [${this.currentMultiplier}x]` : `+${pointsAwarded}`;
        this.spawnFloatingText(panel, floatLabel, this.currentMultiplier > 1.0 ? 'crit' : 'normal');

        const rect = panel.getBoundingClientRect();
        const effectsRect = this.fx.effectsCanvas ? this.fx.effectsCanvas.getBoundingClientRect() : rect;
        const burstX = (clientX || (rect.left + rect.width / 2)) - effectsRect.left;
        const burstY = (clientY || (rect.top + rect.height / 2)) - effectsRect.top;
        const particleColor = this.currentMultiplier >= 2.0 ? '#f59e0b' : (this.currentMultiplier >= 1.5 ? '#a855f7' : '#00f5ff');
        this.fx.spawnBurst(burstX, burstY, 18, particleColor);

        this.setStatusMessage(`TARGET HIT • ${reactionMs} ms`, 'success');
        this.updateHUD();

        setTimeout(() => {
          panel.classList.remove('hit-success');
          this.clearActiveTargetVisuals();
          this.scheduleNextTarget();
        }, 120);

      } else {
        // Case B: Incorrect Click on Inactive Panel OR Already Resolved Target
        if (this.isTargetResolved && clickedIndex === this.activeTargetIndex) {
          return;
        }

        this.misses++;
        this.breakStreak();
        this.sound.playMiss();

        panel.classList.add('panel-error');
        this.spawnFloatingText(panel, 'MISS!', 'miss');
        this.triggerScreenShake();

        this.setStatusMessage('INCORRECT SECTOR • STREAK TERMINATED', 'warning');
        this.updateHUD();

        setTimeout(() => {
          panel.classList.remove('panel-error');
        }, 280);
      }
    }

    breakStreak() {
      this.streak = 0;
      this.currentMultiplier = 1.0;
    }

    triggerScreenShake() {
      document.body.classList.remove('screen-shake');
      void document.body.offsetWidth;
      document.body.classList.add('screen-shake');
      setTimeout(() => {
        document.body.classList.remove('screen-shake');
      }, 260);
    }

    spawnFloatingText(targetEl, text, type = 'normal') {
      const container = targetEl.parentElement;
      if (!container) return;

      const floatEl = document.createElement('div');
      floatEl.className = `floating-score ${type}`;
      floatEl.textContent = text;

      const panelRect = targetEl.getBoundingClientRect();
      const parentRect = container.getBoundingClientRect();
      const left = panelRect.left - parentRect.left + panelRect.width / 2;
      const top = panelRect.top - parentRect.top + panelRect.height / 2;

      floatEl.style.left = `${left}px`;
      floatEl.style.top = `${top}px`;

      container.appendChild(floatEl);
      setTimeout(() => {
        if (floatEl.parentElement) floatEl.parentElement.removeChild(floatEl);
      }, 800);
    }

    clearActiveTargetVisuals() {
      this.panels.forEach(p => {
        p.classList.remove('target-active', 'high-streak', 'super-streak', 'hit-success', 'panel-error', 'target-expired');
      });
      this.activeTargetIndex = -1;
      this.isTargetResolved = false;
    }

    setStatusMessage(msg, type = '') {
      if (this.gameStatusMsg) {
        this.gameStatusMsg.textContent = msg;
      }
      if (this.gameStatusBar) {
        this.gameStatusBar.classList.remove('warning', 'success');
        if (type) this.gameStatusBar.classList.add(type);
      }
    }

    updateTimerDial(percent) {
      if (this.hudTimer) {
        this.hudTimer.textContent = this.timeLeft;
      }
      if (this.timerRingBar) {
        const circumference = 264;
        const offset = circumference * (1 - Math.max(0, Math.min(1, percent)));
        this.timerRingBar.style.strokeDashoffset = offset;
        this.timerRingBar.classList.toggle('urgent', this.timeLeft <= 5);
      }
    }

    updateHUD() {
      if (this.hudScore) this.hudScore.textContent = this.score;
      if (this.hudHits) this.hudHits.textContent = this.hits;
      if (this.hudMisses) this.hudMisses.textContent = this.misses;

      if (this.streakBadge && this.streakText) {
        if (this.streak >= 2) {
          this.streakBadge.classList.remove('hidden');
          this.streakText.textContent = `x${this.currentMultiplier.toFixed(1)} (${this.streak})`;
        } else {
          this.streakBadge.classList.add('hidden');
        }
      }

      if (this.hudBestReaction) {
        this.hudBestReaction.textContent = this.bestReactionTimeThisRound !== null ? this.bestReactionTimeThisRound : '--';
      }
      if (this.hudLastReaction) {
        this.hudLastReaction.textContent = this.lastReactionTimeThisRound !== null ? `${this.lastReactionTimeThisRound} ms` : '-- ms';
      }
    }

    /* --------------------------------------------------------------------------
     * PAUSE & RESUME
     * -------------------------------------------------------------------------- */
    pauseGame() {
      if (this.gameState !== 'PLAYING') return;
      this.gameState = 'PAUSED';

      clearInterval(this.gameTimerInterval);
      clearTimeout(this.targetTimeout);
      clearTimeout(this.spawnTimeout);
      if (this.aiReactionTimeout) clearTimeout(this.aiReactionTimeout);

      this.pauseOverlay.classList.remove('hidden');
      this.setStatusMessage('SIMULATION PAUSED', 'warning');
    }

    resumeGame() {
      if (this.gameState !== 'PAUSED') return;
      this.gameState = 'PLAYING';
      this.pauseOverlay.classList.add('hidden');
      this.setStatusMessage('SIMULATION RESUMED', 'success');

      const remainingSec = this.timeLeft;
      const endTime = Date.now() + remainingSec * 1000;

      this.gameTimerInterval = setInterval(() => {
        const remainingMs = Math.max(0, endTime - Date.now());
        this.timeLeft = Math.ceil(remainingMs / 1000);
        this.updateTimerDial(remainingMs / (GAME_DURATION_SEC * 1000));

        if (remainingMs <= 0) {
          this.endGame();
        }
      }, 100);

      this.scheduleNextTarget(250);
    }

    abortGame() {
      this.pauseOverlay.classList.add('hidden');
      this.returnToStartScreen();
      showToast('Simulation aborted.');
    }

    /* --------------------------------------------------------------------------
     * STATE 3: RESULTS & TELEMETRY CALCULATION
     * -------------------------------------------------------------------------- */
    endGame() {
      this.clearAllTimers();
      this.clearActiveTargetVisuals();
      this.gameState = 'RESULTS';
      this.sound.playGameOver();

      const totalAttempts = this.hits + this.misses;
      const accuracyPercent = totalAttempts > 0 ? ((this.hits / totalAttempts) * 100).toFixed(1) : 0;
      const avgReactionTime = this.hits > 0
        ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.hits)
        : null;
      const bestReaction = this.bestReactionTimeThisRound;

      let isNewHighScore = false;
      if (this.score > this.storageData.highScore) {
        this.storageData.highScore = this.score;
        isNewHighScore = true;
      }

      if (bestReaction !== null) {
        if (this.storageData.bestReactionMs === null || bestReaction < this.storageData.bestReactionMs) {
          this.storageData.bestReactionMs = bestReaction;
        }
      }

      this.storageData.totalHits += this.hits;
      this.storageData.totalMisses += this.misses;
      this.storageData.sessionsCompleted += 1;
      StorageManager.save(this.storageData);

      // Render Results Modal
      this.resultScore.textContent = this.score;
      this.resultHits.textContent = this.hits;
      this.resultMisses.textContent = this.misses;
      this.resultAccuracy.textContent = `${accuracyPercent}%`;
      this.resultBestTime.textContent = bestReaction !== null ? `${bestReaction} ms` : '--';
      this.resultAvgTime.textContent = avgReactionTime !== null ? `${avgReactionTime} ms` : '--';

      if (this.newRecordBanner) {
        this.newRecordBanner.classList.toggle('hidden', !isNewHighScore);
      }

      const rankData = this.calculatePerformanceRank(avgReactionTime, accuracyPercent);
      if (this.resultsRankBadge) this.resultsRankBadge.textContent = rankData.badge;
      if (this.resultsFeedback) this.resultsFeedback.textContent = rankData.feedback;

      this.resultsOverlay.classList.remove('hidden');
      this.setStatusMessage(`SESSION TERMINATED • FINAL SCORE: ${this.score}`, 'success');

      this.updateLifetimeStatsUI();
    }

    calculatePerformanceRank(avgMs, accuracy) {
      if (this.isAiAutoPilot) {
        return {
          badge: '🤖 AI AUTO-PILOT DEMO • SSS RANK',
          feedback: 'Autonomous synaptic demonstration complete! Flawless target tracking with simulated 180ms neural latency.'
        };
      }

      if (this.hits === 0) {
        return {
          badge: 'TIER RECRUIT • INACTIVE',
          feedback: 'No targets hit. Review protocol and attempt the simulation again.'
        };
      }

      if (avgMs !== null && avgMs < 200 && accuracy >= 90) {
        return {
          badge: 'SSS RANK • NEURAL OVERCLOCKER',
          feedback: 'Legendary synaptic conductivity! Your reaction latency matches Tier-1 esports pilots and fighter aces.'
        };
      } else if (avgMs !== null && avgMs <= 235 && accuracy >= 80) {
        return {
          badge: 'S RANK • SUB-SYNAPTIC PRODIGY',
          feedback: 'Exceptional visual acuity and hand-eye coordination. Sub-235ms reaction speed places you in top competitive brackets.'
        };
      } else if (avgMs !== null && avgMs <= 280 && accuracy >= 70) {
        return {
          badge: 'A RANK • APEX OPERATOR',
          feedback: 'Very solid athletic reaction time. Sharpen your streak retention to break into the elite S-Tier.'
        };
      } else if (avgMs !== null && avgMs <= 350) {
        return {
          badge: 'B RANK • STEADY OPERATOR',
          feedback: 'Consistent human baseline response. Regular training sessions will rapidly decrease your cognitive latency.'
        };
      } else {
        return {
          badge: 'C RANK • RECRUIT REACTOR',
          feedback: 'Good warmup run! Focus on anticipation and keeping your cursor centered between target activations.'
        };
      }
    }

    updateLifetimeStatsUI() {
      const data = this.storageData;
      if (this.statsHighScore) this.statsHighScore.textContent = data.highScore;
      if (this.statsBestSpeed) this.statsBestSpeed.textContent = data.bestReactionMs !== null ? data.bestReactionMs : '--';
      if (this.statsLifetimeHits) this.statsLifetimeHits.textContent = data.totalHits;
      if (this.statsLifetimeMisses) this.statsLifetimeMisses.textContent = data.totalMisses;
      if (this.statsSessionsCount) this.statsSessionsCount.textContent = data.sessionsCompleted;

      const lifetimeAttempts = data.totalHits + data.totalMisses;
      const lifetimeAcc = lifetimeAttempts > 0 ? ((data.totalHits / lifetimeAttempts) * 100).toFixed(1) : 0;
      if (this.statsLifetimeAccuracy) this.statsLifetimeAccuracy.textContent = `${lifetimeAcc}%`;
    }

    resetRoundData() {
      this.score = 0;
      this.hits = 0;
      this.misses = 0;
      this.streak = 0;
      this.maxStreak = 0;
      this.currentMultiplier = 1.0;
      this.reactionTimes = [];
      this.bestReactionTimeThisRound = null;
      this.lastReactionTimeThisRound = null;
      this.timeLeft = GAME_DURATION_SEC;
      this.activeTargetIndex = -1;
      this.isTargetResolved = false;
      this.updateHUD();
      this.updateTimerDial(1.0);
    }

    clearAllTimers() {
      if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      if (this.targetTimeout) clearTimeout(this.targetTimeout);
      if (this.spawnTimeout) clearTimeout(this.spawnTimeout);
      if (this.aiReactionTimeout) clearTimeout(this.aiReactionTimeout);
      this.gameTimerInterval = null;
      this.countdownInterval = null;
      this.targetTimeout = null;
      this.spawnTimeout = null;
      this.aiReactionTimeout = null;
    }

    /* --------------------------------------------------------------------------
     * KEYBOARD INTERACTION HANDLER
     * -------------------------------------------------------------------------- */
    handleKeyboard(e) {
      const key = e.key;
      const code = e.code;

      // Handle 'D' key for AI Auto-Pilot toggle
      if (key === 'd' || key === 'D') {
        e.preventDefault();
        this.toggleAiAutoPilot();
        return;
      }

      // Handle Space / Enter for Start / Replay
      if (key === ' ' || key === 'Enter') {
        if (this.gameState === 'START') {
          e.preventDefault();
          this.isAiAutoPilot = false;
          this.updateAiDemoUI();
          this.startCountdown();
          return;
        } else if (this.gameState === 'RESULTS') {
          e.preventDefault();
          this.startCountdown();
          return;
        }
      }

      // Handle Escape for Pause / Resume
      if (key === 'Escape') {
        if (this.gameState === 'PLAYING') {
          e.preventDefault();
          this.pauseGame();
          return;
        } else if (this.gameState === 'PAUSED') {
          e.preventDefault();
          this.resumeGame();
          return;
        }
      }

      // Handle Number Keys 1-9 during active play (Supports Top Row & Numpad)
      if (this.gameState === 'PLAYING') {
        let panelIndex = -1;

        if (key >= '1' && key <= '9') {
          panelIndex = parseInt(key, 10) - 1;
        } else if (code && code.startsWith('Digit')) {
          const num = parseInt(code.replace('Digit', ''), 10);
          if (num >= 1 && num <= 9) panelIndex = num - 1;
        } else if (code && code.startsWith('Numpad')) {
          const num = parseInt(code.replace('Numpad', ''), 10);
          if (num >= 1 && num <= 9) panelIndex = num - 1;
        }

        if (panelIndex >= 0 && panelIndex < 9) {
          e.preventDefault();
          const targetPanel = this.panels[panelIndex];
          if (targetPanel) {
            const rect = targetPanel.getBoundingClientRect();
            this.handlePanelInteraction(panelIndex, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        }
      }
    }

    /* --------------------------------------------------------------------------
     * EXPORT / COPY STATS CARD
     * -------------------------------------------------------------------------- */
    copyStatsCard() {
      const totalAttempts = this.hits + this.misses;
      const accuracyPercent = totalAttempts > 0 ? ((this.hits / totalAttempts) * 100).toFixed(1) : 0;
      const avgReactionTime = this.hits > 0
        ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.hits)
        : 'N/A';
      const bestReaction = this.bestReactionTimeThisRound !== null ? `${this.bestReactionTimeThisRound} ms` : 'N/A';

      const card = [
        '⚡ REFLEX REACTOR — IKARUS COMPETITION STATS ⚡',
        `Difficulty: ${this.selectedDifficulty.toUpperCase()}`,
        `Final Score: ${this.score}`,
        `Accuracy: ${accuracyPercent}% (${this.hits} Hits / ${this.misses} Misses)`,
        `Fastest Reaction: ${bestReaction}`,
        `Average Reaction: ${avgReactionTime} ms`,
        `Max Streak: ${this.maxStreak}x`,
        'Built for IKARUS — KG Reddy College'
      ].join('\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(card)
          .then(() => {
            if (this.shareBtnText) {
              const prev = this.shareBtnText.textContent;
              this.shareBtnText.textContent = 'COPIED TO CLIPBOARD!';
              setTimeout(() => { this.shareBtnText.textContent = prev; }, 2500);
            }
            showToast('Stats card copied to clipboard!');
          })
          .catch(() => {
            showToast('Unable to copy automatically. Stats ready.');
          });
      } else {
        showToast('Clipboard API unavailable in this browser context.');
      }
    }
  }

  /* --------------------------------------------------------------------------
   * BOOTSTRAP ON DOM LOAD
   * -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    window.ReflexReactor = new ReflexReactorGame();
  });

})();

