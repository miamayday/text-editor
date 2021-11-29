/* This file contains functionality for positioning the caret
   to the nearest character relative to cursor position.
   
   Rules:
   - Use HTMLElement instead of Element
   - Use the coordinate system relative to the document
     * Caret position in CSS is calculated this way
   
   Main function calculateCaretPosition is at the bottom. */

import * as Coords from './Coords'
import { Position, TextNode } from '../Types'
import { moveOffset } from './Helper'
import config from '../../config'

enum Distance {
  X,
  Y,
  Euclidean
}

function calculateDistance(
  method: Distance,
  mouseX: number,
  mouseY: number,
  x: number,
  y: number
) {
  if (method === Distance.X) {
    return Math.abs(mouseX - x)
  } else if (method === Distance.Y) {
    return Math.abs(mouseY - y)
  } else {
    return Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2))
  }
}

function getParagraphElement(pindex: number): HTMLElement {
  return document.querySelectorAll('.paragraph')[pindex] as HTMLElement
}

/**
 * Checks whether the current offset repeats for the next position.
 *
 * Modifies the given Position object to represent the position closer to cursor.
 * @param paragraphs Paragraphs in the editor
 * @param pos Current position
 * @param p Paragraph HTML element
 * @param mouseX Mouse x coordinate relative to the document
 * @param mouseY Mouse y coordinate relative to the document
 * @param method Method of calculating distance
 * @returns Shortest distance to the cursor position
 */
function checkOffsetRepeat(
  paragraphs: Array<Array<TextNode>>,
  pos: Position,
  mouseX: number,
  mouseY: number,
  method: Distance
): number {
  // Fix y coordinate to center of line for better results
  const CENTER_Y = config.CARET_HEIGHT / 2

  const p = getParagraphElement(pos.pindex)

  const currSpan = p.children[pos.sindex]
  const [currX, currY] = Coords.getDocumentCoords(currSpan, pos.caret.offset)
  const currDist = calculateDistance(
    method,
    mouseX,
    mouseY,
    currX,
    currY + CENTER_Y
  )

  const nextPos = moveOffset(false, paragraphs, pos)
  if (nextPos !== null) {
    const nextSpan = p.children[nextPos.sindex]
    let [nextX, nextY] = Coords.getDocumentCoords(nextSpan, nextPos.offset)

    // Check if user clicked at the start by comparing the bounds
    // of the current position and next position
    if (currY !== nextY) {
      nextX = config.PARAGRAPH_PADDING
      const nextDist = calculateDistance(
        method,
        mouseX,
        mouseY,
        nextX,
        nextY + CENTER_Y
      )
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
 *
 * Modifies the given Position object to represent the new caret position.
 * @param pos Default position
 * @param paragraphs Paragraphs in the editor
 * @param el Span HTML element
 * @param offset focusOffset
 * @param mouseX Mouse x coordinate relative to the document
 * @param mouseY Mouse y coordinate relative to the document
 */
function calculateForSpan(
  pos: Position,
  paragraphs: Array<Array<TextNode>>,
  el: HTMLElement,
  offset: number,
  mouseX: number,
  mouseY: number
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
    shortestDist = Math.abs(mouseX - pos.caret.x)
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
      const dist = Math.abs(prevX - mouseX)
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

  checkOffsetRepeat(paragraphs, pos, mouseX, mouseY, Distance.X)
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
  mouseX: number,
  mouseY: number,
  start: number,
  end: number
): void {
  const p = getParagraphElement(pos.pindex)
  const arr = paragraphs[pos.pindex]

  let shortestDistance = Number.MAX_VALUE
  let candidate = start
  let increment = Math.sign(end - start)

  let upper = 0
  let lower = 0

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
        mouseX,
        mouseY,
        Distance.Y
      )
      // Check if new candidate is closer
      if (dist < shortestDistance) {
        console.log('New best candidate:', candidate)
        shortestDistance = dist
        pos.caret.x = candidatePos.caret.x
        pos.caret.y = candidatePos.caret.y
        pos.sindex = candidate
        // Check if new candidate is on the correct line
        // * Inclusive upper limit
        // * Exclusive lower limit
        upper = candidatePos.caret.y - config.ADJUST_Y
        lower = upper + config.LINE_HEIGHT
        if (mouseY >= upper && mouseY < lower) {
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
  mouseX: number,
  mouseY: number,
  start: number,
  end: number
): void {
  const p = getParagraphElement(pos.pindex)
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
      checkOffsetRepeat(paragraphs, candidatePos, mouseX, mouseY, Distance.Y)

      // Check if candidate is still on the same line
      if (candidatePos.caret.y !== originalY) {
        console.log('Break')
        break
      }

      // Calculate distance to cursor position
      const dist = Math.abs(mouseX - candidatePos.caret.x)
      if (dist < shortestDistance) {
        console.log('New best candidate:', candidate)
        shortestDistance = dist
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
 *
 * Modifies the given Position object to represent the new caret position.
 * @param pos Default position
 * @param paragraphs Paragraphs in the editor
 * @param el Paragraph HTML element
 * @param offset focusOffset
 * @param mouseX Mouse x coordinate relative to the document
 * @param mouseY Mouse y coordinate relative to the document
 */
function calculateForParagraph(
  pos: Position,
  paragraphs: Array<Array<TextNode>>,
  el: HTMLElement,
  offset: number,
  mouseX: number,
  mouseY: number
): void {
  console.log('Set caret for paragraph:', el)

  // Selected paragraph as an HTML element
  const p = getParagraphElement(pos.pindex)
  // Selected paragraph as an array of text nodes
  const arr = paragraphs[pos.pindex]

  // Check for empty paragraph
  if (arr[0].text.length === 0) {
    console.log('Paragraph is empty')
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
  checkOffsetRepeat(paragraphs, pos, mouseX, mouseY, Distance.Y)

  // Limits for y (line corresponding to cursor position)
  const upperLimit = pos.caret.y - config.ADJUST_Y // Inclusive
  const lowerLimit = upperLimit + config.LINE_HEIGHT // Exclusive

  if (mouseY < upperLimit) {
    console.log('Go up')
    seekLine(paragraphs, pos, offset, mouseX, mouseY, mid, 0)
  } else if (mouseY >= lowerLimit) {
    console.log('Go down')
    seekLine(paragraphs, pos, offset, mouseX, mouseY, mid, arr.length - 1)
  } else {
    console.log('Already on the correct line')
  }

  if (mouseX < pos.caret.x) {
    console.log('Go left')
    seekPosition(paragraphs, pos, offset, mouseX, mouseY, pos.sindex, 0)
  } else if (mouseX > pos.caret.x) {
    console.log('Go right')
    seekPosition(
      paragraphs,
      pos,
      offset,
      mouseX,
      mouseY,
      pos.sindex,
      arr.length - 1
    )
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

  const pos: Position = {
    caret: { offset, x: 0, y: 0 },
    pindex,
    sindex
  }

  console.log('\n * * * CARET SETTING * * * \n\n')
  console.log('focusOffset:', offset)

  if (el.className === 'text-node') {
    calculateForSpan(pos, paragraphs, el, offset, mouseX, mouseY)
  } else if (el.className === 'paragraph') {
    calculateForParagraph(pos, paragraphs, el, offset, mouseX, mouseY)
  }

  return pos
}
