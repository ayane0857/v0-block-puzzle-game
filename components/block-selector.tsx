"use client"

import type React from "react"

import { type Block, BLOCK_COLORS } from "@/lib/game-constants"

interface BlockSelectorProps {
  blocks: Block[]
  draggedBlockId: number | null
  onDragStart: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, block: Block) => void
}

export function BlockSelector({ blocks, draggedBlockId, onDragStart }: BlockSelectorProps) {
  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground font-medium mb-3">Available Blocks</p>
      <div className="flex gap-4 justify-center flex-wrap">
        {blocks.map((block) => (
          <div
            key={block.id}
            onMouseDown={(e) => onDragStart(e, block)}
            onTouchStart={(e) => onDragStart(e, block)}
            className={`p-3 bg-card rounded-2xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all transform border border-border ${
              draggedBlockId === block.id ? "opacity-40 scale-95 cursor-grabbing" : "hover:scale-105 hover:shadow-lg"
            }`}
          >
            <div
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `repeat(${Math.max(...block.shape.map((row) => row.length))}, 32px)`,
              }}
            >
              {block.shape.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      cell === 1 ? BLOCK_COLORS[block.colorIndex].bg + " shadow-sm" : "bg-transparent"
                    }`}
                  />
                )),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
