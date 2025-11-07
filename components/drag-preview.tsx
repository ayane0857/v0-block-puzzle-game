import { type Block, BLOCK_COLORS } from "@/lib/game-constants"

interface DragPreviewProps {
  draggedBlock: Block | null
  dragPosition: { x: number; y: number }
}

export function DragPreview({ draggedBlock, dragPosition }: DragPreviewProps) {
  if (!draggedBlock) return null

  return (
    <div
      className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: dragPosition.x,
        top: dragPosition.y,
      }}
    >
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${Math.max(...draggedBlock.shape.map((row) => row.length))}, 36px)`,
        }}
      >
        {draggedBlock.shape.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-9 h-9 rounded-lg ${
                cell === 1 ? BLOCK_COLORS[draggedBlock.colorIndex].bg + " shadow-xl" : ""
              }`}
            />
          )),
        )}
      </div>
    </div>
  )
}
