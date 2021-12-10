/* This file contains functionality for positioning the caret
   to the nearest character relative to cursor position.
   
   Rules:
   - Use HTMLElement instead of Element
   - Use the coordinate system relative to the document
     * Caret position in CSS is calculated this way
   
   Main function calculateCaretPosition is at the bottom. */

import * as Coords from './Coords'
import { Coordinates, Position, Status, TextNode } from '../Types'
import { moveOffset } from './Helper'
import config from '../../config'

enum Distance {
  X,
  Y,
  Euclidean
}

function calculateDistance(
  method: Distance,
  mouse: Coordinates,
  x: number,
  y: number
) {
  if (method === Distance.X) {
    return Math.abs(mouse.x - x)
  } else if (method === Distance.Y) {
    return Math.abs(mouse.y - y)
  } else {
    return Math.sqrt(Math.pow(mouse.x - x, 2) + Math.pow(mouse.y - y, 2))
  }
}

/**
 * Checks whether the current offset repeats for the next position.
 * @returns Shortest distance to cursor position
 */
function checkOffsetRepeat(
  paragraphs: Array<Array<TextNode>>,
  pos: Position,
  mouse: Coordinates,
  method: Distance
): number {
  // Fix y coordinate to center of line for better results
  const CENTER_Y = config.CARET_HEIGHT / 2

  const p = Coords.getParagraphElement(pos.pindex)

  const currSpan = p.children[pos.sindex]
  const [currX, currY] = Coords.getDocumentCoords(currSpan, pos.caret.offset)
  const currDist = calculateDistance(method, mouse, currX, currY + CENTER_Y)

  const stump = {
    // TODO:
    offset: pos.caret.offset,
    pindex: pos.pindex,
    sindex: pos.sindex
  }
  const nextPos = moveOffset(false, paragraphs, stump)
  if (nextPos !== null) {
    const nextSpan = p.children[nextPos.sindex]
    let [nextX, nextY] = Coords.getDocumentCoords(nextSpan, nextPos.offset)

    // Check if user clicked at the start by comparing the bounds
    // of the current position and next position
    if (currY !== nextY) {
      nextX = config.PARAGRAPH_PADDING
      const nextDist = calculateDistance(method, mouse, nextX, nextY + CENTER_Y)
      if (nextDist < currDist) {
        console.log('Choose next')
        pos.caret.x = nextX
        pos.caret.y = nextY
        return nextDist
      }
    }
  }
  console.log('Keep current')
  pos.caret.x = currX
  pos.caret.y = currY
  return currDist
}

/**
 * Calculates the caret position within the clicked span.
 */
