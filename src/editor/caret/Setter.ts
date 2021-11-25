/* This file contains functionality for positioning the caret
   to the nearest character relative to cursor position.
   Horrible, horrible things happen here! */

import * as Coords from './Coords'
import { TextNode, Position, EditorState } from '../Types'
import config from '../../config'

// TODO: Clean up the code, look for possible issues

/**
 * Fixes the caret to the nearest span element (text node) in the paragraph.
 *
 * @param p Paragaph element (div)
 * @param arr Array of paragraphs (text node arrays)
 * @param offset focusOffset
 * @param clickX Mouse click x position
 * @param clickY Mouse click y position
 * @returns New state
 */
function fixToNearestSpan(
  p: HTMLElement,
  arr: Array<TextNode>,
  offset: number,
  clickX: number,
  clickY: number
): Position {
  const pos: Position = {
    caret: { offset, x: 0, y: 0 },
    pindex: 0,
    sindex: 0
  }

  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()

  const outOfBounds = checkBounds(
    p,
    arr,
    clickX,
    cont.left + config.PARAGRAPH_PADDING
  )

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

      if (y <= clickY && clickY <= y + config.CARET_HEIGHT) {
        // on the same line
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.caret.y = rect.top - cont.top + d.scrollTop
        pos.sindex = si
        return pos
      } else if (y > clickY) {
        console.log('already past y')
        // WRONG!!
        break
      }
    }
  }

  let bestDiff = Number.MAX_VALUE
  let bestSindex = 0

  console.log('traverse spans containing offset')

  // traverse the spans that contain the offset
  for (let sindex = 0; sindex < arr.length; sindex++) {
    const node = arr[sindex]
    if (node.text.length === 0) {
      // happens with empty paragraphs
      console.log('empty paragraph')
      const x = cont.left + config.PARAGRAPH_PADDING
      const y = p.offsetTop + cont.top + d.scrollTop
      const diff = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2))
      if (diff < bestDiff) {
        bestDiff = diff
        bestSindex = 0
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.caret.y = p.offsetTop + config.ADJUST_Y
        pos.caret.offset = 0
      }
      break
    } else if (node.text.length >= offset) {
      const span = p.children[sindex]
      const rect = Coords.getRectFromRange(span.childNodes[0], offset)
      const [x, y] = [rect.left, rect.top]

      // when surpass final bound just stop
      if (y > clickY) {
        const divider = y - config.ADJUST_Y
        console.log('divider:', divider)
        const finalBound = divider + config.LINE_HEIGHT
        if (y > finalBound) {
          // does it ever come to this??
          console.log('surpass final bound')
          break
        }
      }

      const diff = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2))
      if (diff < bestDiff) {
        bestDiff = diff
        bestSindex = sindex
        pos.caret.x = rect.left - cont.left
        pos.caret.y = rect.top - cont.top + d.scrollTop
      }
    }
  }

  pos.sindex = bestSindex
  return pos
}

// TODO: Replace
/**
 * Checks if the user clicked on the empty space to the left of a line.
 *
 * @param p Paragraph element (div)
 * @param arr Array of paragraphs (text node arrays)
 * @param clickX Mouse click x position
 * @param start X coordinate for left text boundary
 * @returns True if user clicked on the empty space
 */
