import { LEVELS } from './levels.js';
import { BoardManager } from './board.js';
import { sound } from './audio.js';
import { SakuraConfetti } from './confetti.js';

class App {
  constructor() {
    this.currentLevelIndex = 0;
    this.timerInterval = null;
    this.timerSeconds = 0;
    this.isTimerRunning = false;
    this.board = null;
    this.confetti = null;

    this.initDOM();
    this.initBoard();
    this.bindEvents();
    this.loadLevel(0);
  }

  initDOM() {
    this.dom = {
      levelSelect: document.getElementById('level-select'),
      stageTitle: document.getElementById('stage-title'),
      stageSubtitle: document.getElementById('stage-subtitle'),
      stageDifficulty: document.getElementById('stage-difficulty'),
      minMovesBadge: document.getElementById('min-moves-badge'),
      moveCounter: document.getElementById('move-counter'),
      timerDisplay: document.getElementById('timer-display'),
      bestScoreDisplay: document.getElementById('best-score-display'),
      hintBanner: document.getElementById('hint-banner'),
      hintText: document.getElementById('hint-text'),
      hintCloseBtn: document.getElementById('hint-close-btn'),

      btnUndo: document.getElementById('btn-undo'),
      btnRedo: document.getElementById('btn-redo'),
      btnReset: document.getElementById('btn-reset'),
      btnHint: document.getElementById('btn-hint'),
      btnDemo: document.getElementById('btn-demo'),
      btnRules: document.getElementById('btn-rules'),
      btnSound: document.getElementById('btn-sound'),

      boardContainer: document.getElementById('board-container'),
      confettiCanvas: document.getElementById('confetti-canvas'),

      // Victory Modal
      victoryModal: document.getElementById('victory-modal'),
      victoryLevelName: document.getElementById('victory-level-name'),
      victoryMoves: document.getElementById('victory-moves'),
      victoryMinMoves: document.getElementById('victory-min-moves'),
      victoryTime: document.getElementById('victory-time'),
      victoryRank: document.getElementById('victory-rank'),
      victoryComment: document.getElementById('victory-comment'),
      btnNextLevel: document.getElementById('btn-next-level'),
      btnVictoryReplay: document.getElementById('btn-victory-replay'),
      btnVictoryClose: document.getElementById('btn-victory-close'),

      // Rules Modal
      rulesModal: document.getElementById('rules-modal'),
      btnRulesClose: document.getElementById('btn-rules-close'),
      btnRulesStart: document.getElementById('btn-rules-start'),

      // Demo Controls Floating Bar
      demoBar: document.getElementById('demo-bar'),
      demoProgress: document.getElementById('demo-progress'),
      btnDemoPause: document.getElementById('btn-demo-pause'),
      btnDemoSpeed: document.getElementById('btn-demo-speed'),
      btnDemoStop: document.getElementById('btn-demo-stop')
    };

    // Populate level select dropdown
    this.dom.levelSelect.innerHTML = '';
    LEVELS.forEach((lvl, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${lvl.title} (${lvl.difficulty} / 最短${lvl.minMoves}手)`;
      this.dom.levelSelect.appendChild(opt);
    });
  }

  initBoard() {
    this.confetti = new SakuraConfetti(this.dom.confettiCanvas);

    this.board = new BoardManager(this.dom.boardContainer, {
      onMove: ({ moveCount, canUndo, canRedo }) => {
        this.updateStats(moveCount, canUndo, canRedo);
        if (!this.isTimerRunning && moveCount > 0) {
          this.startTimer();
        }
      },
      onWin: ({ level, moveCount }) => {
        this.handleVictory(level, moveCount);
      }
    });
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    const level = LEVELS[index];

    this.dom.levelSelect.value = index;
    this.dom.stageTitle.textContent = level.title;
    this.dom.stageSubtitle.textContent = level.description;
    this.dom.stageDifficulty.textContent = level.difficulty;
    this.dom.minMovesBadge.textContent = `最短 ${level.minMoves} 手`;

    this.resetTimer();
    this.hideHint();
    this.hideDemoBar();
    this.board.loadLevel(level);

    this.updateBestScoreDisplay(level.id);
  }

  updateStats(moveCount, canUndo, canRedo) {
    this.dom.moveCounter.textContent = moveCount;
    this.dom.btnUndo.disabled = !canUndo;
    if (this.dom.btnRedo) this.dom.btnRedo.disabled = !canRedo;
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isTimerRunning = true;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.renderTimer();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isTimerRunning = false;
  }

  resetTimer() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.renderTimer();
  }

  renderTimer() {
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    this.dom.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateBestScoreDisplay(levelId) {
    const data = localStorage.getItem(`osho_best_${levelId}`);
    if (data) {
      try {
        const { moves, seconds } = JSON.parse(data);
        const mins = Math.floor(seconds / 60);
        const s = seconds % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        this.dom.bestScoreDisplay.textContent = `自己最高: ${moves}手 (${timeStr})`;
        return;
      } catch (_) {}
    }
    this.dom.bestScoreDisplay.textContent = `自己最高: --`;
  }

  saveBestScore(levelId, moves, seconds) {
    const key = `osho_best_${levelId}`;
    const cur = localStorage.getItem(key);
    let shouldSave = true;
    if (cur) {
      try {
        const prev = JSON.parse(cur);
        if (moves > prev.moves) shouldSave = false;
        else if (moves === prev.moves && seconds >= prev.seconds) shouldSave = false;
      } catch (_) {}
    }
    if (shouldSave) {
      localStorage.setItem(key, JSON.stringify({ moves, seconds }));
      this.updateBestScoreDisplay(levelId);
    }
  }

  handleVictory(level, moveCount) {
    this.stopTimer();
    this.confetti.start(7000);
    this.saveBestScore(level.id, moveCount, this.timerSeconds);

    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    const timeStr = `${mins > 0 ? mins + '分' : ''}${secs}秒`;

    this.dom.victoryLevelName.textContent = level.title;
    this.dom.victoryMoves.textContent = moveCount;
    this.dom.victoryMinMoves.textContent = `(公式最短: ${level.minMoves}手)`;
    this.dom.victoryTime.textContent = timeStr;

    // Rank evaluation
    let rank = '名手';
    let comment = '見事な采配で見事に出陣を果たしました！';

    const diff = moveCount - level.minMoves;
    if (diff === 0) {
      rank = '名人・神業（免許皆伝）';
      comment = '驚異の最短手順！非の打ち所のない神の一手を指し続けました！';
    } else if (diff <= 5) {
      rank = '達人（九段）';
      comment = '最短手に極めて近い洗練された美しい駒捌きです！';
    } else if (diff <= 20) {
      rank = '名手（六段）';
      comment = '盤面を巧みに制して出陣への活路を切り拓きました！';
    } else {
      rank = '奮闘（三段）';
      comment = '粘り強く駒を繰り出し、見事に出陣を成し遂げました！';
    }

    this.dom.victoryRank.textContent = rank;
    this.dom.victoryComment.textContent = comment;

    // Show/hide next stage button
    if (this.currentLevelIndex < LEVELS.length - 1) {
      this.dom.btnNextLevel.style.display = 'inline-flex';
    } else {
      this.dom.btnNextLevel.style.display = 'none';
    }

    this.dom.victoryModal.classList.add('modal-open');
  }

  showHint() {
    const hint = this.board.showHint();
    if (!hint) return;

    sound.playBtnClick();
    this.dom.hintText.textContent = hint.msg;
    this.dom.hintBanner.classList.add('banner-visible');
  }

  hideHint() {
    this.dom.hintBanner.classList.remove('banner-visible');
    if (this.board) this.board.clearHint();
  }

  startGodDemo() {
    sound.playBtnClick();
    this.resetTimer();
    this.dom.demoBar.classList.add('bar-visible');

    this.demoSpeeds = [
      { label: '速度: 1x', ms: 380 },
      { label: '速度: 2x', ms: 160 },
      { label: '速度: 4x', ms: 70 }
    ];
    this.currentSpeedIdx = 0;
    if (this.dom.btnDemoSpeed) {
      this.dom.btnDemoSpeed.textContent = this.demoSpeeds[0].label;
    }

    this.board.startDemo(
      this.demoSpeeds[0].ms,
      ({ current, total }) => {
        this.dom.demoProgress.textContent = `自動出陣再生中: ${current} / ${total} 手`;
      },
      () => {
        this.hideDemoBar();
      }
    );
  }

  toggleDemoSpeed() {
    if (!this.demoSpeeds) return;
    sound.playBtnClick();
    this.currentSpeedIdx = (this.currentSpeedIdx + 1) % this.demoSpeeds.length;
    const cur = this.demoSpeeds[this.currentSpeedIdx];
    this.dom.btnDemoSpeed.textContent = cur.label;
    this.board.setDemoSpeed(cur.ms);
  }

  hideDemoBar() {
    this.dom.demoBar.classList.remove('bar-visible');
    if (this.board) this.board.stopDemo();
  }

  bindEvents() {
    // Level select
    this.dom.levelSelect.addEventListener('change', (e) => {
      sound.playBtnClick();
      this.loadLevel(parseInt(e.target.value, 10));
    });

    // Toolbar buttons
    this.dom.btnUndo.addEventListener('click', () => this.board.undo());
    if (this.dom.btnRedo) {
      this.dom.btnRedo.addEventListener('click', () => this.board.redo());
    }
    this.dom.btnReset.addEventListener('click', () => {
      this.board.reset();
      this.resetTimer();
      this.hideHint();
    });

    this.dom.btnHint.addEventListener('click', () => this.showHint());
    this.dom.hintCloseBtn.addEventListener('click', () => this.hideHint());

    this.dom.btnDemo.addEventListener('click', () => this.startGodDemo());
    if (this.dom.btnDemoSpeed) {
      this.dom.btnDemoSpeed.addEventListener('click', () => this.toggleDemoSpeed());
    }
    this.dom.btnDemoStop.addEventListener('click', () => this.hideDemoBar());

    // Sound toggle
    this.dom.btnSound.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.dom.btnSound.classList.toggle('btn-muted', isMuted);
      this.dom.btnSound.querySelector('.btn-label').textContent = isMuted ? '消音中' : '効果音';
      if (!isMuted) sound.playPieceClick();
    });

    // Rules Modal
    this.dom.btnRules.addEventListener('click', () => {
      sound.playBtnClick();
      this.dom.rulesModal.classList.add('modal-open');
    });
    this.dom.btnRulesClose.addEventListener('click', () => {
      sound.playBtnClick();
      this.dom.rulesModal.classList.remove('modal-open');
    });
    this.dom.btnRulesStart.addEventListener('click', () => {
      sound.playBtnClick();
      this.dom.rulesModal.classList.remove('modal-open');
    });

    // Victory Modal
    this.dom.btnVictoryClose.addEventListener('click', () => {
      sound.playBtnClick();
      this.dom.victoryModal.classList.remove('modal-open');
      this.confetti.stop();
    });
    this.dom.btnVictoryReplay.addEventListener('click', () => {
      sound.playBtnClick();
      this.dom.victoryModal.classList.remove('modal-open');
      this.confetti.stop();
      this.board.reset();
      this.resetTimer();
    });
    this.dom.btnNextLevel.addEventListener('click', () => {
      sound.playBtnClick();
      this.dom.victoryModal.classList.remove('modal-open');
      this.confetti.stop();
      if (this.currentLevelIndex < LEVELS.length - 1) {
        this.loadLevel(this.currentLevelIndex + 1);
      }
    });

    // Close modals on overlay backdrop click
    [this.dom.victoryModal, this.dom.rulesModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('modal-open');
          this.confetti.stop();
        }
      });
    });
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
