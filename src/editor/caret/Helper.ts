import * as Coords from './Coords'
import { TextNode } from '../Types'

export function incrementOffset(
  initialOffset: number,
  initialPindex: number,
  initialSindex: number,
  length: (pindex: number, sindex: number) => number,
  spanCount: (pindex: number) => number,
  pCount: number
): {
  offset: number
  pindex: number
  sindex: number
} | null {
  let offset = initialOffset + 1
  let pindex = initialPindex
  let sindex = initialSindex

  if (offset <= length(pindex, sindex)) {
    return { offset, pindex, sindex }
  } else {
    // go to next span
    offset = 1
    sindex++
  }

  if (sindex < spanCount(pindex)) {
    return { offset, pindex, sindex }
  } else {
    // go to next paragraph
    pindex++
    sindex = 0
  }

  if (pindex < pCount) {
    return { offset, pindex, sindex }
  } else {
    // reach end of document
    return null
  }
}

export function decrementOffset(
  initialOffset: number,
  initialPindex: number,
  initialSindex: number,
  length: (pindex: number, sindex: number) => number,
  spanCount: (pindex: number) => number
): {
  offset: number
  pindex: number
  sindex: number
} | null {
  let offset = initialOffset - 1
  let pindex = initialPindex
  let sindex = initialSindex

  if (offset >= 1 || (offset >= 0 && sindex === 0)) {
    return { offset, pindex, sindex }
  } else {
    // go to previous span
    sindex--
  }

  if (sindex >= 0) {
    offset = length(pindex, sindex)
    return { offset, pindex, sindex }
  } else {
    // go to previous paragraph
    pindex--
  }

  if (pindex >= 0) {
    sindex = spanCount(pindex) - 1
    offset = length(pindex, sindex)
    return { offset, pindex, sindex }
  } else {
    // reach start of document
    return null
  }
}

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
