// lib/use-game-state.ts
import { useCallback, useReducer } from "react"
import _ from "lodash"
import { GRID_SIZE, BLOCK_SHAPES, BLOCK_COLORS, type Block } from "@/lib/game-constants"

type GameState = {
  grid: (number | null)[][]
  blocks: Block[]
  score: number
  gameOver: boolean
}

type GameAction =
  | { type: "PLACE_BLOCK"; block: Block; row: number; col: number }
  | { type: "CLEAR_LINES"; clearedCount: number }
  | { type: "GENERATE_BLOCKS" }
  | { type: "RESET_GAME" }
  | { type: "SET_GAME_OVER" }

const initialState: GameState = {
  grid: Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null)),
  blocks: [],
  score: 0,
  gameOver: false,
}

// Use lodash for efficient operations
const generateNewBlocks = (): Block[] => {
  return _.times(3, (i) => ({
    id: Date.now() + i + Math.random(),
    shape: _.sample(BLOCK_SHAPES)!,
    colorIndex: _.random(0, BLOCK_COLORS.length - 1),
  }))
}

const canPlaceBlock = (
  grid: (number | null)[][],
  shape: number[][],
  row: number,
  col: number
): boolean => {
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
        grid[newRow][newCol]
