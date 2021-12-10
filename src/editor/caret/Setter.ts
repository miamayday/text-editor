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
 *
 * May modify x and y coordinates.
 * @returns Shortest distance to cursor position
 */
function checkOffsetRepeat(
  paragraphs: Array<Array<TextNode>>,
  pos: Coordinates,
  status: Status,
  mouse: Coordinates,
  method: Distance
): number {
  // Fix y coordinate to center of line for better results
  const CENTER_Y = config.CARET_HEIGHT / 2

  const p = Coords.getParagraphElement(status.pindex)

  const currSpan = p.children[status.sindex]
  const [currX, currY] = Coords.getDocumentCoords(currSpan, status.offset)
  const currDist = calculateDistance(method, mouse, currX, currY + CENTER_Y)

  const nextPos = moveOffset(false, paragraphs, status)
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
        pos.x = nextX
        pos.y = nextY
        return nextDist
      }
    }
  }
  console.log('Keep current')
  pos.x = currX
  pos.y = currY
  return currDist
}

/**
 * Calculates the caret position within the clicked span.
 */
function calculateForSpan(
  pos: Coordinates,
  status: Status,
  paragraphs: Array<Array<TextNode>>,
  el: HTMLElement,
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
  if (status.offset <= paragraphs[status.pindex][status.sindex].text.length) {
    ;[pos.x, pos.y] = Coords.getDocumentCoords(el, status.offset)
    shortestDist = Math.abs(mouse.x - pos.x)
  }

  if (
    status.sindex > 0 &&
    status.offset <= paragraphs[status.pindex][status.sindex - 1].text.length
  ) {
    // Check previous span
    if (el.previousSibling !== null) {
      const prevSpan = el.previousSibling as HTMLElement
      const [prevX, prevY] = Coords.getDocumentCoords(prevSpan, status.offset)
      // Calculate distance to the cursor position
      const dist = Math.abs(prevX - mouse.x)
      // Compare this to the current shortest distance.
      // If the values are the same, favor the previous span.
      // This is because it is assumed that the caret position
      // between two spans is the last position of the previous span.
      if (dist <= shortestDist) {
        console.log('Fix caret to previous span')
        pos.x = prevX
        pos.y = prevY
        status.sindex--
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

  checkOffsetRepeat(paragraphs, pos, status, mouse, Distance.X)
}

/**
 * Seeks the position closest to cursor with respect to y.
 *
 * May modify pos and status objects.
 */
function seekLine(
  pos: Coordinates,
  status: Status,
  paragraphs: Array<Array<TextNode>>,
  goalOffset: number,
  mouse: Coordinates,
  start: number,
  end: number
): void {
  const p = Coords.getParagraphElement(status.pindex)
  const arr = paragraphs[status.pindex]

  let shortestDistance = Number.MAX_VALUE
  let candidate = start
  let increment = Math.sign(end - start)

  /* Seek y */

  const invalid = end + increment
  while (candidate !== invalid) {
    const node = arr[candidate]
    // Check that the candidate contains the offset
    if (goalOffset <= node.text.length) {
      // Calculate candidate position
      const span = p.children[candidate]
      const [x, y] = Coords.getDocumentCoords(span, goalOffset)
      const candidatePos = { x, y }
      const candidateStatus = {
        offset: goalOffset,
        pindex: status.pindex,
        sindex: candidate
      }

      // Calculate distance to cursor position + check border case
      const dist = checkOffsetRepeat(
        paragraphs,
        candidatePos,
        candidateStatus,
        mouse,
        Distance.Y
      )

      // Check if new candidate is closer
      if (dist < shortestDistance) {
        console.log('New best candidate:', candidate)
        shortestDistance = dist
        pos.x = candidatePos.x
        pos.y = candidatePos.y
        status.offset = goalOffset
        status.sindex = candidate
        // Check if new candidate is on the correct line
        // * Inclusive upper limit
        // * Exclusive lower limit
        const upperLimit = pos.y - config.ADJUST_Y
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
 *
 * May modify pos and status objects.
 */
function seekPosition(
  pos: Coordinates,
  status: Status,
  paragraphs: Array<Array<TextNode>>,
  goalOffset: number,
  mouse: Coordinates,
  start: number,
  end: number
): void {
  const p = Coords.getParagraphElement(status.pindex)
  const arr = paragraphs[status.pindex]

  let shortestDistance = Number.MAX_VALUE
  let candidate = start
  let increment = Math.sign(end - start)

  const originalY = pos.y

  /* Seek x */

  const invalid = end + increment
  while (candidate !== invalid) {
    const node = arr[candidate]
    // Check that the candidate contains the offset
    if (goalOffset <= node.text.length) {
      // Calculate candidate position
      const span = p.children[candidate]
      const [x, y] = Coords.getDocumentCoords(span, goalOffset)
      const candidatePos = { x, y }
      const candidateStatus = {
        offset: goalOffset,
        pindex: status.pindex,
        sindex: candidate
      }

      // Check border case
      checkOffsetRepeat(
        paragraphs,
        candidatePos,
        candidateStatus,
        mouse,
        Distance.Y
      )

      // Check if candidate is still on the same line
      if (candidatePos.y !== originalY) {
        console.log('Break')
        break
      }

      // Calculate distance to cursor position
      const dist = Math.abs(mouse.x - candidatePos.x)
      if (dist < shortestDistance) {
        console.log('New best candidate:', candidate)
        shortestDistance = dist
        pos.x = candidatePos.x
        pos.y = candidatePos.y
        status.offset = goalOffset
        status.sindex = candidate
      }
    }
    candidate += increment
  }
}

/**
 * Calculates the caret position within the clicked paragraph.
 */
function calculateForParagraph(
  pos: Coordinates,
  status: Status,
  paragraphs: Array<Array<TextNode>>,
  el: HTMLElement,
  mouse: Coordinates
): void {
  console.log('Set caret for paragraph:', el)

  // Selected paragraph as an HTML element
  const p = Coords.getParagraphElement(status.pindex)
  // Selected paragraph as an array of text nodes
  const arr = paragraphs[status.pindex]

  // Check for empty paragraph
  if (arr[0].text.length === 0) {
    console.log('Empty paragraph')
    pos.x = config.PARAGRAPH_PADDING
    pos.y = p.offsetTop + config.ADJUST_Y
    status.offset = 0
    return
  }

  // Traverse the spans containing goalOffset, starting from the middle
  const goalOffset = status.offset

  const mid = Math.floor((arr.length - 1) / 2)
  const midNode = arr[mid]
  const midSpan = p.children[mid]
  let midOffset = goalOffset
  if (goalOffset > midNode.text.length) {
    console.log('Change offset')
    midOffset = Math.floor(midNode.text.length / 2)
  }

  // Set initial position
  ;[pos.x, pos.y] = Coords.getDocumentCoords(midSpan, midOffset)
  status.offset = midOffset
  status.sindex = mid

  // Check border case
  checkOffsetRepeat(paragraphs, pos, status, mouse, Distance.Y)

  // Limits for y (line corresponding to cursor position)
  const upperLimit = pos.y - config.ADJUST_Y // Inclusive
  const lowerLimit = upperLimit + config.LINE_HEIGHT // Exclusive

  if (mouse.y < upperLimit) {
    console.log('Go up')
    seekLine(pos, status, paragraphs, goalOffset, mouse, mid, 0)
  } else if (mouse.y >= lowerLimit) {
    console.log('Go down')
    seekLine(pos, status, paragraphs, goalOffset, mouse, mid, arr.length - 1)
  } else {
    console.log('Already on the correct line')
  }

  if (mouse.x < pos.x) {
    console.log('Go left')
    seekPosition(pos, status, paragraphs, goalOffset, mouse, status.sindex, 0)
  } else if (mouse.x > pos.x) {
    console.log('Go right')
    seekPosition(
      pos,
      status,
      paragraphs,
      goalOffset,
      mouse,
      status.sindex,
      arr.length - 1
    )
  } else {
    // TODO: Do nothing?
  }
}

export function calculateCaretPosition(
  paragraphs: Array<Array<TextNode>>,
  el: HTMLElement,
  client: Coordinates,
  status: Status
): Position {
  // The document element which contains the paragraph elements
  const d = document.querySelectorAll('.document')[0]
  // The bounds of the document relative to the viewport
  const cont = d.getBoundingClientRect()
  // Mouse coordinates relative to the document
  const mouseX = client.x - cont.left
  const mouseY = client.y - cont.top + d.scrollTop

  const pos: Coordinates = { x: 0, y: 0 }
  const mouse: Coordinates = { x: mouseX, y: mouseY }

  console.log(' * * * CARET SETTING * * * ')
  console.log('focusOffset:', status.offset)

  if (el.className === 'text-node') {
    calculateForSpan(pos, status, paragraphs, el, mouse)
  } else if (el.className === 'paragraph') {
    calculateForParagraph(pos, status, paragraphs, el, mouse)
  }

  // TODO: Delete
  const oldPos: Position = {
    caret: { offset: status.offset, x: pos.x, y: pos.y },
    pindex: status.pindex,
    sindex: status.sindex
  }
  return oldPos
}
