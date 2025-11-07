"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import * as Tone from "tone"
import { GRID_SIZE, BLOCK_SHAPES, BLOCK_COLORS, type Block, type PreviewPosition } from "@/lib/game-constants"
import { GameHeader } from "./game-header"
import { GameGrid } from "./game-grid"
import { BlockSelector } from "./block-selector"
import { GameOverModal } from "./game-over-modal"
import { DragPreview } from "./drag-preview"

const BlockPuzzleGame = () => {
  const [grid, setGrid] = useState<(number | null)[][]>(
    Array(GRID_SIZE)
      .fill()
      .map(() => Array(GRID_SIZE).fill(null)),
  )
  const [blocks, setBlocks] = useState<Block[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [previewPosition, setPreviewPosition] = useState<PreviewPosition | null>(null)
  const [canPlace, setCanPlace] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const synthRef = useRef<Tone.Synth | null>(null)

  useEffect(() => {
    generateNewBlocks()
    const initAudio = async () => {
      try {
        await Tone.start()
        synthRef.current = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        }).toDestination()
        setAudioReady(true)
      } catch (err) {
        console.log("Audio init failed:", err)
      }
    }
    initAudio()
  }, [])

  const playSound = useCallback(
    (note: string, duration = "16n") => {
      if (audioReady && synthRef.current) {
        synthRef.current.triggerAttackRelease(note, duration)
      }
    },
    [audioReady],
  )

  const generateNewBlocks = useCallback(() => {
    const newBlocks: Block[] = []
    for (let i = 0; i < 3; i++) {
      const shape = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)]
      const colorIndex = Math.floor(Math.random() * BLOCK_COLORS.length)
      newBlocks.push({ id: Date.now() + i + Math.random(), shape, colorIndex })
    }
    setBlocks(newBlocks)
  }, [])

  const canPlaceBlock = useCallback(
    (shape: number[][], row: number, col: number, gridToCheck = grid) => {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] === 1) {
            const newRow = row + r
            const newCol = col + c
            if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
              return false
            }
            if (gridToCheck[newRow][newCol] !== null) {
              return false
            }
          }
        }
      }
      return true
    },
    [grid],
  )

  const placeBlock = useCallback(
    (block: Block, row: number, col: number) => {
      if (!canPlaceBlock(block.shape, row, col)) return false

      playSound("C5", "8n")

      const newGrid = grid.map((r) => [...r])
      for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
          if (block.shape[r][c] === 1) {
            newGrid[row + r][col + c] = block.colorIndex
          }
        }
      }

      setGrid(newGrid)
      const newBlocks = blocks.filter((b) => b.id !== block.id)
      setBlocks(newBlocks)

      setTimeout(() => {
        checkAndClearLines(newGrid, newBlocks)
      }, 100)

      return true
    },
    [grid, blocks, canPlaceBlock, playSound],
  )

  const clearLines = useCallback((currentGrid: (number | null)[][]) => {
    const newGrid = currentGrid.map((r) => [...r])

    for (let r = 0; r < GRID_SIZE; r++) {
      if (newGrid[r].every((cell) => cell !== null)) {
        newGrid[r] = Array(GRID_SIZE).fill(null)
      }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid.every((row) => row[c] !== null)) {
        for (let r = 0; r < GRID_SIZE; r++) {
          newGrid[r][c] = null
        }
      }
    }

    return newGrid
  }, [])

  const checkAndClearLines = useCallback(
    (currentGrid: (number | null)[][], currentBlocks: Block[]) => {
      let clearedLines = 0

      for (let r = 0; r < GRID_SIZE; r++) {
        if (currentGrid[r].every((cell) => cell !== null)) clearedLines++
      }

      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentGrid.every((row) => row[c] !== null)) clearedLines++
      }

      if (clearedLines > 0) {
        playSound("E5", "4n")
        const newGrid = clearLines(currentGrid)
        setGrid(newGrid)
        const points = clearedLines * 10 * (clearedLines > 1 ? clearedLines : 1)
        setScore((s) => s + points)

        if (currentBlocks.length === 0) {
          setTimeout(() => generateNewBlocks(), 300)
        }
      } else {
        if (currentBlocks.length === 0) {
          setTimeout(() => generateNewBlocks(), 300)
        } else {
          checkGameOver(currentBlocks, currentGrid)
        }
      }
    },
    [playSound, clearLines, generateNewBlocks],
  )

  const checkGameOver = useCallback(
    (currentBlocks: Block[], currentGrid: (number | null)[][]) => {
      for (const block of currentBlocks) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (canPlaceBlock(block.shape, r, c, currentGrid)) {
              return
            }
          }
        }
      }
      setTimeout(() => setGameOver(true), 500)
    },
    [canPlaceBlock],
  )

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, block: Block) => {
    e.preventDefault()
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    setDraggedBlock(block)
    setDragPosition({ x: clientX, y: clientY })
    setIsDragging(true)
    playSound("A4", "32n")
  }

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !draggedBlock) return

      const clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX
      const clientY = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY

      setDragPosition({ x: clientX, y: clientY })

      const gridElement = document.getElementById("game-grid")
      if (!gridElement) return

      const gridRect = gridElement.getBoundingClientRect()
      const cellSize = gridRect.width / GRID_SIZE

      const col = Math.floor((clientX - gridRect.left) / cellSize)
      const row = Math.floor((clientY - gridRect.top) / cellSize)

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        const canBePlaced = canPlaceBlock(draggedBlock.shape, row, col)
        setCanPlace(canBePlaced)
        setPreviewPosition({ row, col })
      } else {
        setPreviewPosition(null)
        setCanPlace(false)
      }
    },
    [isDragging, draggedBlock, canPlaceBlock],
  )

  const handleDragEnd = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !draggedBlock) return

      const clientX = e instanceof TouchEvent ? e.changedTouches[0].clientX : e.clientX
      const clientY = e instanceof TouchEvent ? e.changedTouches[0].clientY : e.clientY

      const gridElement = document.getElementById("game-grid")
      if (gridElement) {
        const gridRect = gridElement.getBoundingClientRect()
        const cellSize = gridRect.width / GRID_SIZE

        const col = Math.floor((clientX - gridRect.left) / cellSize)
        const row = Math.floor((clientY - gridRect.top) / cellSize)

        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          if (!placeBlock(draggedBlock, row, col)) {
            playSound("C3", "16n")
          }
        }
      }

      setDraggedBlock(null)
      setIsDragging(false)
      setPreviewPosition(null)
      setCanPlace(false)
    },
    [isDragging, draggedBlock, placeBlock, playSound],
  )

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent | TouchEvent) => handleDragMove(e)
      const handleEnd = (e: MouseEvent | TouchEvent) => handleDragEnd(e)

      window.addEventListener("mousemove", handleMove)
      window.addEventListener("mouseup", handleEnd)
      window.addEventListener("touchmove", handleMove, { passive: false })
      window.addEventListener("touchend", handleEnd)

      return () => {
        window.removeEventListener("mousemove", handleMove)
        window.removeEventListener("mouseup", handleEnd)
        window.removeEventListener("touchmove", handleMove)
        window.removeEventListener("touchend", handleEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const resetGame = () => {
    setGrid(
      Array(GRID_SIZE)
        .fill()
        .map(() => Array(GRID_SIZE).fill(null)),
    )
    setScore(0)
    setGameOver(false)
    setDraggedBlock(null)
    setIsDragging(false)
    setPreviewPosition(null)
    setCanPlace(false)
    generateNewBlocks()
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="flex flex-col items-center gap-8 max-w-2xl w-full">
        {/* Header */}
        <GameHeader score={score} />
        {/* Game Grid */}
        <GameGrid grid={grid} previewPosition={previewPosition} draggedBlock={draggedBlock} canPlace={canPlace} />
        {/* Available Blocks */}
        <BlockSelector blocks={blocks} draggedBlockId={draggedBlock?.id ?? null} onDragStart={handleDragStart} />
        {/* Drag Preview */}
        <DragPreview draggedBlock={draggedBlock} dragPosition={dragPosition} />
        {/* Game Over Modal */}
        {gameOver && <GameOverModal score={score} onPlayAgain={resetGame} />}
      </div>
    </div>
  )
}

export default BlockPuzzleGame
