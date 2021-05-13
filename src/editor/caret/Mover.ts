/**
 * Caret movement with arrow keys
 */

import * as Coords from './Coords'
import { MoverProps } from '../Types'
import { incrementOffset, decrementOffset } from './Helper'

export function moveRight(props: MoverProps): Object {
  console.log('move right')
  const output = incrementOffset(
    props.caret.offset,
    props.pindex,
    props.sindex,
    props.length,
    props.spanCount,
    props.pCount
  )

  if (output === null) {
    return { direction: undefined }
  }

  const { offset, pindex, sindex } = output
  const p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement

  // empty paragraph
  if (props.length(pindex, sindex) === 0) {
    const caret = {
      offset,
      x: 100,
      y: p.offsetTop
    }
    return { caret, pindex, sindex, direction: undefined }
  }

  const span = p.children[sindex]
  const [x, y] = Coords.getCoords(span, offset)

  if (pindex === props.pindex) {
    const oldSpan = p.children[props.sindex]
    const oldCoords = Coords.getCoords(oldSpan, props.caret.offset)

    if (props.caret.x === 100) {
      const caret = { offset, x, y }
      return { caret, pindex, sindex, direction: undefined }
    }

    if (oldCoords[1] !== y) {
      // next line
      const caret = {
        offset: offset - 1, // same offset must repeat for endline and startline
        x: 100,
        y
      }
      return { caret, pindex, sindex, direction: undefined }
    }
  }

  const caret = { offset, x, y }
  return { caret, pindex, sindex, direction: undefined }
}

export function moveLeft(props: MoverProps): Object {
  console.log('move left')
  // not empty paragraph
  if (props.length(props.pindex, props.sindex) !== 0) {
    const p = document.querySelectorAll('.paragraph')[
      props.pindex
    ] as HTMLElement
    const span = p.children[props.sindex]
    const realCoords = Coords.getCoords(span, props.caret.offset)
    if (realCoords[1] !== props.caret.y) {
      // coords have been manipulated
      // meaning we're at the start of a line
      // because start offset == prev end offset

      // now fix to end of prev line
      const caret = {
        offset: props.caret.offset,
        x: realCoords[0],
        y: realCoords[1]
      }

      return {
        caret,
        pindex: props.pindex,
        sindex: props.sindex,
        direction: undefined
      }
    }
  }

  const output = decrementOffset(
    props.caret.offset,
    props.pindex,
    props.sindex,
    props.length,
    props.spanCount
  )

  if (output === null) {
    return { direction: undefined }
  }

  const { offset, pindex, sindex } = output
  const p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement

  // empty paragraph
  if (props.length(pindex, sindex) === 0) {
    const caret = {
      offset,
      x: 100,
      y: p.offsetTop
    }
    return { caret, pindex, sindex, direction: undefined }
  }

  const span = p.children[sindex]
  const [x, y] = Coords.getCoords(span, offset)

  if (pindex === props.pindex) {
    const oldSpan = p.children[props.sindex]
    const oldCoords = Coords.getCoords(oldSpan, props.caret.offset)

    if (props.caret.x === 100) {
      const caret = { offset, x, y }
      return { caret, pindex, sindex, direction: undefined }
    }

    if (oldCoords[1] !== y) {
      // previous line
      const caret = {
        offset: offset + 1, // same offset must repeat for endline and startline
        x: 100,
        y: props.caret.y
      }
      return { caret, pindex, sindex, direction: undefined }
    }
  }

  const caret = { offset, x, y }
  return { caret, pindex, sindex, direction: undefined }
}

