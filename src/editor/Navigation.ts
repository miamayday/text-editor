/* Navigation.ts
   - heavier functions for navigating the caret
*/

import * as Coords from './Coords'
import {
  TextNode,
  Caret,
  Mouse,
  EditorState,
  SetterProps,
  MoveState
} from './Types'

function binOffset(
  span: Element,
  node: TextNode,
  clickY: number,
  l: number,
  r: number
): { offset: number; y: number } {
  const m = (r - l) / 2

  const start = Coords.getRectFromRange(span.childNodes[0], 0)

  if (clickY < start.top) {
    return binOffset(span, node, clickY, l, m - 1)
  }

  const len = node.text.length
  const end = Coords.getRectFromRange(span.childNodes[0], len)

  if (clickY > end.top + 28) {
    return binOffset(span, node, clickY, m + 1, r)
  }

  return { offset: m, y: start.top }
}

function binSindex(
  p: Element,
  arr: Array<TextNode>,
  clickY: number,
  l: number,
  r: number
): number {
  const m = (r - l) / 2

  const span = p.children[m]
  const start = Coords.getRectFromRange(span.childNodes[0], 0)

  if (clickY < start.top) {
    return binSindex(p, arr, clickY, l, m - 1)
  }

  const len = arr[m].text.length
  const end = Coords.getRectFromRange(span.childNodes[0], len)

  if (clickY > end.top + 28) {
    return binSindex(p, arr, clickY, m + 1, r)
  }

  return m
}

function binarySearch(
  p: Element,
  arr: Array<TextNode>,
  clickY: number
): { offset: number; y: number } {
  const sindex = binSindex(p, arr, clickY, 0, arr.length - 1)
  const output = binOffset(
    p.children[sindex],
    arr[sindex],
    clickY,
    0,
    arr[sindex].text.length
  )

  return output
}
