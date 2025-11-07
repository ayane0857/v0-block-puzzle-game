export const GRID_SIZE = 9

export const BLOCK_SHAPES = [
  [[1]],
  [[1, 1]],
  [[1], [1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [1, 1, 1],
    [1, 0, 0],
  ],
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [1, 1, 1],
    [0, 0, 1],
  ],
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
]

export const BLOCK_COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-400", name: "Blue" },
  { bg: "bg-purple-500", light: "bg-purple-400", name: "Purple" },
  { bg: "bg-pink-500", light: "bg-pink-400", name: "Pink" },
  { bg: "bg-cyan-500", light: "bg-cyan-400", name: "Cyan" },
  { bg: "bg-emerald-500", light: "bg-emerald-400", name: "Emerald" },
]

export interface Block {
  id: number
  shape: number[][]
  colorIndex: number
}

export interface PreviewPosition {
  row: number
  col: number
}
