/* This file contains functionality for positioning the caret
   to the next position according to arrow keys.
   
   Rules:
   - When moving from end of line to the start of next:
     * If the next is a new span: repeat offset
     * If the next is a new paragraph: reset offset
   - When moving from start of line to the end of previous:
     * If the previous is a new span: repeat offset
     * If the previous is a new paragraph: set offset to end of previous
   
   Main function calculateCaretPosition is at the bottom. */

import * as Coords from './Coords'
import { Position, Caret, TextNode, Direction } from '../Types'
import { moveOffset } from './Helper'
import config from '../../config'

function moveAfterWrite(pos: Position): void {
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement
  const span = p.children[pos.sindex]
  const [x, y] = Coords.getDocumentCoords(span, pos.caret.offset)
  pos.caret.x = x
  pos.caret.y = y
}

function moveAfterDelete(
  paragraphs: Array<Array<TextNode>>,
  pos: Position
): void {
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement
  if (paragraphs[pos.pindex][pos.sindex].text.length === 0) {
    pos.caret.offset = 0
    pos.caret.x = config.PARAGRAPH_PADDING
    pos.caret.y = p.offsetTop + config.ADJUST_Y
    return
  }

  const span = p.children[pos.sindex]
  const [x, y] = Coords.getDocumentCoords(span, pos.caret.offset)
  pos.caret.x = x
  pos.caret.y = y
}

function moveAfterNewline(
  paragraphs: Array<Array<TextNode>>,
  pos: Position
): void {
  pos.pindex += 1
  pos.sindex = 0

  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement
  if (paragraphs[pos.pindex][pos.sindex].text.length !== 0) {
    const span = p.children[pos.sindex]
    const [x, y] = Coords.getDocumentCoords(span, 0)
    pos.caret.offset = 0
    pos.caret.x = x
    pos.caret.y = y
  }

  pos.caret.offset = 0
  pos.caret.x = config.PARAGRAPH_PADDING
  pos.caret.y = p.offsetTop + config.ADJUST_Y
}

function calculateHorizontal(
  left: boolean,
  paragraphs: Array<Array<TextNode>>,
  pos: Position
): void {
  left ? console.log('Move left') : console.log('Move right')

  const stump = {
    // TODO:
    offset: pos.caret.offset,
    pindex: pos.pindex,
    sindex: pos.sindex
  }
  const nextPos = moveOffset(left, paragraphs, stump)
  if (nextPos === null) {
    left ? console.log('*Start of document*') : console.log('*End of document*')
    return
  }

  // Next position is an empty paragraph
  if (paragraphs[nextPos.pindex][nextPos.sindex].text.length === 0) {
    console.log('Empty paragraph')
    const p = Coords.getParagraphElement(nextPos.pindex)
    pos.caret.x = config.PARAGRAPH_PADDING
    pos.caret.y = p.offsetTop + config.ADJUST_Y
    pos.caret.offset = nextPos.offset
    pos.pindex = nextPos.pindex
    pos.sindex = nextPos.sindex
    return
  }

  let p = Coords.getParagraphElement(nextPos.pindex)
  let span = p.children[nextPos.sindex]
  const [nextX, nextY] = Coords.getDocumentCoords(span, nextPos.offset)

  // Current paragraph is empty
  if (paragraphs[pos.pindex][pos.sindex].text.length === 0) {
    console.log('Move straight to next position')
    pos.caret.x = nextX
    pos.caret.y = nextY
    pos.caret.offset = nextPos.offset
    pos.pindex = nextPos.pindex
    pos.sindex = nextPos.sindex
    return
  }

  // Check current position for offset repeat
  if (paragraphs[pos.pindex][pos.sindex].text.length > 0) {
    p = Coords.getParagraphElement(pos.pindex)
    span = p.children[pos.sindex]
    const [x, y] = Coords.getDocumentCoords(span, pos.caret.offset)
    if (left && y !== pos.caret.y) {
      console.log('Offset repeat: Fix to end')
      pos.caret.x = x
      pos.caret.y = y
      return
    } else if (!left && nextY !== pos.caret.y) {
      console.log('Offset repeat: Fix to start')
      pos.caret.x = config.PARAGRAPH_PADDING
      pos.caret.y = nextY
      if (nextPos.pindex !== pos.pindex) {
        // Paragraphs must start at 0 offset
        pos.caret.offset = 0
        pos.pindex = nextPos.pindex
        pos.sindex = nextPos.sindex
      }
      return
    }
  }

  // Check next position for offset repeat
  if (nextY !== pos.caret.y) {
    if (nextPos.pindex === pos.pindex) {
      console.log('Offset repeat: Fix to start (new span)')
      pos.caret.x = config.PARAGRAPH_PADDING
    } else {
      console.log('Offset repeat: Fix to end (new paragraph)')
      pos.caret.x = nextX
      pos.caret.y = nextY
    }
    pos.caret.offset = nextPos.offset
    pos.pindex = nextPos.pindex
    pos.sindex = nextPos.sindex
    return
  }

  // Default case
  pos.caret.x = nextX
  pos.caret.y = nextY
  pos.caret.offset = nextPos.offset
  pos.pindex = nextPos.pindex
  pos.sindex = nextPos.sindex
}

