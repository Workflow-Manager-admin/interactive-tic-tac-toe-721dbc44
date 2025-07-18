import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Color palette from requirements:
 * primary:   #3498db
 * secondary: #2ecc71
 * accent:    #e74c3c
 * 
 * Modern minimimalistic style, light theme by default. 
 */

// Returns a 3x3 grid for initializing the board state
function createEmptyBoard() {
  return Array(3)
    .fill(null)
    .map(() => Array(3).fill(null));
}

// Checks if a player has won and returns info
function calculateWinner(board) {
  const lines = [
    // rows
    [ [0,0], [0,1], [0,2] ],
    [ [1,0], [1,1], [1,2] ],
    [ [2,0], [2,1], [2,2] ],
    // columns
    [ [0,0], [1,0], [2,0] ],
    [ [0,1], [1,1], [2,1] ],
    [ [0,2], [1,2], [2,2] ],
    // diagonals
    [ [0,0], [1,1], [2,2] ],
    [ [0,2], [1,1], [2,0] ]
  ];
  for (let line of lines) {
    const [[a,b],[c,d],[e,f]] = line;
    if (
      board[a][b] &&
      board[a][b] === board[c][d] &&
      board[a][b] === board[e][f]
    ) {
      return {winner: board[a][b], line};
    }
  }
  // Check for a draw
  if (board.every(row => row.every(cell => cell))) {
    return {winner: null, line: null, draw: true};
  }
  return null;
}

