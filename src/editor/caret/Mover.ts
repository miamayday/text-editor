/* This file contains functionality for positioning the caret
   to the next position according to arrow keys. */

import * as Coords from './Coords'
import { MoverProps, Position, Caret } from '../Types'
import { nextPosition } from './Helper'
import config from '../../config'

function checkOldPosition(props: MoverProps): Caret | null {
  const p = document.querySelectorAll('.paragraph')[props.pindex] as HTMLElement
  const span = p.children[props.sindex] as HTMLElement
  const [realX, realY] = Coords.getCoords(span, props.caret.offset)
  if (realY !== props.caret.y) {
    console.log('> fix to end')
    // coords have been manipulated
    // meaning we're at the start of a line
    // because start offset == prev end offset

    // now fix to end of prev line
    return {
      offset: props.caret.offset,
      x: realX,
      y: realY
    }
  }
  return null
}

/**
 * Moves caret left/right one space.
 *
 * Calculates new caret coordinates, offset, pindex, and sindex.
 *
 * @see checkOldPosition function in Mover.ts
 *
 * @param left Will the caret move one space left or right?
 * @param props Information related to caret position and document
 * @returns Position object containing new caret, pindex, and sindex
 */
export function moveHorizontal(left: boolean, props: MoverProps): Position {
  left ? console.log('move left') : console.log('move right')

  const pos: Position = {
    caret: { ...props.caret }, // remove object reference
    pindex: props.pindex,
    sindex: props.sindex
  }

  const output = nextPosition(left, props)
  if (output === null) {
    left ? console.log('*start of document*') : console.log('*end of document*')
    return pos
  }

  pos.caret.offset = output.offset
  pos.pindex = output.pindex
  pos.sindex = output.sindex
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement

  // next position is empty paragraph
  if (props.length(pos.pindex, pos.sindex) === 0) {
    pos.caret.x = config.PARAGRAPH_PADDING
    pos.caret.y = p.offsetTop + config.ADJUST_Y
    return pos
  }

  // check old position if going left
  if (left && props.length(props.pindex, props.sindex) > 0) {
    const caret = checkOldPosition(props)
    if (caret !== null) {
      pos.caret = caret
      return pos
    }
  }

  // next position is span (text node) with text
  const span = p.children[pos.sindex] as HTMLElement
  ;[pos.caret.x, pos.caret.y] = Coords.getCoords(span, pos.caret.offset)

  // check if next position is on the next line
  if (
    pos.pindex === props.pindex &&
    props.caret.x !== config.PARAGRAPH_PADDING
  ) {
    // same paragraph, fetch old coordinates
    const oldSpan = p.children[props.sindex]
    const oldY = Coords.getCoords(oldSpan, props.caret.offset)[1]

    // next position is on the next line
    if (oldY !== pos.caret.y) {
      console.log('> fix to start')
      pos.caret.x = config.PARAGRAPH_PADDING
      if (left) {
        pos.caret.y = props.caret.y
      } else {
        // same offset must repeat for endline and startline
        pos.caret.offset--
      }
      return pos
    }
  }

  return pos
}

/**
 * Moves caret up/down one line.
 *
 * Calculates new caret coordinates, offset, pindex, and sindex.
 *
 * @param up Will the caret move one line up or down?
 * @param props Information related to caret position and document
 * @returns Position object containing new caret, pindex, and sindex
 */
