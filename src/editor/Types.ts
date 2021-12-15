/* Document */

export type Style = {
  bold: boolean
  italic: boolean
}

export type TextNode = {
  style: Style
  text: string
}

/* Editor */

export type EditorProps = {}

export enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
  Write,
  Delete,
  NewLine
}

export enum Action {
  Write,
  Delete,
  NewLine
}

export type EditorState = {
  style: Style
  caret: boolean
  pos?: Coordinates // caret coordinates (relative to document)
  status?: Status // caret status (offset, pindex, sindex)
  direction?: Direction // caret instruction
  action?: Action // writer instruction
  key?: string // input key
  paragraphs: Array<Array<TextNode>>
}

/* New types */

export type Status = {
  offset: number
  pindex: number
  sindex: number
}

export type Coordinates = {
  x: number
  y: number
}