function checkBounds(
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

// TODO: Helper
function incrementOffset(
  editor: EditorState,
  pos: Position
): {
  offset: number
  pindex: number
  sindex: number
} | null {
  let offset = pos.caret.offset + 1
  let pindex = pos.pindex
  let sindex = pos.sindex

  if (offset <= editor.paragraphs[pindex][sindex].text.length) {
    return { offset, pindex, sindex }
  } else {
    // go to next span
    offset = 1
    sindex++
  }

  if (sindex < editor.paragraphs[pindex].length) {
    return { offset, pindex, sindex }
  } else {
    // go to next paragraph
    pindex++
    sindex = 0
    offset = 0
  }

  if (pindex < editor.paragraphs.length) {
    return { offset, pindex, sindex }
  } else {
    // reach end of document
    return null
  }
}

function calculateForSpan(
  pos: Position,
  editor: EditorState,
  el: HTMLElement,
  offset: number,
  clickX: number,
  clickY: number
): void {
  console.log('Set caret for span:', el)
  console.log('focusOffset:', offset)
  console.log('clientX:', clickX)
  console.log('clientY:', clickY)

  // Consider a situation where the user clicks between
  // two consequtive spans. You get an element and an offset.
  // Sometimes, the offset corresponds to the previous span.
  // In this situation, the position should be set according
  // to the previous span.

  console.log('\nCHECK TRANSITION\n\n')

  // Paragraph as an element
  const p = document.querySelectorAll('.paragraph')[pos.pindex]
  // The bounds of the paragraph relative to the viewport
  // * https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  const bounds = p.getBoundingClientRect()
  // Mouse x coordinate relative to the paragraph
  const pX = clickX - bounds.left

  console.log('Paragraph bounds:', bounds)
  console.log('X coordinate within paragraph:', pX)
  console.log('X coordinate within viewport:', clickX)

  // Keep track of the shorter distance to cursor position
  let shortestDist = Number.MAX_VALUE

  if (offset <= editor.paragraphs[pos.pindex][pos.sindex].text.length) {
    // Calculate caret position within the current span
    ;[pos.caret.x, pos.caret.y] = Coords.getCoords(el, offset)
    console.log('caret.x:', pos.caret.x)
    // Calculate distance to the cursor position (relative to paragraph)
    shortestDist = Math.abs(pos.caret.x - pX)
    console.log('Distance to cursor position:', shortestDist)
  }

  if (
    pos.sindex > 0 &&
    offset <= editor.paragraphs[pos.pindex][pos.sindex - 1].text.length
  ) {
    if (el.previousSibling !== null) {
      const prevSpan = el.previousSibling as HTMLElement
      // Calculate caret position within the previous span
      const [prevX, prevY] = Coords.getCoords(prevSpan, offset)
      console.log('prev.x:', prevX)
      // Calculate distance to the cursor position (relative to paragraph)
      const dist = Math.abs(prevX - pX)
      console.log('Distance to cursor position:', dist)
      // Compare this to the current shortest distance.
      // If the values are the same, favor the previous span.
      // This is because it is assumed that the caret position
      // between two spans is the last position of the previous span.
      if (dist <= shortestDist) {
        console.log('Fix caret to previous span')
        pos.caret.x = prevX
        pos.caret.y = prevY
        pos.sindex--
      }
    }
  }

  // Next, consider a situation where the user clicks at
  // the beginning of a line, somewhere over the first
  // character. In this situation, the caret should be set before the
  // first character, right at the left border of the line.

  // There is a small problem with this. The value of the offset
  // is the same for the position at the start of a line and the
  // position at the end of the previous line, given that it is
  // still within the same node (nodes can span multiple lines).

  // If the coordinates for the caret were calculated in the
  // usual way, the caret would be set at the end of the previous
  // line - a far reach from where the user clicked!

  // To correct this, check whether the user clicked at the start.

  console.log('\nCHECK START\n\n')

  // The document which contains the paragraph elements
  const d = document.querySelectorAll('.document')[0]
  // The bound of the document relative to the viewport
  const cont = d.getBoundingClientRect()

  // The left border of the line relative to the viewport
  const leftBorder = cont.left + config.PARAGRAPH_PADDING
  console.log('Left border within viewport:', leftBorder)

  // Calculate the next position
  const nextPos = incrementOffset(editor, pos)
  if (nextPos !== null) {
    // Check if user clicked at the start by comparing the bounds
    // of the current position and next position
    const currSpan = p.children[pos.sindex]
    const currRect = Coords.getRectFromRange(
      currSpan.childNodes[0],
      pos.caret.offset
    )
    const nextSpan = p.children[nextPos.sindex]
    const nextRect = Coords.getRectFromRange(
      nextSpan.childNodes[0],
      nextPos.offset
    )

    if (currRect.y !== nextRect.y) {
      const currDist = Math.abs(currRect.x - clickX)
      const nextDist = Math.abs(leftBorder - clickX)
      if (nextDist < currDist) {
        console.log('Snap to start')
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.caret.y = nextRect.top - cont.top + d.scrollTop
      }
    }
  }
}

function calculateForParagraph(
  pos: Position,
  editor: EditorState,
  el: HTMLElement,
  offset: number,
  clickX: number,
  clickY: number
): void {
  console.log('Set caret for paragraph:', el)
  // TODO: Clean up the implementation
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement
  const arr = editor.paragraphs[pos.pindex]
  const res = fixToNearestSpan(p, arr, offset, clickX, clickY)
  pos.caret.offset = res.caret.offset
  pos.caret.x = res.caret.x
  pos.caret.y = res.caret.y
  pos.sindex = res.sindex
}

export function calculateCaretPosition(
  editor: EditorState,
  el: HTMLElement,
  offset: number,
  clickX: number,
  clickY: number,
  pindex: number,
  sindex: number
): Position {
  const pos: Position = {
    caret: { offset, x: 0, y: 0 },
    pindex,
    sindex
  }

  if (el.className === 'text-node') {
    calculateForSpan(pos, editor, el, offset, clickX, clickY)
  } else if (el.className === 'paragraph') {
    calculateForParagraph(pos, editor, el, offset, clickX, clickY)
  }

  return pos
}
