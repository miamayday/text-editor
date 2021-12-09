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

export type Caret = {
  offset: number
  x: number
  y: number
}

export type Mouse = {
  x: number
  y: number
}

export enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
  Write,
  Delete,
  NewLine
}

export enum Command {
  Write,
  Delete,
  NewLine
}

export type EditorState = {
  style: Style
  caret?: Caret
  mouse?: Mouse // a pink square that acts a snapping guide
  direction?: Direction // caret guide
  command?: Command // writer guide
  key?: string // input key
  pindex?: number
  sindex?: number
  paragraphs: Array<Array<TextNode>>
}

/* Caret */

export type Position = {
  caret: Caret
  pindex: number
  sindex: number
}

/* Writer */

export interface WriterProps {
  caret: Caret
  pindex: number
  sindex: number
  paragraphs: Array<Array<TextNode>>
}
