import * as Coords from './Coords'
import { TextNode, EditorState } from './Types'

export function incrementOffset(
  initialOffset: number,
  initialPindex: number,
  initialSindex: number,
  paragraphs: Array<Array<TextNode>>
): {
  offset: number
  pindex: number
  sindex: number
} | null {
  let offset = initialOffset + 1
  let pindex = initialPindex
  let sindex = initialSindex

  if (offset <= paragraphs[pindex][sindex].text.length) {
    return { offset, pindex, sindex }
  } else {
    // go to next span
    offset = 0
    sindex++
  }

  if (sindex < paragraphs[pindex].length) {
    return { offset, pindex, sindex }
  } else {
    // go to next paragraph
    pindex++
    sindex = 0
  }

  if (pindex < paragraphs.length) {
    return { offset, pindex, sindex }
  } else {
    // reach end of document
    return null
  }
}

export function decrementOffset(
  initialOffset: number,
  initialPindex: number,
  initialSindex: number,
  paragraphs: Array<Array<TextNode>>
): {
  offset: number
  pindex: number
  sindex: number
} | null {
  let offset = initialOffset - 1
  let pindex = initialPindex
  let sindex = initialSindex

  if (offset >= 0) {
    return { offset, pindex, sindex }
  } else {
    // go to previous span
    sindex--
  }

  if (sindex >= 0) {
    offset = paragraphs[pindex][sindex].text.length - 1
    return { offset, pindex, sindex }
  } else {
    // go to previous paragraph
    pindex--
  }

  if (pindex >= 0) {
    sindex = paragraphs[pindex].length - 1
    offset = paragraphs[pindex][sindex].text.length
    return { offset, pindex, sindex }
  } else {
    // reach start of document
    return null
  }
}

