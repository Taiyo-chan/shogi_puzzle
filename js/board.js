import { sound } from './audio.js';
import { OshoSolver } from './solver.js';

export class BoardManager {
  constructor(boardEl, options = {}) {
    this.boardEl = boardEl;
    this.options = options;
    this.pieces = [];
    this.history = []; // for undo
    this.future = []; // for redo
    this.moveCount = 0;
    this.lastMovedPieceId = null;
    this.isWon = false;
    this.isDemoPlaying = false;
    this.demoTimer = null;
    this.selectedPieceIndex = null;
    this.hintMove = null;

    this.onMove = options.onMove || (() => {});
    this.onWin = options.onWin || (() => {});

    this.initEvents();
  }

  loadLevel(levelConfig) {
    this.stopDemo();
    this.currentLevel = levelConfig;
    this.pieces = JSON.parse(JSON.stringify(levelConfig.pieces));
    this.history = [];
    this.future = [];
    this.moveCount = 0;
    this.lastMovedPieceId = null;
    this.isWon = false;
    this.hintMove = null;
    this.selectedPieceIndex = null;

    this.render();
    this.onMove({ moveCount: this.moveCount, canUndo: false, canRedo: false });
  }

  reset() {
    if (this.currentLevel) {
      this.loadLevel(this.currentLevel);
      sound.playBtnClick();
    }
  }

