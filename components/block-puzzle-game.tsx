import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import * as Tone from "tone"
import _ from "lodash"
import { GRID_SIZE, BLOCK_COLORS, type Block, type PreviewPosition } from "@/lib/game-constants"
import { GameHeader } from "@/components/game-header"
import { GameGrid } from "@/components/game-grid"
import { BlockSelector } from "@/components/block-selector"
import { GameOverModal } from "@/components/game-over-modal"
import { DragPreview } from "@/components/drag-preview"

const BlockPuzzleGame = () => {
  const [grid, setGrid] = useState<(number | null)[][]>(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null))
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

  // Memoize the sound player
  const playSound = useCallback(
    _.memoize(
      (note: string, duration = "16n") => {
        if (audioReady && synthRef.current) {
          synthRef.current.triggerAttackRelease(note, duration)
        }
      },
      (note, duration) => `${note}-${duration}`
    ),
    [audioReady]
  )

  // Optimized block generation with lodash
  const generateNewBlocks = useCallback(() => {
    const shapes = [
      [[1]],
      [[1, 1]],
      [[1], [1]],
      [[1, 1, 1]],
      [[1], [1], [1]],
      [[1, 1], [1, 1]],
      [[1, 1, 1], [1, 0, 0]],
      [[1, 0], [1, 0], [1, 1]],
      [[1, 1, 1], [0, 0, 1]],
      [[0, 1], [0, 1], [1, 1]],
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1, 1], [1, 1, 0]],
      [[1, 1, 1, 1]],
      [[1], [1], [1], [1]],
      [[1, 1, 1], [0, 1, 0]],
    ]

    const newBlocks = _.times(3, (i) => ({
      id: Date.now() + i + Math.random(),
      shape: _.sample(shapes)!,
      colorIndex: _.random(0, BLOCK_COLORS.length - 1),
    }))

    setBlocks(newBlocks)
  }, [])

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
  }, [generateNewBlocks])

  // Optimized canPlaceBlock with lodash
  const canPlaceBlock = useCallback(
    (shape: number[][], row: number, col: number, gridToCheck = grid) => {
      return _.every(shape, (shapeRow, r) =>
        _.every(shapeRow, (cell, c) => {
          if (cell !== 1) return true
          const newRow = row + r
          const newCol = col + c
          return (
            newRow >= 0 &&
            newRow < GRID_SIZE &&
            newCol >= 0 &&
            newCol < GRID_SIZE &&
            gridToCheck[newRow][newCol] === null
          )
        })
      )
    },
    [grid]
  )

  // Optimized placeBlock using lodash cloneDeep
  const placeBlock = useCallback(
    (block: Block, row: number, col: number) => {
      if (!canPlaceBlock(block.shape, row, col)) return false

      playSound("C5", "8n")

      const newGrid = _.cloneDeep(grid)
      _.forEach(block.shape, (shapeRow, r) => {
        _.forEach(shapeRow, (cell, c) => {
          if (cell === 1) {
            newGrid[row + r][col + c] = block.colorIndex
          }
        })
      })

      setGrid(newGrid)
      const newBlocks = _.reject(blocks, { id: block.id })
      setBlocks(newBlocks)

      setTimeout(() => {
        checkAndClearLines(newGrid, newBlocks)
      }, 100)

      return true
    },
    [grid, blocks, canPlaceBlock, playSound]
  )

  // Optimized line clearing with lodash
  const clearLines = useCallback((currentGrid: (number | null)[][]) => {
    const newGrid = _.cloneDeep(currentGrid)

    // Clear complete rows
    _.forEach(newGrid, (row, r) => {
      if (_.every(row, (cell) => cell !== null)) {
        newGrid[r] = Array(GRID_SIZE).fill(null)
      }
    })

    // Clear complete columns
    _.times(GRID_SIZE, (c) => {
      if (_.every(newGrid, (row) => row[c] !== null)) {
        _.forEach(newGrid, (row) => {
          row[c] = null
        })
      }
    })

    return newGrid
  }, [])

  const checkAndClearLines = useCallback(
    (currentGrid: (number | null)[][], currentBlocks: Block[]) => {
      // Count cleared lines efficiently
      const rowCount = _.sumBy(currentGrid, (row) => (_.every(row, (cell) => cell !== null) ? 1 : 0))
      const colCount = _.sumBy(_.range(GRID_SIZE), (c) =>
        _.every(currentGrid, (row) => row[c] !== null) ? 1 : 0
      )
      const clearedLines = rowCount + colCount

      if (clearedLines > 0) {
        playSound("E5", "4n")
        const newGrid = clearLines(currentGrid)
        setGrid(newGrid)
        const points = clearedLines * 10 * Math.max(clearedLines, 1)
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
    [playSound, clearLines, generateNewBlocks]
  )

  // Optimized game over check with lodash
  const checkGameOver = useCallback(
    (currentBlocks: Block[], currentGrid: (number | null)[][]) => {
      const canPlaceAny = _.some(currentBlocks, (block) =>
        _.some(_.range(GRID_SIZE), (r) =>
          _.some(_.range(GRID_SIZE), (c) => canPlaceBlock(block.shape, r, c, currentGrid))
        )
      )

      if (!canPlaceAny) {
        setTimeout(() => setGameOver(true), 500)
      }
    },
    [canPlaceBlock]
  )

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, block: Block) => {
    e.preventDefault()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    setDraggedBlock(block)
    setDragPosition({ x: clientX, y: clientY })
    setIsDragging(true)
    playSound("A4", "32n")
  }

  // Throttle drag move for better performance
  const handleDragMove = useMemo(
    () =>
      _.throttle((e: MouseEvent | TouchEvent) => {
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
      }, 16),
    [isDragging, draggedBlock, canPlaceBlock]
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
    [isDragging, draggedBlock, placeBlock, playSound]
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
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null))
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
        <GameHeader score={score} />
        <GameGrid grid={grid} previewPosition={previewPosition} draggedBlock={draggedBlock} canPlace={canPlace} />
        <BlockSelector blocks={blocks} draggedBlockId={draggedBlock?.id ?? null} onDragStart={handleDragStart} />
        <DragPreview draggedBlock={draggedBlock} dragPosition={dragPosition} />
        {gameOver && <GameOverModal score={score} onPlayAgain={resetGame} />}
      </div>
    </div>
  )
}

export default BlockPuzzleGame