export function moveRight(editor: EditorState): Object {
  if (
    editor.caret === undefined ||
    editor.pindex === undefined ||
    editor.sindex === undefined
  ) {
    return { direction: undefined }
  }

  const output = incrementOffset(
    editor.caret.offset,
    editor.pindex,
    editor.sindex,
    editor.paragraphs
  )

  if (output === null) {
    return { direction: undefined }
  }

  const { offset, pindex, sindex } = output
  const p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement

  // empty paragraph
  if (editor.paragraphs[pindex][sindex].text.length === 0) {
    const caret = {
      offset,
      x: 100,
      y: p.offsetTop
    }
    return { caret, pindex, sindex, direction: undefined }
  }

  const span = p.children[sindex]
  const [x, y] = Coords.getCoords(span, offset)

  if (pindex === editor.pindex) {
    const oldSpan = p.children[editor.sindex]
    const oldCoords = Coords.getCoords(oldSpan, editor.caret.offset)

    if (editor.caret.x === 100) {
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

export function moveLeft(editor: EditorState): Object {
  if (
    editor.caret === undefined ||
    editor.pindex === undefined ||
    editor.sindex === undefined
  ) {
    return { direction: undefined }
  }

  const output = decrementOffset(
    editor.caret.offset,
    editor.pindex,
    editor.sindex,
    editor.paragraphs
  )

  if (output === null) {
    return { direction: undefined }
  }

  const { offset, pindex, sindex } = output
  const p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement

  // empty paragraph
  if (editor.paragraphs[pindex][sindex].text.length === 0) {
    const caret = {
      offset,
      x: 100,
      y: p.offsetTop
    }
    return { caret, pindex, sindex, direction: undefined }
  }

  const span = p.children[sindex]
  const [x, y] = Coords.getCoords(span, offset)

  if (pindex === editor.pindex) {
    const oldSpan = p.children[editor.sindex]
    const oldCoords = Coords.getCoords(oldSpan, editor.caret.offset)

    if (editor.caret.x === 100) {
      const caret = { offset, x, y }
      return { caret, pindex, sindex, direction: undefined }
    }

    if (oldCoords[1] !== y) {
      // previous line
      const caret = {
        offset: offset + 1, // same offset must repeat for endline and startline
        x: 100,
        y: editor.caret.y
      }
      return { caret, pindex, sindex, direction: undefined }
    }
  }

  const caret = { offset, x, y }
  return { caret, pindex, sindex, direction: undefined }
}

export function moveUp(editor: EditorState): Object {
  if (
    editor.caret === undefined ||
    editor.pindex === undefined ||
    editor.sindex === undefined
  ) {
    return { direction: undefined }
  }

  // TOTALLY REVAMP THIS
  // caret.x === 100 might not always work? some more dynamic solution...

  const caret = { ...editor.caret }
  let pindex = editor.pindex
  let sindex = editor.sindex

  let p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement
  let span = p.children[sindex]

  // not empty paragraph
  if (editor.paragraphs[pindex][sindex].text.length !== 0) {
    const realCoords = Coords.getCoords(span, caret.offset)
    if (realCoords[1] !== editor.caret.y) {
      // coords have been manipulated
      // meaning we're at the start of a line
      // because start offset == prev end offset

      // now fix to end of prev line
      ;[caret.x, caret.y] = realCoords
    }
  }

  // seek values
  let off = caret.offset
  let pi = pindex
  let si = sindex

  /* Seek y */

  while (caret.y === editor.caret.y) {
    const output = decrementOffset(off, pi, si, editor.paragraphs)
    if (output === null) {
      return { direction: undefined }
    }

    if (output.pindex !== pi) {
      // new paragraph
      p = document.querySelectorAll('.paragraph')[output.pindex] as HTMLElement
      span = p.children[output.sindex]

      if (editor.paragraphs[output.pindex][output.sindex].text.length === 0) {
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
    } else if (output.sindex !== si) {
      // new span
      span = p.children[output.sindex]
    }

    const [x, y] = Coords.getCoords(span, output.offset)
    if (y !== editor.caret.y) {
      caret.offset = output.offset
      caret.x = x
      caret.y = y
      pindex = output.pindex
      sindex = output.sindex
      break
    }

    off = output.offset
    pi = output.pindex
    si = output.sindex
  }

  // TODO: retain memory of original caret x, so when jumping
  // blank lines try to get to the original pos
  // TODO: retain memory of curr span length

  let bestDiff = Math.abs(editor.caret.x - caret.x)

  /* Seek x */

  while (true) {
    const output = decrementOffset(
      caret.offset,
      pindex,
      sindex,
      editor.paragraphs
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

    let [x, y] = Coords.getCoords(span, output.offset)

    if (y !== caret.y) {
      caret.offset = output.offset
      caret.x = 100
      sindex = output.sindex
      break
    }

    const diff = Math.abs(editor.caret.x - x)
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

export function moveDown(editor: EditorState): Object {
  if (
    editor.caret === undefined ||
    editor.pindex === undefined ||
    editor.sindex === undefined
  ) {
    return { direction: undefined }
  }

  const caret = { ...editor.caret }

  let pindex = editor.pindex
  let sindex = editor.sindex

  // TODO: retain memory of original caret x, so when jumping
  // blank lines try to get to the original pos
  // TODO: retain memory of curr span length

  let p = document.querySelectorAll('.paragraph')[pindex] as HTMLElement
  let span = p.children[sindex]

  // seek y
  while (true) {
    const output = incrementOffset(
      caret.offset,
      pindex,
      sindex,
      editor.paragraphs
    )

    if (output === null) {
      return { direction: undefined }
    }

    if (output.pindex !== pindex) {
      // new paragraph
      p = document.querySelectorAll('.paragraph')[output.pindex] as HTMLElement
      span = p.children[output.sindex]

      if (editor.paragraphs[output.pindex][output.sindex].text.length === 0) {
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
    if (y !== editor.caret.y) {
      caret.x = 100
      caret.y = y
      break
    } else {
      caret.offset = output.offset
      pindex = output.pindex
      sindex = output.sindex
    }
  }

  let bestDiff = Math.abs(editor.caret.x - caret.x)
  let bestSindex = sindex

  // seek x
  while (true) {
    const output = incrementOffset(
      caret.offset,
      pindex,
      sindex,
      editor.paragraphs
    )

    if (output === null) {
      return { direction: undefined }
    }

    if (output.sindex !== sindex) {
      // new span
      span = p.children[output.sindex]
    }

    const [x, y] = Coords.getCoords(span, output.offset)

    const diff = Math.abs(editor.caret.x - x)
    if (diff < bestDiff) {
      caret.offset = output.offset
      caret.x = x
      bestDiff = diff
      bestSindex = sindex
      sindex = output.sindex
    } else {
      break
    }
  }

  return { caret, pindex, sindex: bestSindex, direction: undefined }
}
