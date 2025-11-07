"use client"

interface GameOverModalProps {
  score: number
  onPlayAgain: () => void
}

export function GameOverModal({ score, onPlayAgain }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl p-8 text-center shadow-2xl border border-border max-w-sm w-full transform animate-in fade-in zoom-in-95">
        <h2 className="text-4xl font-bold text-foreground mb-4">Game Over</h2>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Final Score</p>
          <p className="text-6xl font-bold text-accent">{score}</p>
        </div>
        <button
          onClick={onPlayAgain}
          className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg active:scale-95 transition-all"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
