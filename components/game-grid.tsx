import { GRID_SIZE, BLOCK_COLORS, type Block, type PreviewPosition } from "@/lib/game-constants"

interface GameGridProps {
  grid: (number | null)[][]
  previewPosition: PreviewPosition | null
  draggedBlock: Block | null
  canPlace: boolean
}

export function GameGrid({ grid, previewPosition, draggedBlock, canPlace }: GameGridProps) {
  const renderGridCell = (r: number, c: number) => {
    const cell = grid[r][c]
    let isPreview = false
    let previewColorIndex = 0

    if (previewPosition && draggedBlock) {
      const { row, col } = previewPosition
      const shape = draggedBlock.shape

      for (let sr = 0; sr < shape.length; sr++) {
        for (let sc = 0; sc < shape[sr].length; sc++) {
          if (shape[sr][sc] === 1 && row + sr === r && col + sc === c) {
            isPreview = true
            previewColorIndex = draggedBlock.colorIndex
            break
          }
        }
      }
    }

    const colorClass = cell !== null ? BLOCK_COLORS[cell].bg : ""
    const previewColorClass = isPreview ? BLOCK_COLORS[previewColorIndex].light : ""

    if (isPreview) {
      return (
        <div
          key={`${r}-${c}`}
          className={`rounded-lg transition-all duration-150 ${
            canPlace ? previewColorClass + " opacity-60 ring-2 ring-accent" : "bg-red-500 opacity-40"
          }`}
        />
      )
    }

    return (
      <div
        key={`${r}-${c}`}
        className={`rounded-lg transition-all duration-200 ${
          cell ? colorClass + " shadow-md" : "bg-muted hover:bg-muted/60 border border-border"
        }`}
      />
    )
  }

  return (
    <div className="w-full flex justify-center">
      <div
        id="game-grid"
        className="grid gap-1.5 p-4 rounded-3xl bg-card shadow-lg border border-border"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          width: "min(400px, 90vw)",
          height: "min(400px, 90vw)",
        }}
      >
        {grid.map((row, r) => row.map((cell, c) => renderGridCell(r, c)))}
      </div>
    </div>
  )
}
