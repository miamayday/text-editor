/* This file contains functionality for positioning the caret
   to the next position according to arrow keys.
   
   Rules:
   - When moving from end of line to the start of next:
     * If the next is a new span: repeat offset
     * If the next is a new paragraph: reset offset to 0
   - When moving from start of line to the end of previous:
     * If the previous is a new span: repeat offset
     * If the previous is a new paragraph: set offset to end of previous
   
   Main function calculateCaretPosition is at the bottom. */

import * as Coords from './Coords'
import {
  Position,
  Caret,
  TextNode,
  Direction,
  Coordinates,
  Status
} from '../Types'
import { moveOffset } from './Helper'
import config from '../../config'

function moveAfterWrite(pos: Coordinates, status: Status): void {
  const p = document.querySelectorAll('.paragraph')[
    status.pindex
  ] as HTMLElement
  const span = p.children[status.sindex]
  const [x, y] = Coords.getDocumentCoords(span, status.offset)
  pos.x = x
  pos.y = y
}

function moveAfterDelete(
  paragraphs: Array<Array<TextNode>>,
  pos: Coordinates,
  status: Status
): void {
  const p = document.querySelectorAll('.paragraph')[
    status.pindex
  ] as HTMLElement
  if (paragraphs[status.pindex][status.sindex].text.length === 0) {
    pos.x = config.PARAGRAPH_PADDING
    pos.y = p.offsetTop + config.ADJUST_Y
    status.offset = 0
    return
  }

  const span = p.children[status.sindex]
  const [x, y] = Coords.getDocumentCoords(span, status.offset)
  pos.x = x
  pos.y = y
}

function moveAfterNewline(
  paragraphs: Array<Array<TextNode>>,
  pos: Coordinates,
  status: Status
): void {
  status.pindex += 1
  status.sindex = 0

  const p = document.querySelectorAll('.paragraph')[
    status.pindex
  ] as HTMLElement
  if (paragraphs[status.pindex][status.sindex].text.length !== 0) {
    const span = p.children[status.sindex]
    const [x, y] = Coords.getDocumentCoords(span, 0)
    pos.x = x
    pos.y = y
    status.offset = 0
  }

  pos.x = config.PARAGRAPH_PADDING
  pos.y = p.offsetTop + config.ADJUST_Y
  status.offset = 0
}

function calculateHorizontal(
  left: boolean,
  paragraphs: Array<Array<TextNode>>,
  pos: Coordinates,
  status: Status
): void {
  left ? console.log('Move left') : console.log('Move right')

  const nextPos = moveOffset(left, paragraphs, status)
  if (nextPos === null) {
    left ? console.log('*Start of document*') : console.log('*End of document*')
    return
  }

  // Next position is an empty paragraph
  if (paragraphs[nextPos.pindex][nextPos.sindex].text.length === 0) {
    console.log('Empty paragraph')
    const p = Coords.getParagraphElement(nextPos.pindex)
    pos.x = config.PARAGRAPH_PADDING
    pos.y = p.offsetTop + config.ADJUST_Y
    status.offset = nextPos.offset
    status.pindex = nextPos.pindex
    status.sindex = nextPos.sindex
    return
  }

  let p = Coords.getParagraphElement(nextPos.pindex)
  let span = p.children[nextPos.sindex]
  const [nextX, nextY] = Coords.getDocumentCoords(span, nextPos.offset)

  // Current paragraph is empty
  if (paragraphs[status.pindex][status.sindex].text.length === 0) {
    console.log('Move straight to next position')
    pos.x = nextX
    pos.y = nextY
    status.offset = nextPos.offset
    status.pindex = nextPos.pindex
    status.sindex = nextPos.sindex
    return
  }

  // Check current position for offset repeat
  if (paragraphs[status.pindex][status.sindex].text.length > 0) {
    p = Coords.getParagraphElement(status.pindex)
    span = p.children[status.sindex]
    const [x, y] = Coords.getDocumentCoords(span, status.offset)
    if (left && y !== pos.y) {
      console.log('Offset repeat: Fix to end (going left)')
      pos.x = x
      pos.y = y
      return
    } else if (!left && nextY !== pos.y) {
      console.log('Offset repeat: Fix to start (going right)')
      pos.x = config.PARAGRAPH_PADDING
      pos.y = nextY
      if (nextPos.pindex !== status.pindex) {
        // Paragraphs must start at 0 offset
        status.offset = 0
        status.pindex = nextPos.pindex
        status.sindex = nextPos.sindex
      }
      return
    }
  }

  // Check next position for offset repeat
  if (nextY !== pos.y) {
    if (nextPos.pindex === status.pindex) {
      console.log('Offset repeat: Fix to start (going left)')
      pos.x = config.PARAGRAPH_PADDING
    } else {
      console.log('Offset repeat: Fix to end (new paragraph)')
      pos.x = nextX
      pos.y = nextY
    }
    status.offset = nextPos.offset
    status.pindex = nextPos.pindex
    status.sindex = nextPos.sindex
    return
  }

  // Default case
  pos.x = nextX
  pos.y = nextY
  status.offset = nextPos.offset
  status.pindex = nextPos.pindex
  status.sindex = nextPos.sindex
}

/**
 * Seeks the next line when moving up/down with arrow keys.
 */