/**
 * Seeks the next line when moving up/down with arrow keys.
 */
function seekLine(
  up: boolean,
  paragraphs: Array<Array<TextNode>>,
  pos: Position
) {
  let p = Coords.getParagraphElement(pos.pindex)
  let span = p.children[pos.sindex]

  const originalY = pos.caret.y

  // Check for offset repeat when going up
  if (up && paragraphs[pos.pindex][pos.sindex].text.length > 0) {
    const [x, y] = Coords.getDocumentCoords(span, pos.caret.offset)
    if (pos.caret.y !== y) {
      // End of previous line
      pos.caret.x = x
      pos.caret.y = y
    }
  }

  /* Seek y */

  while (pos.caret.y === originalY) {
    const stump = {
      // TODO:
      offset: pos.caret.offset,
      pindex: pos.pindex,
      sindex: pos.sindex
    }
    const nextPos = moveOffset(up, paragraphs, stump)

    if (nextPos === null) {
      //up ? console.log('*Start of document*') : console.log('*End of document*')
      return
    }

    if (nextPos.pindex !== pos.pindex) {
      // New paragraph
      p = Coords.getParagraphElement(nextPos.pindex)
      span = p.children[nextPos.sindex] as HTMLElement
      // Empty paragraph
      if (paragraphs[nextPos.pindex][nextPos.sindex].text.length === 0) {
        pos.caret.offset = 0
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.caret.y = p.offsetTop + config.ADJUST_Y
        pos.pindex = nextPos.pindex
        pos.sindex = nextPos.sindex
        return
      }
    } else if (nextPos.sindex !== pos.sindex) {
      // New span
      span = p.children[nextPos.sindex] as HTMLElement
    }

    const [x, y] = Coords.getDocumentCoords(span, nextPos.offset)

    pos.caret.offset = nextPos.offset
    pos.pindex = nextPos.pindex
    pos.sindex = nextPos.sindex

    if (!up && y !== pos.caret.y) {
      console.log('Fix to start')
      pos.caret.x = config.PARAGRAPH_PADDING
      pos.caret.y = y
      break
    }

    pos.caret.x = x
    pos.caret.y = y
  }
}

/**
 * Seeks the position closest to original caret position with respect to x.
 */
function seekPosition(
  up: boolean,
  paragraphs: Array<Array<TextNode>>,
  pos: Position,
  originalX: number
) {
  let p = Coords.getParagraphElement(pos.pindex)
  let span = p.children[pos.sindex]

  /* Seek x */

  let bestDiff = Math.abs(originalX - pos.caret.x)

  while (true) {
    const stump = {
      // TODO:
      offset: pos.caret.offset,
      pindex: pos.pindex,
      sindex: pos.sindex
    }
    const nextPos = moveOffset(up, paragraphs, stump)

    if (nextPos === null) {
      up ? console.log('*Start of document*') : console.log('*End of document*')
      return
    }

    if (nextPos.pindex !== pos.pindex) {
      // Empty paragraph
      console.log('Empty paragraph')
      return
    } else if (nextPos.sindex !== pos.sindex) {
      // New span
      span = p.children[nextPos.sindex] as HTMLElement
    }

    const [x, y] = Coords.getDocumentCoords(span, nextPos.offset)

    // Reached start/end of line
    if (y !== pos.caret.y) {
      console.log('Stop at line start/end')
      if (up) {
        pos.caret.offset = nextPos.offset
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.sindex = nextPos.sindex
      }
      break
    }

    // Update best difference
    const diff = Math.abs(originalX - x)
    if (diff <= bestDiff) {
      pos.caret.offset = nextPos.offset
      pos.caret.x = x
      pos.sindex = nextPos.sindex
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
    if (up && nextPos.offset === 0 && nextPos.sindex === 0) {
      console.log('Stop at paragraph start')
      break
    }
  }
}

function calculateVertical(
  up: boolean,
  paragraphs: Array<Array<TextNode>>,
  pos: Position
): void {
  up ? console.log('Move up') : console.log('Move down')

  const originalX = pos.caret.x

  seekLine(up, paragraphs, pos)

  seekPosition(up, paragraphs, pos, originalX)
}

export function calculateCaretPosition(
  direction: Direction,
  paragraphs: Array<Array<TextNode>>,
  caret: Caret,
  pindex: number,
  sindex: number
): Position {
  const pos: Position = {
    caret: { ...caret },
    pindex,
    sindex
  }

  console.log(' * * * CARET MOVEMENT * * * ')

  switch (direction) {
    case Direction.Up:
      calculateVertical(true, paragraphs, pos)
      break
    case Direction.Right:
      calculateHorizontal(false, paragraphs, pos)
      break
    case Direction.Down:
      calculateVertical(false, paragraphs, pos)
      break
    case Direction.Left:
      calculateHorizontal(true, paragraphs, pos)
      break
    case Direction.Write:
      moveAfterWrite(pos)
      break
    case Direction.Delete:
      moveAfterDelete(paragraphs, pos)
      break
    case Direction.NewLine:
      moveAfterNewline(paragraphs, pos)
      break
  }

  return pos
}
