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

/**
 * Checks whether the current offset repeats for the next position.
 *
 * Modifies the given Position object to represent the position closer to cursor.
 * @param paragraphs Paragraphs in the editor
 * @param pos Current position
 * @param p Paragraph HTML element
 * @param mouseX Mouse x coordinate relative to the document
 * @param mouseY Mouse y coordinate relative to the document
 * @returns Shortest distance to the cursor position
 */
function checkOffsetRepeat(
  paragraphs: Array<Array<TextNode>>,
  pos: Position,
  p: HTMLElement,
  mouseX: number,
  mouseY: number,
  method: Distance
): number {
  const currSpan = p.children[pos.sindex]
  const [currX, currY] = Coords.getDocumentCoords(currSpan, pos.caret.offset)
  const currDist = calculateDistance(method, mouseX, mouseY, currX, currY)

  const nextPos = moveOffset(false, paragraphs, pos)
  if (nextPos !== null) {
    const nextSpan = p.children[nextPos.sindex]
    let [nextX, nextY] = Coords.getDocumentCoords(nextSpan, nextPos.offset)

    // Check if user clicked at the start by comparing the bounds
    // of the current position and next position
    if (currY !== nextY) {
      nextX = config.PARAGRAPH_PADDING
      const nextDist = calculateDistance(method, mouseX, mouseY, nextX, nextY)
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

  // Paragraph as an element
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement

  // Keep track of the shortest distance to cursor position
  let shortestDist = Number.MAX_VALUE

  if (offset <= paragraphs[pos.pindex][pos.sindex].text.length) {
    // Calculate caret position relative to the document
    ;[pos.caret.x, pos.caret.y] = Coords.getDocumentCoords(el, offset)
    // Calculate distance to the cursor position
    shortestDist = Math.abs(pos.caret.x - mouseX)
  }

  if (
    pos.sindex > 0 &&
    offset <= paragraphs[pos.pindex][pos.sindex - 1].text.length
  ) {
    if (el.previousSibling !== null) {
      const prevSpan = el.previousSibling as HTMLElement
      // Calculate caret position in the previous span (relative to document)
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
  // still within the same node (nodes can span multiple lines).

  // If the coordinates for the caret were calculated in the
  // usual way, the caret would be set at the end of the previous
  // line - a far reach from where the user clicked!

  // To correct this, check whether the user clicked at the start.

  checkOffsetRepeat(paragraphs, pos, p, mouseX, mouseY, Distance.X)
}

/**
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

  // The paragraph as an element
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement
  // The paragraph as an array
  const arr = paragraphs[pos.pindex]

  // Check for empty paragraph
  if (arr[0].text.length === 0) {
    console.log('Paragraph is empty')
    pos.caret.x = config.PARAGRAPH_PADDING
    pos.caret.y = p.offsetTop + config.ADJUST_Y
    pos.caret.offset = 0
    return
  }

  // Traverse the spans that contain the offset TODO:

  /*const mid = Math.floor((arr.length - 1) / 2)
  const midNode = arr[mid]
  const midSpan = p.children[mid]
  const midOffset = Math.floor(midNode.text.length / 2)
  const [midX, midY] = Coords.getDocumentCoords(midSpan, midOffset)

  const divider = midY - config.ADJUST_Y
  console.log('divider:', divider)
  const finalBound = divider + config.LINE_HEIGHT
  console.log('final bound:', finalBound)

  let increment = 1
  let stop = arr.length
  if (mouseY < finalBound) {
    increment = -1
    stop = -1
  }*/

  let shortestDistance = Number.MAX_VALUE
  let candidate = 0 // The span index of a candidate
  while (candidate < arr.length) {
    const node = arr[candidate]
    // A candidate must contain the offset
    if (offset <= node.text.length) {
      // Calculate candidate position
      const span = p.children[candidate]
      const [newX, newY] = Coords.getDocumentCoords(span, offset)
      const newPos: Position = {
        caret: { offset, x: newX, y: newY },
        pindex: pos.pindex,
        sindex: candidate
      }
      // Calculate distance to cursor position + check border case
      const dist = checkOffsetRepeat(
        paragraphs,
        newPos,
        p,
        mouseX,
        mouseY,
        Distance.Euclidean
      )
      // Check if new candidate is closer
      if (dist < shortestDistance) {
        console.log('New best candidate:', candidate)
        shortestDistance = dist
        pos.caret.x = newPos.caret.x
        pos.caret.y = newPos.caret.y
        pos.sindex = candidate
      } // TODO: break clause
    }
    candidate += 1
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