function seekLine(
  up: boolean,
  paragraphs: Array<Array<TextNode>>,
  pos: Coordinates,
  status: Status
) {
  let p = Coords.getParagraphElement(status.pindex)
  let span = p.children[status.sindex]

  const originalY = pos.y

  // Check for offset repeat when going up
  if (up && paragraphs[status.pindex][status.sindex].text.length > 0) {
    const [x, y] = Coords.getDocumentCoords(span, status.offset)
    if (pos.y !== y) {
      // End of previous line
      pos.x = x
      pos.y = y
    }
  }

  /* Seek y */

  while (pos.y === originalY) {
    const nextStatus = moveOffset(up, paragraphs, status)

    if (nextStatus === null) {
      //up ? console.log('*Start of document*') : console.log('*End of document*')
      return
    }

    if (nextStatus.pindex !== status.pindex) {
      // New paragraph
      p = Coords.getParagraphElement(nextStatus.pindex)
      span = p.children[nextStatus.sindex] as HTMLElement
      // Empty paragraph
      if (paragraphs[nextStatus.pindex][nextStatus.sindex].text.length === 0) {
        pos.x = config.PARAGRAPH_PADDING
        pos.y = p.offsetTop + config.ADJUST_Y
        status.offset = 0
        status.pindex = nextStatus.pindex
        status.sindex = nextStatus.sindex
        return
      }
    } else if (nextStatus.sindex !== status.sindex) {
      // New span
      span = p.children[nextStatus.sindex] as HTMLElement
    }

    const [x, y] = Coords.getDocumentCoords(span, nextStatus.offset)

    status.offset = nextStatus.offset
    status.pindex = nextStatus.pindex
    status.sindex = nextStatus.sindex

    if (!up && y !== pos.y) {
      console.log('Fix to start')
      pos.x = config.PARAGRAPH_PADDING
      pos.y = y
      break
    }

    pos.x = x
    pos.y = y
  }
}

/**
 * Seeks the position closest to original caret position with respect to x.
 */
function seekPosition(
  up: boolean,
  paragraphs: Array<Array<TextNode>>,
  pos: Coordinates,
  status: Status,
  originalX: number
) {
  let p = Coords.getParagraphElement(status.pindex)
  let span = p.children[status.sindex]

  /* Seek x */

  let bestDiff = Math.abs(originalX - pos.x)

  while (true) {
    const nextStatus = moveOffset(up, paragraphs, status)

    if (nextStatus === null) {
      up ? console.log('*Start of document*') : console.log('*End of document*')
      return
    }

    if (nextStatus.pindex !== status.pindex) {
      // Empty paragraph
      console.log('Empty paragraph')
      return
    } else if (nextStatus.sindex !== status.sindex) {
      // New span
      span = p.children[nextStatus.sindex] as HTMLElement
    }

    const [x, y] = Coords.getDocumentCoords(span, nextStatus.offset)

    // Reached start/end of line
    if (y !== pos.y) {
      console.log('Stop at line start/end')
      if (up) {
        pos.x = config.PARAGRAPH_PADDING
        status.offset = nextStatus.offset
        status.sindex = nextStatus.sindex
      }
      break
    }

    // Update best difference
    const diff = Math.abs(originalX - x)
    if (diff <= bestDiff) {
      pos.x = x
      status.offset = nextStatus.offset
      status.sindex = nextStatus.sindex
      if (diff === bestDiff) {
        console.log('Same difference')
        break
      }
      bestDiff = diff
    } else {
      console.log('Break')
      break
    }

    // Reached start of paragraph
    if (up && nextStatus.offset === 0 && nextStatus.sindex === 0) {
      console.log('Stop at paragraph start')
      break
    }
  }
}

function calculateVertical(
  up: boolean,
  paragraphs: Array<Array<TextNode>>,
  pos: Coordinates,
  status: Status
): void {
  up ? console.log('Move up') : console.log('Move down')

  const originalX = pos.x

  seekLine(up, paragraphs, pos, status)
  seekPosition(up, paragraphs, pos, status, originalX)
}

export function calculateCaretPosition(
  direction: Direction,
  paragraphs: Array<Array<TextNode>>,
  caret: Caret,
  pindex: number,
  sindex: number
): Position {
  const pos: Coordinates = { x: caret.x, y: caret.y }
  const status: Status = { offset: caret.offset, pindex, sindex }

  console.log(' * * * CARET MOVEMENT * * * ')

  switch (direction) {
    case Direction.Up:
      calculateVertical(true, paragraphs, pos, status)
      break
    case Direction.Right:
      calculateHorizontal(false, paragraphs, pos, status)
      break
    case Direction.Down:
      calculateVertical(false, paragraphs, pos, status)
      break
    case Direction.Left:
      calculateHorizontal(true, paragraphs, pos, status)
      break
    case Direction.Write:
      moveAfterWrite(pos, status)
      break
    case Direction.Delete:
      moveAfterDelete(paragraphs, pos, status)
      break
    case Direction.NewLine:
      moveAfterNewline(paragraphs, pos, status)
      break
  }

  // TODO: Delete
  const oldPos: Position = {
    caret: { offset: status.offset, x: pos.x, y: pos.y },
    pindex: status.pindex,
    sindex: status.sindex
  }
  return oldPos
}