// Picks the first available cell (easy AI)
function findBestMove(board) {
  // Try to win, block, or pick first empty
  // Prefer center, then corners, then sides
  // For simplicity, just random empty for now. Can be improved.
  for (let i=0;i<3;i++) {
    for (let j=0;j<3;j++) {
      if (!board[i][j]) {
        return [i,j];
      }
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function App() {
  // ENVIRONMENT VARIABLE SUPPORT
  // Example usage (ignore if .env does not have relevant vars):
  // const apiUrl = process.env.REACT_APP_BACKEND_URL;
  // For this task, the game runs entirely frontend.

  // Game state
  const [board, setBoard] = useState(createEmptyBoard());
  const [isXNext, setIsXNext] = useState(true);
  const [history, setHistory] = useState([
    { board: createEmptyBoard(), move: null, player: "X" }
  ]);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("pvp"); // pvp or pvc
  const [status, setStatus] = useState("");
  const [winningLine, setWinningLine] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  // Responsive check
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 700);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Winner detection
  useEffect(() => {
    const winnerInfo = calculateWinner(board);
    if (winnerInfo) {
      if (winnerInfo.winner) {
        setStatus(`Winner: ${winnerInfo.winner}`);
        setWinningLine(winnerInfo.line);
      } else if (winnerInfo.draw) {
        setStatus("Draw!");
        setWinningLine(null);
      }
    } else {
      setStatus(`Next: ${isXNext ? "X" : "O"}`);
      setWinningLine(null);
    }
  }, [board, isXNext]);

  // If it's PvC mode, O is computer, let computer play after human X move
  useEffect(() => {
    if (
      mode === "pvc" &&
      !calculateWinner(board) &&
      !isXNext // O's turn, computer's turn
    ) {
      const timer = setTimeout(() => {
        // Very basic AI: pick first available
        let [i, j] = findBestMove(board);
        handleCellClick(i, j, true);
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [isXNext, board, mode]);

  // PUBLIC_INTERFACE
  function handleCellClick(row, col, computerMove = false) {
    // Block if game over, or if cell occupied, or if computer is about to play
    if (
      calculateWinner(board) ||
      board[row][col] ||
      (mode === "pvc" && !isXNext && !computerMove)
    )
      return;

    const player = isXNext ? "X" : "O";
    const nextBoard = board.map((r, i) =>
      r.map((cell, j) => (i === row && j === col ? player : cell))
    );

    const nextHistory = history
      .slice(0, step + 1)
      .concat([{ board: nextBoard, move: [row, col], player }]);
    setBoard(nextBoard);
    setHistory(nextHistory);
    setStep(nextHistory.length - 1);
    setIsXNext(!isXNext);
    // Status and winningLine will be updated by useEffect
  }

  // PUBLIC_INTERFACE
  function jumpTo(stepIdx) {
    setStep(stepIdx);
    setBoard(history[stepIdx].board);
    setIsXNext(stepIdx % 2 === 0);
    setWinningLine(null);
  }

  // PUBLIC_INTERFACE
  function handleReset() {
    setBoard(createEmptyBoard());
    setIsXNext(true);
    setHistory([{ board: createEmptyBoard(), move: null, player: "X" }]);
    setStep(0);
    setStatus("Next: X");
    setWinningLine(null);
  }

  // PUBLIC_INTERFACE
  function handleModeChange(e) {
    setMode(e.target.value);
    handleReset();
  }

  // Styling for the winning cell
  function isWinningCell(row, col) {
    return winningLine && winningLine.some(([r, c]) => r === row && c === col);
  }

  // Colors
  const COLORS = {
    primary: "#3498db",
    secondary: "#2ecc71",
    accent: "#e74c3c",
    bg: "#fff",
    border: "#ececec",
    text: "#282c34"
  };

  // Minimal CSS-in-JS (overrides)
  const minBoardStyle = (isMobile
    ? {
        width: "90vw",
        maxWidth: "350px"
      }
    : {
        width: "350px"
      });

  // Move history as list
  function renderMoveHistory() {
    return (
      <ol className="move-history-list">
        {history.map((item, idx) => {
          let desc =
            idx === 0
              ? "Game start"
              : `#${idx}: Player ${item.player} at (${item.move[0] + 1},${
                  item.move[1] + 1
                })`;
          return (
            <li key={idx}>
              <button
                className={`move-history-btn${
                  idx === step ? " selected" : ""
                }`}
                onClick={() => jumpTo(idx)}
                aria-label={`Go to move ${idx}`}
              >
                {desc}
              </button>
            </li>
          );
        })}
      </ol>
    );
  }

  // Board rendering
  function renderBoardGrid() {
    return (
      <div
        className="ttt-board"
        style={{
          ...minBoardStyle,
          aspectRatio: "1",
          background: COLORS.bg,
          borderRadius: "18px",
          boxShadow: "0 4px 16px rgba(52,152,219,0.06)",
          display: "grid",
          gridTemplateRows: "repeat(3, 1fr)",
          gridTemplateColumns: "repeat(3, 1fr)"
        }}
      >
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            return (
              <button
                className="ttt-cell"
                key={`${rIdx}-${cIdx}`}
                onClick={() => handleCellClick(rIdx, cIdx)}
                style={{
                  border:
                    isWinningCell(rIdx, cIdx)
                      ? `2px solid ${COLORS.accent}`
                      : `1px solid ${COLORS.primary}33`,
                  color:
                    cell === "X"
                      ? COLORS.primary
                      : cell === "O"
                      ? COLORS.secondary
                      : COLORS.text,
                  background: isWinningCell(rIdx, cIdx)
                    ? "#e74c3c11"
                    : "transparent",
                  transition: "background 0.2s, box-shadow 0.2s, color 0.13s",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: isMobile ? "2.2rem" : "2.8rem",
                  userSelect: "none"
                }}
                disabled={!!cell || !!calculateWinner(board)}
                aria-label={`Cell ${rIdx + 1},${cIdx + 1}${
                  cell ? `: ${cell}` : ""
                }`}
              >
                {cell}
              </button>
            );
          })
        )}
      </div>
    );
  }

  // Header title
  function renderHeader() {
    return (
      <header className="ttt-header" style={{
        marginBottom: isMobile ? "22px" : "32px",
        marginTop: isMobile ? "10vw" : "42px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <h1
          className="ttt-title"
          style={{
            fontFamily: "system-ui, sans-serif",
            fontWeight: 800,
            color: COLORS.primary,
            fontSize: isMobile ? "2.1rem" : "2.7rem",
            letterSpacing: "-2px",
            marginBottom: "10px"
          }}
        >
          Tic Tac Toe
        </h1>
        <span
          style={{
            color: COLORS.secondary,
            fontWeight: 500,
            fontSize: isMobile ? "1rem" : "1.15rem",
            marginBottom: "0px"
          }}
        >
          {mode === "pvp"
            ? "Two Player Mode"
            : "Player vs Computer Mode"}
        </span>
      </header>
    );
  }

  function renderStatusBar() {
    return (
      <div
        className="ttt-status"
        style={{
          textAlign: "center",
          margin: isMobile ? "14px 0 2vw 0" : "18px 0 20px 0",
          minHeight: "1.5rem",
          fontWeight: 600,
          color:
            status === "Draw!"
              ? COLORS.accent
              : status.startsWith("Winner")
              ? COLORS.secondary
              : COLORS.primary,
          fontSize: isMobile ? "1.22rem" : "1.39rem",
          letterSpacing: "0.3px"
        }}
        aria-live="assertive"
      >
        {status}
      </div>
    );
  }

  function renderControls() {
    return (
      <div
        className="ttt-controls"
        style={{
          marginTop: isMobile ? "7vw" : "34px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? "12px" : "26px"
        }}
      >
        <label style={{ fontWeight: 500, color: COLORS.text }}>
          <span style={{paddingRight: "7px"}}>Mode:</span>
          <select
            className="ttt-mode-select"
            onChange={handleModeChange}
            value={mode}
            style={{
              fontWeight: 700,
              fontSize: isMobile ? "1rem" : "1.13rem",
              borderRadius: "6px",
              background: "#fff",
              border: `1.5px solid ${COLORS.primary}66`,
              color: COLORS.primary,
              padding: "6px 14px",
              outline: "none"
            }}
            aria-label="Game mode select"
          >
            <option value="pvp">Two Player</option>
            <option value="pvc">Player vs Computer</option>
          </select>
        </label>
        <button
          type="button"
          className="ttt-reset-btn"
          onClick={handleReset}
          style={{
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            fontWeight: 700,
            fontSize: isMobile ? "1.07rem" : "1.16rem",
            borderRadius: "7px",
            padding: isMobile ? "10px 20px" : "12px 32px",
            minWidth: isMobile ? "90px" : "110px",
            cursor: "pointer",
            boxShadow: `0 2px 8px ${COLORS.primary}19`,
            transition: "all 0.18s"
          }}
        >
          Reset
        </button>
      </div>
    );
  }

  // Move history panel
  function renderHistoryPanel() {
    return (
      <aside
        className="ttt-move-history"
        style={{
          width: isMobile ? "94vw" : "210px",
          maxWidth: isMobile ? "94vw" : "210px",
          minHeight: isMobile ? "60px" : "134px",
          background: "#fff",
          border: `1px solid ${COLORS.primary}19`,
          boxShadow: "0 1px 8px #3498db07",
          borderRadius: "18px",
          margin: isMobile ? "32px auto 0 auto" : "0 0 0 44px",
          padding: isMobile ? "16px 8px" : "16px 10px",
          textAlign: "left",
          overflowX: "auto",
          zIndex: 1
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: COLORS.primary,
            fontSize: isMobile ? "1.07rem" : "1.13rem",
            marginBottom: "9px"
          }}
        >
          Move History
        </div>
        {renderMoveHistory()}
      </aside>
    );
  }

  // Centered layout and mobile/desktop arrangement
  return (
    <div
      className="ttt-app-wrapper"
      style={{
        fontFamily:
          "system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Helvetica Neue', Arial, sans-serif",
        background: "#f8fafc",
        minHeight: "100vh"
      }}
    >
      {renderHeader()}
      <main
        className="ttt-main"
        style={{
          maxWidth: isMobile ? "100vw" : "900px",
          margin: isMobile ? "0 auto" : "24px auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "flex-start",
          justifyContent: "center"
        }}
      >
        <section
          className="ttt-board-panel"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          {renderStatusBar()}
          {renderBoardGrid()}
          {renderControls()}
        </section>
        {!isMobile && renderHistoryPanel()}
      </main>
      {isMobile && (
        <footer
          style={{
            marginTop: "20vw",
            marginBottom: "5vw",
            width: "100%"
          }}
        >
          {renderHistoryPanel()}
        </footer>
      )}
    </div>
  );
}

export default App;
