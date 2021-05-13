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

export type EditorState = {
  styleProps: React.CSSProperties
  caret?: Caret
  mouse?: Mouse // a pink square that acts a snapping guide
  direction?: Direction
  pindex?: number
  sindex?: number
  paragraphs: Array<Array<TextNode>>
}

/* Caret */

export interface SetterProps {
  el: HTMLElement
  offset: number
  x: number
  y: number
  length: (pindex: number, sindex: number) => number
  spanCount: (pindex: number) => number
  pCount: number
}

export interface MoverProps {
  caret: Caret
  pindex: number
  sindex: number
  length: (pindex: number, sindex: number) => number
  spanCount: (pindex: number) => number
  pCount: number
}

export interface MoveState {
  caret: Caret
  pindex: number
  sindex: number
  direction?: Direction
}

/* Writer */

export interface WriterProps {
  caret: Caret
  pindex: number
  sindex: number
  paragraphs: Array<Array<TextNode>>
}
