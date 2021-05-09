/* Navigation.ts
   - heavier functions for navigating the caret
*/

import * as Coords from './Coords'
import { TextNode, Caret, Mouse, EditorState, SetterProps } from './Types'

function incrementOffset(
  initialOffset: number,
  initialPindex: number,
  initialSindex: number,
  paragraphs: Array<Array<TextNode>>
): {
  offset: number
  pindex: number
  sindex: number
} | null {
  let offset = initialOffset + 1
  let pindex = initialPindex
  let sindex = initialSindex

  if (offset <= paragraphs[pindex][sindex].text.length) {
    return { offset, pindex, sindex }
  } else {
    // go to next span
    offset = 0
    sindex++
  }

  if (sindex < paragraphs[pindex].length) {
    return { offset, pindex, sindex }
  } else {
    // go to next paragraph
    pindex++
    sindex = 0
  }

  if (pindex < paragraphs.length) {
    return { offset, pindex, sindex }
  } else {
    // reach end of document
    return null
  }
}

function decrementOffset(
  initialOffset: number,
  initialPindex: number,
  initialSindex: number,
  paragraphs: Array<Array<TextNode>>
): {
  offset: number
  pindex: number
  sindex: number
} | null {
  let offset = initialOffset - 1
  let pindex = initialPindex
  let sindex = initialSindex

  if (offset >= 0) {
    return { offset, pindex, sindex }
  } else {
    // go to previous span
    sindex--
  }

  if (sindex >= 0) {
    offset = paragraphs[pindex][sindex].text.length - 1
    return { offset, pindex, sindex }
  } else {
    // go to previous paragraph
    pindex--
  }

  if (pindex >= 0) {
    sindex = paragraphs[pindex].length - 1
    offset = paragraphs[pindex][sindex].text.length
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

export function checkBounds(
  p: Element,
  arr: Array<TextNode>,
  clickX: number,
  start: number
): boolean {
  if (arr[0].text.length >= 1) {
    // check the span has room
    const rect = Coords.getRectFromRange(p.children[0].childNodes[0], 1)
    const next = rect.left
    if (clickX < Coords.calcMiddle(start, next)) {
      // check the mouse coords are out of bounds (the mid x of first char)
      return true
    }
  } else if (arr.length > 1) {
    // check the next span has room
    const rect = Coords.getRectFromRange(p.children[1].childNodes[0], 0)
    const next = rect.left
    if (clickX < Coords.calcMiddle(start, next)) {
      // check the mouse coords are out of bounds (the mid x of first char)
      return true
    }
  }
  return false
}

export function fixToNearestSpan(
  p: HTMLElement,
  arr: Array<TextNode>,
  offset: number,
  clickX: number,
  clickY: number
): {
  caret: Caret
  mouse: Mouse
  sindex: number
} {
  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()

  const caret: Caret = { offset, x: 0, y: 0 }

  // TODO: two for loops, maybe try one or some other solution

  const outOfBounds = checkBounds(p, arr, clickX, cont.left + 100)
  if (outOfBounds && offset > 0) {
    console.log('snap to start')

    for (let si = 0; si < arr.length; si++) {
      const node = arr[si]
      let nextOffset = offset + 1
      let nextSindex = si
      if (node.text.length < nextOffset) {
        nextOffset = 0
        nextSindex = si + 1
      }

      const span = p.children[nextSindex]
      const rect = Coords.getRectFromRange(span.childNodes[0], nextOffset)
      const y = rect.top

      // TODO: change caret, overlap at end

      // remember calcTop, spans are not the right height!
      if (Coords.calcTop(y) <= clickY && clickY <= Coords.calcTop(y + 28)) {
        // on the same line
        caret.x = 100
        caret.y = Coords.calcTop(rect.top - cont.top + d.scrollTop)

        const mouse: Mouse = { x: cont.left + 100, y }
        return { caret, mouse, sindex: si }
      } else if (Coords.calcTop(y) > clickY) {
        console.log('already past y')
        break
      }
    }
  }

  let bestX = Number.MAX_VALUE
  let bestY = Number.MAX_VALUE
  let bestDiff = Number.MAX_VALUE
  let bestSindex = 0

  // traverse the spans that contain the offset
  for (let sindex = 0; sindex < arr.length; sindex++) {
    const node = arr[sindex]
    if (node.text.length >= offset) {
      const span = p.children[sindex]
      const rect = Coords.getRectFromRange(span.childNodes[0], offset)
      const [x, y] = [rect.left, rect.top]

      // when surpass y just stop
      if (Coords.calcTop(y) > clickY) {
        console.log('already past y')
        break
      }

      const diff = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2))
      if (diff < bestDiff) {
        bestX = x
        bestY = y
        bestDiff = diff
        bestSindex = sindex
        caret.x = Coords.calcLeft(rect.left - cont.left)
        caret.y = Coords.calcTop(rect.top - cont.top + d.scrollTop)
      }
    } else if (node.text.length === 0) {
      // is there such a case?
      console.log('empty node')
      const x = cont.left + 100 // margin
      const y = p.offsetTop + cont.top + d.scrollTop + 4 // (28 - 20) / 2
      const diff = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2))
      if (diff < bestDiff) {
        bestX = x
        bestY = y
        bestDiff = diff
        bestSindex = 0
        caret.x = 100
        caret.y = p.offsetTop
      }
    }
  }

  const mouse: Mouse = { x: bestX, y: bestY }
  return { caret, mouse, sindex: bestSindex }
}

/* Movers */

