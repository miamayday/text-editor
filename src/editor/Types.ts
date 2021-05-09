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
  LeftAfterDelete,
  Right,
  RightAfterWrite
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

/* Interfaces */

export interface SetterProps {
  el: HTMLElement
  offset: number
  x: number
  y: number
}
