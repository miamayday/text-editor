/* Caret movement with arrow keys */

import * as Coords from './Coords'
import { MoverProps, Position } from '../Types'
import { nextPosition, incrementOffset, decrementOffset } from './Helper'

const PARAGRAPH_PADDING = 100
const CARET_HEIGHT = 20
const LINE_HEIGHT = 34
const ADJUST_Y = (LINE_HEIGHT - CARET_HEIGHT) / 2

export function moveRight(props: MoverProps): Position {
  console.log('move right')

  const pos: Position = {
    caret: props.caret,
    pindex: props.pindex,
    sindex: props.sindex
  }

  const output = nextPosition(false, props)
  if (output === null) {
    console.log('end of document')
    return pos
  }

  const offset = output.offset
  pos.pindex = output.pindex
  pos.sindex = output.sindex
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement

  // next position is empty paragraph
  if (props.length(pos.pindex, pos.sindex) === 0) {
    pos.caret = {
      offset,
      x: PARAGRAPH_PADDING,
      y: p.offsetTop + ADJUST_Y
    }
    return pos
  }

  // next position is span (text node) with text
  const span = p.children[pos.sindex] as HTMLElement
  const [x, y] = Coords.getCoords(span, offset)

  if (pos.pindex === props.pindex) {
    // next position is next character from line start
    if (props.caret.x === PARAGRAPH_PADDING) {
      pos.caret = { offset, x, y }
      return pos
    }

    // same paragraph, fetch old coordinates
    const oldSpan = p.children[props.sindex]
    const oldCoords = Coords.getCoords(oldSpan, props.caret.offset)

    // next position is on the next line
    if (oldCoords[1] !== y) {
      console.log('end of line --> start of line')
      pos.caret = {
        offset: offset - 1, // same offset must repeat for endline and startline
        x: PARAGRAPH_PADDING,
        y
      }
      return pos
    }
  }

  pos.caret = { offset, x, y }
  return pos
}

export function moveLeft(props: MoverProps): Position {
  console.log('move left')

  const pos: Position = {
    caret: props.caret,
    pindex: props.pindex,
    sindex: props.sindex
  }

  const output = nextPosition(true, props)
  if (output === null) {
    console.log('start of document')
    return pos
  }

  const offset = output.offset
  pos.pindex = output.pindex
  pos.sindex = output.sindex
  const p = document.querySelectorAll('.paragraph')[pos.pindex] as HTMLElement

  // next position is empty paragraph
  if (props.length(pos.pindex, pos.sindex) === 0) {
    pos.caret = {
      offset,
      x: PARAGRAPH_PADDING,
      y: p.offsetTop + ADJUST_Y
    }
    return pos
  }

  // check old position
  if (props.length(props.pindex, props.sindex) !== 0) {
    const p = document.querySelectorAll('.paragraph')[
      props.pindex
    ] as HTMLElement
    const span = p.children[props.sindex] as HTMLElement
    const [realX, realY] = Coords.getCoords(span, props.caret.offset)
    if (realY !== props.caret.y) {
      console.log('start of line --> end of line')
      // coords have been manipulated
      // meaning we're at the start of a line
      // because start offset == prev end offset

      // now fix to end of prev line
      pos.caret = {
        offset: props.caret.offset,
        x: realX,
        y: realY
      }
      return pos
    }
  }

  // next position is span (text node) with text
  const span = p.children[pos.sindex] as HTMLElement
  const [x, y] = Coords.getCoords(span, offset)

  if (pos.pindex === props.pindex) {
    // next position is next character from line start
    if (props.caret.x === PARAGRAPH_PADDING) {
      pos.caret = { offset, x, y }
      return pos
    }

    // same paragraph, fetch old coordinates
    const oldSpan = p.children[props.sindex]
    const oldCoords = Coords.getCoords(oldSpan, props.caret.offset)

    // next position is line start
    if (oldCoords[1] !== y) {
      console.log('fix to start')
      pos.caret = {
        offset: offset + 1, // same offset must repeat for endline and startline
        x: PARAGRAPH_PADDING,
        y: props.caret.y
      }
      return pos
    }
  }

  pos.caret = { offset, x, y }
  return pos
}