export function moveUp(props: MoverProps): Object {
  console.log('move up')
  const caret = { ...props.caret }
  let pindex = props.pindex
  let sindex = props.sindex

  let p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement
  let span = p.children[sindex]

  // not empty paragraph
  if (props.length(pindex, sindex) !== 0) {
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

  while (caret.y === props.caret.y) {
    const output = decrementOffset(
      caret.offset,
      pindex,
      sindex,
      props.length,
      props.spanCount
    )

    if (output === null) {
      return { direction: undefined }
    }

    if (output.pindex !== pindex) {
      // new paragraph
      p = document.querySelectorAll('.paragraph')[output.pindex] as HTMLElement
      span = p.children[output.sindex]

      if (props.length(output.pindex, output.sindex) === 0) {
        // empty paragraph
        caret.offset = 0
        caret.x = 100
        caret.y = p.offsetTop
        return {
          caret,
          pindex: output.pindex,
          sindex: output.sindex,
          direction: undefined
        }
      }
    } else if (output.sindex !== sindex) {
      // new span
      span = p.children[output.sindex]
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
      caret.x = 100
      sindex = 0
      break
    }

    if (output.sindex !== sindex) {
      // new span
      span = p.children[output.sindex]
    }

    const [x, y] = Coords.getCoords(span, output.offset)

    // line start
    if (y !== caret.y) {
      caret.offset = output.offset
      caret.x = 100
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

  return { caret, pindex, sindex, direction: undefined }
}

export function moveDown(props: MoverProps): Object {
  console.log('move down')
  const caret = { ...props.caret }
  let pindex = props.pindex
  let sindex = props.sindex

  let p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement
  let span = p.children[sindex]

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
      return { direction: undefined }
    }

    if (output.pindex !== pindex) {
      // new paragraph
      p = document.querySelectorAll('.paragraph')[output.pindex] as HTMLElement
      span = p.children[output.sindex]

      if (props.length(output.pindex, output.sindex) === 0) {
        // empty paragraph
        caret.offset = 0
        caret.x = 100
        caret.y = p.offsetTop
        return {
          caret,
          pindex: output.pindex,
          sindex: output.sindex,
          direction: undefined
        }
      }
    } else if (output.sindex !== sindex) {
      // new span
      span = p.children[output.sindex]
    }

    const [x, y] = Coords.getCoords(span, output.offset)

    pindex = output.pindex
    sindex = output.sindex

    if (y !== props.caret.y) {
      caret.x = 100
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
      span = p.children[output.sindex]
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

  return { caret, pindex, sindex, direction: undefined }
}

export function moveAfterWrite(props: MoverProps): Object {
  const p = document.querySelectorAll('.paragraph')[props.pindex] as HTMLElement
  const span = p.children[props.sindex]
  const [x, y] = Coords.getCoords(span, props.caret.offset + 1)
  const caret = { offset: props.caret.offset + 1, x, y }
  return {
    caret,
    pindex: props.pindex,
    sindex: props.sindex,
    direction: undefined
  }
}

export function moveAfterDelete(props: MoverProps): Object {
  const p = document.querySelectorAll('.paragraph')[props.pindex] as HTMLElement
  if (props.length(props.pindex, props.sindex) === 0) {
    const caret = { offset: 0, x: 100, y: p.offsetTop }
    return {
      caret,
      pindex: props.pindex,
      sindex: props.sindex,
      direction: undefined
    }
  }

  const span = p.children[props.sindex]
  const [x, y] = Coords.getCoords(span, props.caret.offset)
  const caret = { offset: props.caret.offset, x, y }
  return {
    caret,
    pindex: props.pindex,
    sindex: props.sindex,
    direction: undefined
  }
}

export function moveAfterNewLine(props: MoverProps): Object {
  const pindex = props.pindex + 1
  const sindex = 0

  const p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement
  if (props.length(pindex, sindex) !== 0) {
    const span = p.children[sindex]
    const [x, y] = Coords.getCoords(span, 0)
    const caret = { offset: 0, x, y }
    return { caret, pindex, sindex, direction: undefined }
  }

  const caret = { offset: 0, x: 100, y: p.offsetTop }
  return { caret, pindex, sindex, direction: undefined }
}