function calculateForSpan(
  pos: Position,
  paragraphs: Array<Array<TextNode>>,
  el: HTMLElement,
  offset: number,
  mouse: Coordinates
): void {
  console.log('Set caret for span:', el)

  // Consider a situation where the user clicks between
  // two consequtive spans. You get an element and an offset.
  // Sometimes, the offset corresponds to the previous span.
  // In this situation, the position should be set according
  // to the previous span.

  // Keep track of the shortest distance to the cursor position
  let shortestDist = Number.MAX_VALUE

  // Set current caret position
  if (offset <= paragraphs[pos.pindex][pos.sindex].text.length) {
    ;[pos.caret.x, pos.caret.y] = Coords.getDocumentCoords(el, offset)
    shortestDist = Math.abs(mouse.x - pos.caret.x)
  }

  if (
    pos.sindex > 0 &&
    offset <= paragraphs[pos.pindex][pos.sindex - 1].text.length
  ) {
    // Check previous span
    if (el.previousSibling !== null) {
      const prevSpan = el.previousSibling as HTMLElement
      const [prevX, prevY] = Coords.getDocumentCoords(prevSpan, offset)
      // Calculate distance to the cursor position
      const dist = Math.abs(prevX - mouse.x)
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
  // still the same node (nodes can span multiple lines).

  // If the coordinates for the caret were calculated in the
  // usual way, the caret would be set at the end of the previous
  // line - a far reach from where the user clicked!

  // To correct this, check whether the user clicked at the start.

  checkOffsetRepeat(paragraphs, pos, mouse, Distance.X)
}

/**
 * Seeks the position closest to cursor with respect to y.
 *
 * In other words, seeks the line which corresponds to cursor position.
 */
function seekLine(
  paragraphs: Array<Array<TextNode>>,
  pos: Position,
  offset: number,
  mouse: Coordinates,
  start: number,
  end: number
): void {
  const p = Coords.getParagraphElement(pos.pindex)
  const arr = paragraphs[pos.pindex]

  let shortestDistance = Number.MAX_VALUE
  let candidate = start
  let increment = Math.sign(end - start)

  /* Seek y */

  const invalid = end + increment
  while (candidate !== invalid) {
    const node = arr[candidate]
    // Check that the candidate contains the offset
    if (offset <= node.text.length) {
      // Calculate candidate position
      const span = p.children[candidate]
      const [x, y] = Coords.getDocumentCoords(span, offset)
      const candidatePos: Position = {
        caret: { offset, x, y },
        pindex: pos.pindex,
        sindex: candidate
      }
      // Calculate distance to cursor position + check border case
      const dist = checkOffsetRepeat(
        paragraphs,
        candidatePos,
        mouse,
        Distance.Y
      )
      // Check if new candidate is closer
      if (dist < shortestDistance) {
        console.log('New best candidate:', candidate)
        shortestDistance = dist
        pos.caret.offset = offset
        pos.caret.x = candidatePos.caret.x
        pos.caret.y = candidatePos.caret.y
        pos.sindex = candidate
        // Check if new candidate is on the correct line
        // * Inclusive upper limit
        // * Exclusive lower limit
        const upperLimit = candidatePos.caret.y - config.ADJUST_Y
        const lowerLimit = upperLimit + config.LINE_HEIGHT
        if (mouse.y >= upperLimit && mouse.y < lowerLimit) {
          console.log('Found correct line')
          break
        }
      }
    }
    candidate += increment
  }
}

/**
 * Seeks the position closest to cursor with respect to x.
 */
function seekPosition(
  paragraphs: Array<Array<TextNode>>,
  pos: Position,
  offset: number,
  mouse: Coordinates,
  start: number,
  end: number
): void {
  const p = Coords.getParagraphElement(pos.pindex)
  const arr = paragraphs[pos.pindex]

  let shortestDistance = Number.MAX_VALUE
  let candidate = start
  let increment = Math.sign(end - start)

  const originalY = pos.caret.y

  /* Seek x */

  const invalid = end + increment
  while (candidate !== invalid) {
    const node = arr[candidate]
    // Check that the candidate contains the offset
    if (offset <= node.text.length) {
      // Calculate candidate position
      const span = p.children[candidate]
      const [x, y] = Coords.getDocumentCoords(span, offset)
      const candidatePos: Position = {
        caret: { offset, x, y },
        pindex: pos.pindex,
        sindex: candidate
      }

      // Check border case
      checkOffsetRepeat(paragraphs, candidatePos, mouse, Distance.Y)

      // Check if candidate is still on the same line
      if (candidatePos.caret.y !== originalY) {
        console.log('Break')
        break
      }

      // Calculate distance to cursor position
      const dist = Math.abs(mouse.x - candidatePos.caret.x)
      if (dist < shortestDistance) {
        console.log('New best candidate:', candidate)
        shortestDistance = dist
        pos.caret.offset = offset
        pos.caret.x = candidatePos.caret.x
        pos.caret.y = candidatePos.caret.y
        pos.sindex = candidate
      }
    }
    candidate += increment
  }
}

/**
 * Calculates the caret position within the clicked paragraph.
 */
function calculateForParagraph(
  pos: Position,
  paragraphs: Array<Array<TextNode>>,
  el: HTMLElement,
  offset: number,
  mouse: Coordinates
): void {
  console.log('Set caret for paragraph:', el)

  // Selected paragraph as an HTML element
  const p = Coords.getParagraphElement(pos.pindex)
  // Selected paragraph as an array of text nodes
  const arr = paragraphs[pos.pindex]

  // Check for empty paragraph
  if (arr[0].text.length === 0) {
    console.log('Empty paragraph')
    pos.caret.x = config.PARAGRAPH_PADDING
    pos.caret.y = p.offsetTop + config.ADJUST_Y
    pos.caret.offset = 0
    return
  }

  // Traverse the spans containing offset, starting from the middle

  const mid = Math.floor((arr.length - 1) / 2)
  const midNode = arr[mid]
  const midSpan = p.children[mid]
  let midOffset = offset
  if (offset > midNode.text.length) {
    console.log('Change offset')
    midOffset = Math.floor(midNode.text.length / 2)
  }

  // Set initial position
  ;[pos.caret.x, pos.caret.y] = Coords.getDocumentCoords(midSpan, midOffset)
  pos.caret.offset = midOffset
  pos.sindex = mid

  // Check border case
  checkOffsetRepeat(paragraphs, pos, mouse, Distance.Y)

  // Limits for y (line corresponding to cursor position)
  const upperLimit = pos.caret.y - config.ADJUST_Y // Inclusive
  const lowerLimit = upperLimit + config.LINE_HEIGHT // Exclusive

  if (mouse.y < upperLimit) {
    console.log('Go up')
    seekLine(paragraphs, pos, offset, mouse, mid, 0)
  } else if (mouse.y >= lowerLimit) {
    console.log('Go down')
    seekLine(paragraphs, pos, offset, mouse, mid, arr.length - 1)
  } else {
    console.log('Already on the correct line')
  }

  if (mouse.x < pos.caret.x) {
    console.log('Go left')
    seekPosition(paragraphs, pos, offset, mouse, pos.sindex, 0)
  } else if (mouse.x > pos.caret.x) {
    console.log('Go right')
    seekPosition(paragraphs, pos, offset, mouse, pos.sindex, arr.length - 1)
  } else {
    // TODO: Does it ever come to this?
  }
}

export function calculateCaretPosition(
  paragraphs: Array<Array<TextNode>>,
  el: HTMLElement,
  offset: number,
  clientX: number,
  clientY: number,
  pindex: number,
  sindex: number
): Position {
  // The document element which contains the paragraph elements
  const d = document.querySelectorAll('.document')[0]
  // The bounds of the document relative to the viewport
  const cont = d.getBoundingClientRect()
  // Mouse coordinates relative to the document
  const mouseX = clientX - cont.left
  const mouseY = clientY - cont.top + d.scrollTop

  const oldPos: Position = {
    caret: { offset, x: 0, y: 0 },
    pindex,
    sindex
  }

  // TODO: Integrate new types
  const pos: Coordinates = { x: 0, y: 0 }
  const status: Status = { offset, pindex, sindex }
  const mouse: Coordinates = { x: mouseX, y: mouseY }

  console.log(' * * * CARET SETTING * * * ')
  console.log('focusOffset:', offset)

  if (el.className === 'text-node') {
    calculateForSpan(oldPos, paragraphs, el, offset, mouse)
  } else if (el.className === 'paragraph') {
    calculateForParagraph(oldPos, paragraphs, el, offset, mouse)
  }

  return oldPos
}