export function moveUp(props: MoverProps): Position {
  console.log('move up')

  const caret = { ...props.caret }
  let pindex = props.pindex
  let sindex = props.sindex

  let p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement
  let span = p.children[sindex] as HTMLElement

  // not empty paragraph
  if (props.length(pindex, sindex) > 0) {
    console.log('check real coordinates')
    const realCoords = Coords.getCoords(span, caret.offset)
    if (realCoords[1] !== props.caret.y) {
      // coords have been manipulated
      // meaning we're at the start of a line
      // because start offset == prev end offset

      // now fix to end of prev line
      ;[caret.x, caret.y] = realCoords
    }
  }

  /* Seek y */

  console.log('seek y')

  while (caret.y === props.caret.y) {
    const output = decrementOffset(
      caret.offset,
      pindex,
      sindex,
      props.length,
      props.spanCount
    )

    if (output === null) {
      console.log('start of document')
      return { caret, pindex, sindex }
    }

    if (output.pindex !== pindex) {
      // new paragraph
      p = document.querySelectorAll('.paragraph')[output.pindex] as HTMLElement
      span = p.children[output.sindex] as HTMLElement

      if (props.length(output.pindex, output.sindex) === 0) {
        // empty paragraph
        caret.offset = 0
        caret.x = PARAGRAPH_PADDING
        caret.y = p.offsetTop + ADJUST_Y
        return {
          caret,
          pindex: output.pindex,
          sindex: output.sindex
        }
      }
    } else if (output.sindex !== sindex) {
      // new span
      span = p.children[output.sindex] as HTMLElement
    }

    const [x, y] = Coords.getCoords(span, output.offset)

    caret.offset = output.offset
    caret.x = x
    caret.y = y
    pindex = output.pindex
    sindex = output.sindex

    if (y !== props.caret.y) {
      break
    }
  }

  // TODO: retain memory of original caret x, so when jumping
  // blank lines try to get to the original pos
  // TODO: retain memory of curr span length

  let bestDiff = Math.abs(props.caret.x - caret.x)

  /* Seek x */

  console.log('seek x')

  while (true) {
    const output = decrementOffset(
      caret.offset,
      pindex,
      sindex,
      props.length,
      props.spanCount
    )

    // document start
    if (output === null) {
      caret.offset = 0
      caret.x = PARAGRAPH_PADDING
      sindex = 0
      break
    }

    if (output.sindex !== sindex) {
      // new span
      span = p.children[output.sindex] as HTMLElement
    }

    const [x, y] = Coords.getCoords(span, output.offset)

    // line start
    if (y !== caret.y) {
      caret.offset = output.offset
      caret.x = PARAGRAPH_PADDING
      sindex = output.sindex
      break
    }

    const diff = Math.abs(props.caret.x - x)
    if (diff <= bestDiff) {
      caret.offset = output.offset
      caret.x = x
      sindex = output.sindex
      if (diff === bestDiff) {
        break
      }
      bestDiff = diff
    } else {
      break
    }

    if (output.offset === 0 && output.sindex === 0) {
      console.log('break')
      break
    }
  }

  return { caret, pindex, sindex }
}

export function moveDown(props: MoverProps): Position {
  console.log('move down')

  const caret = { ...props.caret }
  let pindex = props.pindex
  let sindex = props.sindex

  let p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement
  let span = p.children[sindex] as HTMLElement

  /* Seek y */

  while (caret.y === props.caret.y) {
    const output = incrementOffset(
      caret.offset,
      pindex,
      sindex,
      props.length,
      props.spanCount,
      props.pCount
    )

    if (output === null) {
      console.log('end of document')
      return { caret, pindex, sindex }
    }

    if (output.pindex !== pindex) {
      // new paragraph
      p = document.querySelectorAll('.paragraph')[output.pindex] as HTMLElement
      span = p.children[output.sindex] as HTMLElement

      if (props.length(output.pindex, output.sindex) === 0) {
        // empty paragraph
        caret.offset = 0
        caret.x = PARAGRAPH_PADDING
        caret.y = p.offsetTop + ADJUST_Y
        return {
          caret,
          pindex: output.pindex,
          sindex: output.sindex
        }
      }
    } else if (output.sindex !== sindex) {
      // new span
      span = p.children[output.sindex] as HTMLElement
    }

    const [x, y] = Coords.getCoords(span, output.offset)

    pindex = output.pindex
    sindex = output.sindex

    if (y !== props.caret.y) {
      caret.x = PARAGRAPH_PADDING // snap to start of next line
      caret.y = y
      break
    }

    caret.offset = output.offset
    caret.x = x
    caret.y = y
  }

  let bestDiff = Math.abs(props.caret.x - caret.x)

  /* Seek x */

  while (true) {
    const output = incrementOffset(
      caret.offset,
      pindex,
      sindex,
      props.length,
      props.spanCount,
      props.pCount
    )

    // document end
    if (output === null) {
      break
    }

    if (output.sindex !== sindex) {
      // new span
      span = p.children[output.sindex] as HTMLElement
    }

    let [x, y] = Coords.getCoords(span, output.offset)

    if (y !== caret.y) {
      break
    }

    const diff = Math.abs(props.caret.x - x)
    if (diff <= bestDiff) {
      caret.offset = output.offset
      caret.x = x
      sindex = output.sindex
      if (diff === bestDiff) {
        break
      }
      bestDiff = diff
    } else {
      break
    }
  }

  return { caret, pindex, sindex }
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
    const caret = { offset: 0, x: PARAGRAPH_PADDING, y: p.offsetTop + ADJUST_Y }
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

  const caret = { offset: 0, x: PARAGRAPH_PADDING, y: p.offsetTop + ADJUST_Y }
  return { caret, pindex, sindex }
}