export function moveVertical(up: boolean, props: MoverProps): Position {
  up ? console.log('move up') : console.log('move down')

  const pos: Position = {
    caret: { ...props.caret }, // remove object reference
    pindex: props.pindex,
    sindex: props.sindex
  }

  let p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement
  let span = p.children[pos.sindex] as HTMLElement

  // skip to end of prev line (if possible) when moving up
  if (up && props.length(pos.pindex, pos.sindex) > 0) {
    const realCoords = Coords.getCoords(span, pos.caret.offset)
    if (realCoords[1] !== props.caret.y) {
      // coords have been manipulated
      // meaning we're at the start of a line
      // because start offset == prev end offset

      // now fix to end of prev line
      console.log('> fix to end')
      ;[pos.caret.x, pos.caret.y] = realCoords
    }
  }

  /* Seek y */

  console.log('> seek y')

  while (pos.caret.y === props.caret.y) {
    const output = nextPosition(up, {
      caret: { ...pos.caret }, // remove object reference
      pindex: pos.pindex,
      sindex: pos.sindex,
      length: props.length,
      spanCount: props.spanCount,
      pCount: props.pCount
    })

    if (output === null) {
      up ? console.log('*start of document*') : console.log('*end of document*')
      return pos
    }

    if (output.pindex !== pos.pindex) {
      // new paragraph
      p = document.querySelectorAll('.paragraph')[output.pindex] as HTMLElement
      span = p.children[output.sindex] as HTMLElement

      // empty paragraph
      if (props.length(output.pindex, output.sindex) === 0) {
        pos.caret.offset = 0
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.caret.y = p.offsetTop + config.ADJUST_Y
        pos.pindex = output.pindex
        pos.sindex = output.sindex
        return pos
      }
    } else if (output.sindex !== pos.sindex) {
      // new span
      span = p.children[output.sindex] as HTMLElement
    }

    const [x, y] = Coords.getCoords(span, output.offset)

    pos.caret.offset = output.offset
    pos.pindex = output.pindex
    pos.sindex = output.sindex

    if (!up && y !== pos.caret.y) {
      console.log('> fix to start')
      pos.caret.x = config.PARAGRAPH_PADDING
      pos.caret.y = y
      break
    }

    pos.caret.x = x
    pos.caret.y = y
  }

  let bestDiff = Math.abs(props.caret.x - pos.caret.x)

  /* Seek x */

  console.log('> seek x')

  while (true) {
    const output = nextPosition(up, {
      caret: { ...pos.caret }, // remove object reference
      pindex: pos.pindex,
      sindex: pos.sindex,
      length: props.length,
      spanCount: props.spanCount,
      pCount: props.pCount
    })

    // reached start/end of document
    if (output === null) {
      if (up) {
        pos.caret.offset = 0
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.sindex = 0
      }
      break
    }

    if (output.sindex !== pos.sindex) {
      // new span
      span = p.children[output.sindex] as HTMLElement
    }

    const [x, y] = Coords.getCoords(span, output.offset)

    // reached start/end of line
    if (y !== pos.caret.y) {
      if (up) {
        pos.caret.offset = output.offset
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.sindex = output.sindex
      }
      break
    }

    // update best difference
    const diff = Math.abs(props.caret.x - x)
    if (diff <= bestDiff) {
      pos.caret.offset = output.offset
      pos.caret.x = x
      pos.sindex = output.sindex
      if (diff === bestDiff) {
        console.log('> same diff')
        break
      }
      bestDiff = diff
    } else {
      console.log('> break')
      break
    }

    // reached start of paragraph
    if (up && output.offset === 0 && output.sindex === 0) {
      console.log('> stop at paragraph start')
      break
    }
  }

  return pos
}

export function moveAfterWrite(props: MoverProps): Position {
  const p = document.querySelectorAll('.paragraph')[props.pindex] as HTMLElement
  const span = p.children[props.sindex]
  const [x, y] = Coords.getCoords(span, props.caret.offset)
  const caret = { offset: props.caret.offset, x, y }
  return {
    caret,
    pindex: props.pindex,
    sindex: props.sindex
  }
}

export function moveAfterDelete(props: MoverProps): Position {
  const p = document.querySelectorAll('.paragraph')[props.pindex] as HTMLElement
  if (props.length(props.pindex, props.sindex) === 0) {
    const caret = {
      offset: 0,
      x: config.PARAGRAPH_PADDING,
      y: p.offsetTop + config.ADJUST_Y
    }
    return {
      caret,
      pindex: props.pindex,
      sindex: props.sindex
    }
  }

  const span = p.children[props.sindex]
  const [x, y] = Coords.getCoords(span, props.caret.offset)
  const caret = { offset: props.caret.offset, x, y }
  return {
    caret,
    pindex: props.pindex,
    sindex: props.sindex
  }
}

export function moveAfterNewline(props: MoverProps): Position {
  const pindex = props.pindex + 1
  const sindex = 0

  const p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement
  if (props.length(pindex, sindex) !== 0) {
    const span = p.children[sindex]
    const [x, y] = Coords.getCoords(span, 0)
    const caret = { offset: 0, x, y }
    return { caret, pindex, sindex }
  }

  const caret = {
    offset: 0,
    x: config.PARAGRAPH_PADDING,
    y: p.offsetTop + config.ADJUST_Y
  }
  return { caret, pindex, sindex }
}
