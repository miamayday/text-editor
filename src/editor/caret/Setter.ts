/* This file contains functionality for positioning the caret
   to the nearest character relative to cursor position.
   Horrible, horrible things happen here! */

import * as Coords from './Coords'
import { Position, EditorState } from '../Types'
import config from '../../config'

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
    // Go to next span
    offset = 1
    sindex++
  }

  if (sindex < editor.paragraphs[pindex].length) {
    return { offset, pindex, sindex }
  } else {
    // Go to next paragraph
    pindex++
    sindex = 0
    offset = 0
  }

  if (pindex < editor.paragraphs.length) {
    return { offset, pindex, sindex }
  } else {
    // Reach end of document
    return null
  }
}

function checkOffsetRepeat(
  editor: EditorState,
  pos: Position,
  p: Element,
  mouseX: number,
  mouseY: number
) {
  const currSpan = p.children[pos.sindex]
  const [currX, currY] = Coords.getDocumentCoords(currSpan, pos.caret.offset)
  const currDist = Math.sqrt(
    Math.pow(currX - mouseX, 2) + Math.pow(currY - mouseY, 2)
  )

  const nextPos = incrementOffset(editor, pos)
  if (nextPos !== null) {
    const nextSpan = p.children[nextPos.sindex]
    let [nextX, nextY] = Coords.getDocumentCoords(nextSpan, nextPos.offset)

    // Check if user clicked at the start by comparing the bounds
    // of the current position and next position
    if (currY !== nextY) {
      nextX = config.PARAGRAPH_PADDING
      const nextDist = Math.sqrt(
        Math.pow(nextX - mouseX, 2) + Math.pow(nextY - mouseY, 2)
      )
      if (nextDist < currDist) {
        pos.caret.x = nextX
        pos.caret.y = nextY
        return nextDist
      }
    }
  }
  pos.caret.x = currX
  pos.caret.y = currY
  return currDist
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

  // The document which contains the paragraph elements
  const d = document.querySelectorAll('.document')[0]
  // The bounds of the document relative to the viewport
  const cont = d.getBoundingClientRect()

  // Mouse coordinates relative to the document
  const mouseX = clickX - cont.left
  const mouseY = clickY - cont.top + d.scrollTop

  // Consider a situation where the user clicks between
  // two consequtive spans. You get an element and an offset.
  // Sometimes, the offset corresponds to the previous span.
  // In this situation, the position should be set according
  // to the previous span.

  // Paragraph as an element
  const p = document.querySelectorAll('.paragraph')[pos.pindex]

  // Keep track of the shortest distance to cursor position
  let shortestDist = Number.MAX_VALUE

  if (offset <= editor.paragraphs[pos.pindex][pos.sindex].text.length) {
    // Calculate caret position relative to the document
    ;[pos.caret.x, pos.caret.y] = Coords.getDocumentCoords(el, offset)
    // Calculate distance to the cursor position
    shortestDist = Math.abs(pos.caret.x - mouseX)
  }

  if (
    pos.sindex > 0 &&
    offset <= editor.paragraphs[pos.pindex][pos.sindex - 1].text.length
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

  checkOffsetRepeat(editor, pos, p, mouseX, mouseY)
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
  console.log('focusOffset:', offset)
  // TODO: Clean up the implementation

  // The document which contains the paragraphs
  const d = document.querySelectorAll('.document')[0]
  // The bounds of the document relative to the viewport
  const cont = d.getBoundingClientRect()

  // Mouse coordinates relative to the document
  const mouseX = clickX - cont.left
  const mouseY = clickY - cont.top + d.scrollTop

  // The paragraph as an element
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement
  // The paragraph as an array
  const arr = editor.paragraphs[pos.pindex]

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
  let candidate = 0
  while (candidate < arr.length) {
    const node = arr[candidate]
    if (offset <= node.text.length) {
      // Calculate distance from cursor position to candidate
      const span = p.children[candidate]
      const [newX, newY] = Coords.getDocumentCoords(span, offset)
      const newPos: Position = {
        caret: { offset, x: newX, y: newY },
        pindex: pos.pindex,
        sindex: candidate
      }

      // Check border case
      const dist = checkOffsetRepeat(editor, newPos, p, mouseX, mouseY)
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

  console.log('\n * * * CARET SETTING * * * \n\n')

  if (el.className === 'text-node') {
    calculateForSpan(pos, editor, el, offset, clickX, clickY)
  } else if (el.className === 'paragraph') {
    calculateForParagraph(pos, editor, el, offset, clickX, clickY)
  }

  return pos
}
