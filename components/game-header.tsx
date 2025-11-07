interface GameHeaderProps {
  score: number
}

export function GameHeader({ score }: GameHeaderProps) {
  return (
    <div className="w-full flex justify-between items-center gap-4">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance">Block Puzzle</h1>
        <p className="text-sm text-muted-foreground mt-1">Drag and drop blocks to complete lines</p>
      </div>
      <div className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl text-center min-w-fit">
        <p className="text-xs text-primary-foreground/80 font-medium">Score</p>
        <p className="text-3xl font-bold text-balance">{score}</p>
      </div>
    </div>
  )
}