export function moveRight(editor: EditorState): Object {
  if (
    editor.caret === undefined ||
    editor.pindex === undefined ||
    editor.sindex === undefined
  ) {
    return { direction: undefined }
  }

  const output = incrementOffset(
    editor.caret.offset,
    editor.pindex,
    editor.sindex,
    editor.paragraphs
  )

  if (output === null) {
    return { direction: undefined }
  }

  const { offset, pindex, sindex } = output
  const p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement

  // empty paragraph
  if (editor.paragraphs[pindex][sindex].text.length === 0) {
    const caret = {
      offset,
      x: 100,
      y: p.offsetTop
    }
    return { caret, pindex, sindex, direction: undefined }
  }

  const span = p.children[sindex]
  const [x, y] = Coords.getCoords(span, offset)

  if (pindex === editor.pindex) {
    const oldSpan = p.children[editor.sindex]
    const oldCoords = Coords.getCoords(oldSpan, editor.caret.offset)

    if (editor.caret.x === 100) {
      const caret = { offset, x, y }
      return { caret, pindex, sindex, direction: undefined }
    }

    if (oldCoords[1] !== y) {
      // next line
      const caret = {
        offset: offset - 1, // same offset must repeat for endline and startline
        x: 100,
        y
      }
      return { caret, pindex, sindex, direction: undefined }
    }
  }

  const caret = { offset, x, y }
  return { caret, pindex, sindex, direction: undefined }
}

export function moveLeft(editor: EditorState): Object {
  if (
    editor.caret === undefined ||
    editor.pindex === undefined ||
    editor.sindex === undefined
  ) {
    return { direction: undefined }
  }

  const output = decrementOffset(
    editor.caret.offset,
    editor.pindex,
    editor.sindex,
    editor.paragraphs
  )

  if (output === null) {
    return { direction: undefined }
  }

  const { offset, pindex, sindex } = output
  const p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement

  // empty paragraph
  if (editor.paragraphs[pindex][sindex].text.length === 0) {
    const caret = {
      offset,
      x: 100,
      y: p.offsetTop
    }
    return { caret, pindex, sindex, direction: undefined }
  }

  const span = p.children[sindex]
  const [x, y] = Coords.getCoords(span, offset)

  if (pindex === editor.pindex) {
    const oldSpan = p.children[editor.sindex]
    const oldCoords = Coords.getCoords(oldSpan, editor.caret.offset)

    if (editor.caret.x === 100) {
      const caret = { offset, x, y }
      return { caret, pindex, sindex, direction: undefined }
    }

    if (oldCoords[1] !== y) {
      // previous line
      const caret = {
        offset: offset + 1, // same offset must repeat for endline and startline
        x: 100,
        y: editor.caret.y
      }
      return { caret, pindex, sindex, direction: undefined }
    }
  }

  const caret = { offset, x, y }
  return { caret, pindex, sindex, direction: undefined }
}

export function moveUp(editor: EditorState): Object {
  if (
    editor.caret === undefined ||
    editor.pindex === undefined ||
    editor.sindex === undefined
  ) {
    return { direction: undefined }
  }

  let offset = editor.caret.offset
  let pindex = editor.pindex
  let sindex = editor.sindex

  // TODO: retain memory of curr span length

  /*while (true) {
    const output = decrementOffset(offset, pindex, sindex, editor.paragraphs)
    if (output === null) {
      return { direction: undefined }
    } else {
      offset = output.offset
      pindex = output.pindex
      sindex = output.sindex
    }

    const span = document.querySelectorAll('.paragraph')[pindex].children[
      sindex
    ]
    const [x, y] = Coords.getCoords(span, offset)
    if (y < editor.caret.y) {
      break
    }
  }*/

  console.log('offset:', offset)

  return { direction: undefined }
}

/* Setters */

export function setCaretForSpan(
  editor: EditorState,
  props: SetterProps
): Object | null {
  const attrPindex = props.el.getAttribute('p-index')
  const attrSindex = props.el.getAttribute('s-index')
  if (attrPindex !== null && attrSindex !== null) {
    let pindex = Number(attrPindex)
    let sindex = Number(attrSindex)

    const [x, y] = Coords.getCoords(props.el, props.offset)
    const caret = { offset: props.offset, x, y }

    const p = document.querySelectorAll('.paragraph')[pindex]
    const arr = editor.paragraphs[pindex]

    const d = document.querySelectorAll('.document')[0]
    const cont = d.getBoundingClientRect()

    const outOfBounds = checkBounds(p, arr, props.x, cont.left + 100)

    if (outOfBounds && props.offset > 0) {
      console.log('snap to start')
      let nextOffset = props.offset + 1
      if (nextOffset > arr[sindex].text.length) {
        nextOffset = 0
        sindex++
      }
      const span = p.children[sindex]
      const rect = Coords.getRectFromRange(span.childNodes[0], nextOffset)
      caret.x = 100
      caret.y = Coords.calcTop(rect.top - cont.top + d.scrollTop)
    }

    return {
      caret,
      mouse: undefined,
      pindex,
      sindex
    }
  }
  return null
}

export function setCaretForParagraph(
  editor: EditorState,
  props: SetterProps
): Object | null {
  const attrPindex = props.el.getAttribute('p-index')
  if (attrPindex !== null) {
    const pindex = Number(attrPindex)
    const paragraph = editor.paragraphs[pindex]
    const state = fixToNearestSpan(
      props.el,
      paragraph,
      props.offset,
      props.x,
      props.y
    )
    return { ...state, pindex }
  }
  return null
}
