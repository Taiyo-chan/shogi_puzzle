/**
 * High-performance BFS Solver for Klotski / Osho Shutujin
 * Finds optimal solutions (by piece-moves) in milliseconds.
 */
export class OshoSolver {
  /**
   * Encode board state into canonical string (shapes grouped and sorted)
   */
  static encodeState(pieces) {
    let king = null;
    let horizontals = [];
    let verticals = [];
    let smalls = [];

    for (let p of pieces) {
      if (p.w === 2 && p.h === 2) {
        king = `${p.x},${p.y}`;
      } else if (p.w === 2 && p.h === 1) {
        horizontals.push(`${p.x},${p.y}`);
      } else if (p.w === 1 && p.h === 2) {
        verticals.push(`${p.x},${p.y}`);
      } else if (p.w === 1 && p.h === 1) {
        smalls.push(`${p.x},${p.y}`);
      }
    }
    horizontals.sort();
    verticals.sort();
    smalls.sort();
    return `${king}|${horizontals.join(';')}|${verticals.join(';')}|${smalls.join(';')}`;
  }

  static getOccupied(pieces) {
    const grid = Array.from({ length: 5 }, () => Array(4).fill(null));
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      for (let dy = 0; dy < p.h; dy++) {
        for (let dx = 0; dx < p.w; dx++) {
          grid[p.y + dy][p.x + dx] = i;
        }
      }
    }
    return grid;
  }

  /**
   * Solve given pieces configuration to reach King at (1, 0)
   * Returns: { moves: number, path: Array<{ pieceId, from, to, steps }> } or null
   */
  static solve(pieces) {
    // Normalise pieces
    const startPieces = pieces.map((p, idx) => ({
      id: idx,
      name: p.name,
      w: p.w,
      h: p.h,
      x: p.x,
      y: p.y
    }));

    // If King is already at goal
    const kingPiece = startPieces.find(p => p.w === 2 && p.h === 2);
    if (!kingPiece) return null;
    if (kingPiece.x === 1 && kingPiece.y === 0) {
      return { moves: 0, path: [] };
    }

    const queue = [{ pieces: startPieces, moves: 0, path: [] }];
    const visited = new Set([OshoSolver.encodeState(startPieces)]);

    const dirs = [
      { dx: 0, dy: -1, name: 'up' },
      { dx: 0, dy: 1, name: 'down' },
      { dx: -1, dy: 0, name: 'left' },
      { dx: 1, dy: 0, name: 'right' },
    ];

    while (queue.length > 0) {
      const { pieces: curPieces, moves, path } = queue.shift();

      // Goal check: King at (1, 0)
      const curKing = curPieces.find(p => p.w === 2 && p.h === 2);
      if (curKing.x === 1 && curKing.y === 0) {
        return { moves, path };
      }

      const grid = OshoSolver.getOccupied(curPieces);

      // Explore moving each piece
      for (let i = 0; i < curPieces.length; i++) {
        const p = curPieces[i];

        // Find all reachable positions in 1 piece turn
        const reachable = new Map();
        const pQueue = [{ x: p.x, y: p.y, steps: [] }];
        const pVisited = new Set([`${p.x},${p.y}`]);

        while (pQueue.length > 0) {
          const curr = pQueue.shift();
          for (const dir of dirs) {
            const nx = curr.x + dir.dx;
            const ny = curr.y + dir.dy;
            const key = `${nx},${ny}`;
            if (nx < 0 || nx + p.w > 4 || ny < 0 || ny + p.h > 5) continue;
            if (pVisited.has(key)) continue;

            let canMove = true;
            for (let dy = 0; dy < p.h; dy++) {
              for (let dx = 0; dx < p.w; dx++) {
                const cell = grid[ny + dy][nx + dx];
                if (cell !== null && cell !== i) {
                  canMove = false;
                  break;
                }
              }
              if (!canMove) break;
            }

            if (canMove) {
              pVisited.add(key);
              const stepRoute = [...curr.steps, dir.name];
              reachable.set(key, { nx, ny, steps: stepRoute });
              pQueue.push({ x: nx, y: ny, steps: stepRoute });
            }
          }
        }

        for (const [, { nx, ny, steps }] of reachable.entries()) {
          const nextPieces = curPieces.map((piece, idx) => {
            if (idx === i) return { ...piece, x: nx, y: ny };
            return piece;
          });
          const stateKey = OshoSolver.encodeState(nextPieces);
          if (!visited.has(stateKey)) {
            visited.add(stateKey);
            queue.push({
              pieces: nextPieces,
              moves: moves + 1,
              path: [
                ...path,
                {
                  pieceId: p.id,
                  name: p.name,
                  from: { x: p.x, y: p.y },
                  to: { nx, ny },
                  steps
                }
              ]
            });
          }
        }
      }
    }

    return null; // Unsolvable
  }

  /**
   * Get all valid single-step moves from current state for a specific piece
   */
  static getValidMovesForPiece(pieces, pieceIndex) {
    const p = pieces[pieceIndex];
    if (!p) return [];

    const grid = OshoSolver.getOccupied(pieces);
    const validMoves = [];

    const dirs = [
      { dx: 0, dy: -1, name: 'up' },
      { dx: 0, dy: 1, name: 'down' },
      { dx: -1, dy: 0, name: 'left' },
      { dx: 1, dy: 0, name: 'right' },
    ];

    for (const dir of dirs) {
      const nx = p.x + dir.dx;
      const ny = p.y + dir.dy;

      if (nx < 0 || nx + p.w > 4 || ny < 0 || ny + p.h > 5) continue;

      let canMove = true;
      for (let dy = 0; dy < p.h; dy++) {
        for (let dx = 0; dx < p.w; dx++) {
          const cell = grid[ny + dy][nx + dx];
          if (cell !== null && cell !== pieceIndex) {
            canMove = false;
            break;
          }
        }
        if (!canMove) break;
      }

      if (canMove) {
        validMoves.push({
          dir: dir.name,
          dx: dir.dx,
          dy: dir.dy,
          toX: nx,
          toY: ny
        });
      }
    }

    return validMoves;
  }
}