  /**
   * Render all pieces into DOM
   */
  render() {
    this.boardEl.innerHTML = '';

    // Create exit gate highlight at top (X: 1, 2)
    const gate = document.createElement('div');
    gate.className = 'board-gate';
    gate.id = 'board-gate';
    gate.innerHTML = `
      <div class="gate-arch">
        <span class="gate-sign">出陣門</span>
      </div>
    `;
    this.boardEl.appendChild(gate);

    // Create grid background guide lines
    const gridEl = document.createElement('div');
    gridEl.className = 'board-grid-guide';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        gridEl.appendChild(cell);
      }
    }
    this.boardEl.appendChild(gridEl);

    // Create pieces container
    const piecesContainer = document.createElement('div');
    piecesContainer.className = 'pieces-layer';
    this.piecesLayer = piecesContainer;
    this.boardEl.appendChild(piecesContainer);

    this.pieceElements = [];

    this.pieces.forEach((p, idx) => {
      const el = document.createElement('div');
      el.className = `piece piece-${p.type} piece-w${p.w} piece-h${p.h}`;
      el.dataset.index = idx;
      el.dataset.id = p.id;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `${p.name} (${p.w}x${p.h})`);

      // Shogi piece graphic markup
      el.innerHTML = `
        <div class="piece-inner">
          <div class="piece-bevel"></div>
          <div class="piece-kanji">${this.formatKanji(p.name)}</div>
          ${p.type === 'king' ? '<div class="king-crest"></div>' : ''}
          <div class="piece-grain"></div>
        </div>
      `;

      this.updatePiecePosition(el, p.x, p.y);
      this.attachPiecePointerEvents(el, idx);

      piecesContainer.appendChild(el);
      this.pieceElements.push(el);
    });

    this.checkGateStatus();
  }

  formatKanji(name) {
    if (name.length === 2) {
      return `<span class="kanji-top">${name[0]}</span><span class="kanji-bot">${name[1]}</span>`;
    }
    return `<span>${name}</span>`;
  }

  updatePiecePosition(el, x, y, isEscaping = false) {
    const leftPercent = x * 25;
    const topPercent = y * 20;

    if (isEscaping) {
      el.style.left = `${leftPercent}%`;
      el.style.top = `-22%`;
      el.style.transform = `scale(1.06)`;
      el.style.opacity = '0.9';
    } else {
      el.style.left = `${leftPercent}%`;
      el.style.top = `${topPercent}%`;
      el.style.transform = 'translate3d(0, 0, 0)';
      el.style.opacity = '1';
    }
  }

  /**
   * Check if King is in position to escape (at (1, 0))
   */
  checkGateStatus() {
    const king = this.pieces.find(p => p.type === 'king');
    const gate = this.boardEl.querySelector('#board-gate');
    if (!gate || !king) return;

    if (king.x === 1 && king.y === 0) {
      gate.classList.add('gate-open');
      const kingEl = this.pieceElements[this.pieces.indexOf(king)];
      if (kingEl) kingEl.classList.add('king-ready-escape');
    } else {
      gate.classList.remove('gate-open');
      const kingEl = this.pieces.findIndex(p => p.type === 'king');
      if (this.pieceElements[kingEl]) {
        this.pieceElements[kingEl].classList.remove('king-ready-escape');
      }
    }
  }

  /**
   * Pointer & Drag interactions
   */
  attachPiecePointerEvents(el, idx) {
    let startX = 0;
    let startY = 0;
    let startPieceX = 0;
    let startPieceY = 0;
    let isDragging = false;
    let validMoves = [];
    let cellW = 0;
    let cellH = 0;

    const onPointerDown = (e) => {
      if (this.isWon || this.isDemoPlaying) return;
      if (e.button !== undefined && e.button !== 0) return; // primary click only

      const p = this.pieces[idx];
      startPieceX = p.x;
      startPieceY = p.y;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;

      const rect = this.boardEl.getBoundingClientRect();
      cellW = rect.width / 4;
      cellH = rect.height / 5;

      validMoves = OshoSolver.getValidMovesForPiece(this.pieces, idx);

      // Check if King can escape upward
      const canEscape = (p.type === 'king' && p.x === 1 && p.y === 0);
      if (canEscape) {
        validMoves.push({ dir: 'up', dx: 0, dy: -1, toX: 1, toY: -1, isEscape: true });
      }

      el.classList.add('piece-grabbing');
      el.setPointerCapture(e.pointerId);

      const onPointerMove = (me) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;

        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          isDragging = true;
          this.clearHint();
        }

        if (isDragging) {
          // Clamp dragging to valid move bounds
          let allowedMinX = 0;
          let allowedMaxX = 0;
          let allowedMinY = 0;
          let allowedMaxY = 0;

          for (const m of validMoves) {
            if (m.dx < 0) allowedMinX = Math.min(allowedMinX, m.dx * cellW);
            if (m.dx > 0) allowedMaxX = Math.max(allowedMaxX, m.dx * cellW);
            if (m.dy < 0) allowedMinY = Math.min(allowedMinY, m.dy * cellH);
            if (m.dy > 0) allowedMaxY = Math.max(allowedMaxY, m.dy * cellH);
          }

          // Prioritize dominant axis
          let curDx = 0;
          let curDy = 0;
          if (Math.abs(dx) > Math.abs(dy)) {
            curDx = Math.max(allowedMinX, Math.min(allowedMaxX, dx));
          } else {
            curDy = Math.max(allowedMinY, Math.min(allowedMaxY, dy));
          }

          el.style.transition = 'none';
          el.style.transform = `translate3d(${curDx}px, ${curDy}px, 0) scale(1.03)`;
          el.style.zIndex = '30';
        }
      };

      const onPointerUp = (ue) => {
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerup', onPointerUp);
        el.removeEventListener('pointercancel', onPointerUp);
        try { el.releasePointerCapture(ue.pointerId); } catch (_) {}

        el.classList.remove('piece-grabbing');
        el.style.transition = '';
        el.style.zIndex = '';
        el.style.transform = 'translate3d(0, 0, 0)';

        if (!isDragging) {
          // Tap / click handler
          this.handlePieceTap(idx, validMoves);
        } else {
          // Drag release handler
          const totalDx = ue.clientX - startX;
          const totalDy = ue.clientY - startY;

          let targetMove = null;
          const thresholdX = cellW * 0.32;
          const thresholdY = cellH * 0.32;

          if (Math.abs(totalDx) > Math.abs(totalDy)) {
            if (totalDx > thresholdX) targetMove = validMoves.find(m => m.dx === 1);
            else if (totalDx < -thresholdX) targetMove = validMoves.find(m => m.dx === -1);
          } else {
            if (totalDy > thresholdY) targetMove = validMoves.find(m => m.dy === 1);
            else if (totalDy < -thresholdY) targetMove = validMoves.find(m => m.dy === -1);
          }

          if (targetMove) {
            if (targetMove.isEscape) {
              this.executeKingEscape(idx);
            } else {
              this.applyMove(idx, targetMove.toX, targetMove.toY);
            }
          } else {
            // Snap back
            this.updatePiecePosition(el, p.x, p.y);
          }
        }
      };

      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp);
      el.addEventListener('pointercancel', onPointerUp);
    };

    el.addEventListener('pointerdown', onPointerDown);
  }

  /**
   * Handle quick tap on piece
   */
  handlePieceTap(idx, validMoves) {
    const p = this.pieces[idx];
    this.clearHint();

    // If King is at (1, 0) and ready to escape, tap will trigger escape!
    if (p.type === 'king' && p.x === 1 && p.y === 0) {
      this.executeKingEscape(idx);
      return;
    }

    if (validMoves.length === 1) {
      // Exactly 1 valid direction -> slide automatically!
      const move = validMoves[0];
      this.applyMove(idx, move.toX, move.toY);
    } else if (validMoves.length > 1) {
      // Multiple directions -> show visual arrow indicators
      this.showMoveArrows(idx, validMoves);
    } else {
      // Cannot move -> subtle shake
      const el = this.pieceElements[idx];
      el.classList.add('piece-shake');
      setTimeout(() => el.classList.remove('piece-shake'), 300);
    }
  }

  showMoveArrows(idx, validMoves) {
    this.removeMoveArrows();

    const p = this.pieces[idx];
    const el = this.pieceElements[idx];
    el.classList.add('piece-selected');

    const overlay = document.createElement('div');
    overlay.className = 'arrow-overlay';
    this.arrowOverlay = overlay;

    validMoves.forEach(m => {
      const arrowBtn = document.createElement('button');
      arrowBtn.className = `move-arrow-btn arrow-${m.dir}`;
      arrowBtn.innerHTML = this.getArrowSvg(m.dir);
      arrowBtn.title = `移動: ${m.dir}`;

      arrowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeMoveArrows();
        if (m.isEscape) {
          this.executeKingEscape(idx);
        } else {
          this.applyMove(idx, m.toX, m.toY);
        }
      });

      overlay.appendChild(arrowBtn);
    });

    el.appendChild(overlay);

    const closeHandler = (e) => {
      if (!el.contains(e.target)) {
        this.removeMoveArrows();
        document.removeEventListener('pointerdown', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', closeHandler), 10);
  }

  removeMoveArrows() {
    if (this.arrowOverlay) {
      this.arrowOverlay.remove();
      this.arrowOverlay = null;
    }
    this.pieceElements.forEach(el => el.classList.remove('piece-selected'));
  }

  getArrowSvg(dir) {
    const rotation = {
      up: '0',
      right: '90',
      down: '180',
      left: '270'
    }[dir] || '0';
    return `
      <svg viewBox="0 0 24 24" style="transform: rotate(${rotation}deg)">
        <path d="M12 4l-7 7h4v9h6v-9h4z" fill="currentColor" />
      </svg>
    `;
  }

  /**
   * Execute valid move
   */
  applyMove(idx, toX, toY, isDemo = false) {
    const p = this.pieces[idx];
    const prevX = p.x;
    const prevY = p.y;

    // Record history
    this.history.push({
      pieceIdx: idx,
      fromX: prevX,
      fromY: prevY,
      toX,
      toY,
      pieceId: p.id
    });
    this.future = []; // clear redo

    // Update state
    p.x = toX;
    p.y = toY;

    // Sound and animation
    sound.playPieceClick();
    const el = this.pieceElements[idx];
    this.updatePiecePosition(el, toX, toY);

    // Count moves (if moving the same piece consecutively, counts as 1 klotski move)
    if (this.lastMovedPieceId !== p.id) {
      this.moveCount++;
      this.lastMovedPieceId = p.id;
    }

    this.checkGateStatus();
    this.clearHint();

    this.onMove({
      moveCount: this.moveCount,
      canUndo: this.history.length > 0,
      canRedo: this.future.length > 0
    });

    // Auto-check victory if king reached gate and is now at (1, 0)
    if (p.type === 'king' && p.x === 1 && p.y === 0) {
      // King reached gate entrance
      sound.playHyoshigi(0);
    }
  }

  /**
   * Victory escape move
   */
  executeKingEscape(idx) {
    this.isWon = true;
    const p = this.pieces[idx];
    const el = this.pieceElements[idx];

    this.onMove({
      moveCount: this.moveCount,
      canUndo: false,
      canRedo: false
    });

    // Animate king passing through the gate
    this.updatePiecePosition(el, 1, -1, true);
    sound.playVictory();

    setTimeout(() => {
      this.onWin({
        level: this.currentLevel,
        moveCount: this.moveCount
      });
    }, 700);
  }

  /**
   * Undo last move
   */
  undo() {
    if (this.history.length === 0 || this.isWon || this.isDemoPlaying) return;

    this.removeMoveArrows();
    this.clearHint();

    const last = this.history.pop();
    const p = this.pieces[last.pieceIdx];

    this.future.push({
      pieceIdx: last.pieceIdx,
      fromX: p.x,
      fromY: p.y,
      toX: last.fromX,
      toY: last.fromY,
      pieceId: p.id
    });

    p.x = last.fromX;
    p.y = last.fromY;

    const el = this.pieceElements[last.pieceIdx];
    this.updatePiecePosition(el, p.x, p.y);
    sound.playSlide();

    // Recompute last moved piece
    const prevMove = this.history[this.history.length - 1];
    this.lastMovedPieceId = prevMove ? prevMove.pieceId : null;
    this.moveCount = Math.max(0, this.moveCount - 1);

    this.checkGateStatus();
    this.onMove({
      moveCount: this.moveCount,
      canUndo: this.history.length > 0,
      canRedo: this.future.length > 0
    });
  }

  /**
   * Redo move
   */
  redo() {
    if (this.future.length === 0 || this.isWon || this.isDemoPlaying) return;

    this.removeMoveArrows();
    this.clearHint();

    const next = this.future.pop();
    const p = this.pieces[next.pieceIdx];

    this.history.push({
      pieceIdx: next.pieceIdx,
      fromX: p.x,
      fromY: p.y,
      toX: next.toX,
      toY: next.toY,
      pieceId: p.id
    });

    p.x = next.toX;
    p.y = next.toY;

    const el = this.pieceElements[next.pieceIdx];
    this.updatePiecePosition(el, p.x, p.y);
    sound.playPieceClick();

    if (this.lastMovedPieceId !== p.id) {
      this.moveCount++;
      this.lastMovedPieceId = p.id;
    }

    this.checkGateStatus();
    this.onMove({
      moveCount: this.moveCount,
      canUndo: this.history.length > 0,
      canRedo: this.future.length > 0
    });
  }

  /**
   * Hint: compute shortest path from current position and highlight next move
   */
  showHint() {
    if (this.isWon || this.isDemoPlaying) return null;
    this.removeMoveArrows();
    this.clearHint();

    const king = this.pieces.find(p => p.type === 'king');
    if (king && king.x === 1 && king.y === 0) {
      // Ready to escape!
      const kingIdx = this.pieces.indexOf(king);
      const el = this.pieceElements[kingIdx];
      el.classList.add('piece-hint');
      return { msg: '王将を上へスライドさせて出陣！' };
    }

    const sol = OshoSolver.solve(this.pieces);
    if (!sol || sol.path.length === 0) {
      return { msg: '現在の手順からは出陣できません。一手戻すかリセットしてください。' };
    }

    const nextStep = sol.path[0];
    const pIdx = this.pieces.findIndex(p => p.x === nextStep.from.x && p.y === nextStep.from.y);
    if (pIdx === -1) return null;

    const p = this.pieces[pIdx];
    const el = this.pieceElements[pIdx];
    el.classList.add('piece-hint');
    this.hintMove = { pIdx, nextStep };

    return {
      msg: `【ヒント】「${p.name}」を動かしましょう (残り最短 ${sol.moves} 手)`,
      remainingMoves: sol.moves,
      pieceName: p.name
    };
  }

  clearHint() {
    if (this.hintMove) {
      this.pieceElements.forEach(el => el.classList.remove('piece-hint'));
      this.hintMove = null;
    }
  }

  /**
   * Demo playback (God mode / auto-solve)
   */
  startDemo(speedMs = 380, onStep = () => {}, onComplete = () => {}) {
    if (this.isDemoPlaying) return;
    this.isDemoPlaying = true;
    this.clearHint();
    this.removeMoveArrows();

    const sol = OshoSolver.solve(this.pieces);
    if (!sol || sol.path.length === 0) {
      this.isDemoPlaying = false;
      return;
    }

    this.demoSpeedMs = speedMs;
    let stepIdx = 0;
    const playNext = () => {
      if (!this.isDemoPlaying) return;

      if (stepIdx >= sol.path.length) {
        // King at (1, 0) -> escape!
        const kingIdx = this.pieces.findIndex(p => p.type === 'king');
        this.executeKingEscape(kingIdx);
        this.isDemoPlaying = false;
        onComplete();
        return;
      }

      const step = sol.path[stepIdx];
      const pIdx = this.pieces.findIndex(p => p.x === step.from.x && p.y === step.from.y);
      if (pIdx !== -1) {
        this.applyMove(pIdx, step.to.nx, step.to.ny, true);
        onStep({ current: stepIdx + 1, total: sol.path.length });
      }

      stepIdx++;
      this.demoTimer = setTimeout(playNext, this.demoSpeedMs);
    };

    playNext();
  }

  setDemoSpeed(speedMs) {
    this.demoSpeedMs = speedMs;
  }

  stopDemo() {
    if (this.demoTimer) {
      clearTimeout(this.demoTimer);
      this.demoTimer = null;
    }
    this.isDemoPlaying = false;
  }

  initEvents() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'u' || e.key === 'U' || (e.ctrlKey && e.key === 'z') || (e.metaKey && e.key === 'z')) {
        this.undo();
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) this.reset();
      } else if (e.key === 'h' || e.key === 'H') {
        this.showHint();
      }
    });
  }
}
