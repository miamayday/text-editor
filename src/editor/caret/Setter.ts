/* Caret positioning to nearest character */

import * as Coords from './Coords'
import {
  TextNode,
  Caret,
  Mouse,
  Position,
  EditorState,
  SetterProps
} from '../Types'
import config from '../../config'

/**
 * Fixes the caret to the nearest span element (text node) in the paragraph.
 *
 * @param p Paragaph element (div)
 * @param arr Array of paragraphs (text node arrays)
 * @param offset focusOffset
 * @param clickX Mouse click x position
 * @param clickY Mouse click y position
 * @returns New state
 */
function fixToNearestSpan(
  p: HTMLElement,
  arr: Array<TextNode>,
  offset: number,
  clickX: number,
  clickY: number
): Position {
  const pos: Position = {
    caret: { offset, x: 0, y: 0 },
    pindex: 0,
    sindex: 0
  }

  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()

  const outOfBounds = checkBounds(
    p,
    arr,
    clickX,
    cont.left + config.PARAGRAPH_PADDING
  )

  if (outOfBounds && offset > 0) {
    console.log('snap to start')

    for (let si = 0; si < arr.length; si++) {
      const node = arr[si]
      let nextOffset = offset + 1
      let nextSindex = si
      if (node.text.length < nextOffset) {
        nextOffset = 0
        nextSindex = si + 1
      }

      const span = p.children[nextSindex]
      const rect = Coords.getRectFromRange(span.childNodes[0], nextOffset)
      const y = rect.top

      if (y <= clickY && clickY <= y + config.CARET_HEIGHT) {
        // on the same line
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.caret.y = rect.top - cont.top + d.scrollTop
        pos.sindex = si
        return pos
      } else if (y > clickY) {
        console.log('already past y')
        // WRONG!!
        break
      }
    }
  }

  let bestX = Number.MAX_VALUE
  let bestY = Number.MAX_VALUE
  let bestDiff = Number.MAX_VALUE
  let bestSindex = 0

  console.log('traverse spans containing offset')

  // traverse the spans that contain the offset
  for (let sindex = 0; sindex < arr.length; sindex++) {
    const node = arr[sindex]
    if (node.text.length === 0) {
      // happens with empty paragraphs
      console.log('empty paragraph')
      const x = cont.left + config.PARAGRAPH_PADDING
      const y = p.offsetTop + cont.top + d.scrollTop
      const diff = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2))
      if (diff < bestDiff) {
        bestX = x
        bestY = y
        bestDiff = diff
        bestSindex = 0
        pos.caret.x = config.PARAGRAPH_PADDING
        pos.caret.y = p.offsetTop + config.ADJUST_Y
        pos.caret.offset = 0
      }
      break
    } else if (node.text.length >= offset) {
      const span = p.children[sindex]
      const rect = Coords.getRectFromRange(span.childNodes[0], offset)
      const [x, y] = [rect.left, rect.top]

      // when surpass final bound just stop
      if (y > clickY) {
        const divider = y - config.ADJUST_Y
        console.log('divider:', divider)
        const finalBound = divider + config.LINE_HEIGHT
        if (y > finalBound) {
          // does it ever come to this??
          console.log('surpass final bound')
          break
        }
      }

      const diff = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2))
      if (diff < bestDiff) {
        bestX = x
        bestY = y
        bestDiff = diff
        bestSindex = sindex
        pos.caret.x = rect.left - cont.left
        pos.caret.y = rect.top - cont.top + d.scrollTop
      }
    }
  }

  pos.sindex = bestSindex
  return pos
}

/**
 * Checks if the user clicked on the empty space to the left of a line.
 *
 * @param p Paragraph element (div)
 * @param arr Array of paragraphs (text node arrays)
 * @param clickX Mouse click x position
 * @param start X coordinate for left text boundary
 * @returns True if user clicked on the empty space
 */
function checkBounds(
  p: Element,
  arr: Array<TextNode>,
  clickX: number,
  start: number
): boolean {
  if (arr[0].text.length >= 1) {
    // check the span has room
    const rect = Coords.getRectFromRange(p.children[0].childNodes[0], 1)
    const next = rect.left
    if (clickX < Coords.calcMiddle(start, next)) {
      // check the mouse coords are out of bounds (the mid x of first char)
      return true
    }
  } else if (arr.length > 1) {
    // check the next span has room
    const rect = Coords.getRectFromRange(p.children[1].childNodes[0], 0)
    const next = rect.left
    if (clickX < Coords.calcMiddle(start, next)) {
      // check the mouse coords are out of bounds (the mid x of first char)
      return true
    }
  }
  return false
}

export function setCaretForSpan(
  editor: EditorState,
  props: SetterProps
): Position {
  const pos: Position = {
    caret: {
      offset: props.offset,
      x: 0,
      y: 0
    },
    pindex: 0,
    sindex: 0
  }

  const attrPindex = props.el.getAttribute('p-index')!
  const attrSindex = props.el.getAttribute('s-index')!
  pos.pindex = Number(attrPindex)
  pos.sindex = Number(attrSindex)

  // known error: user clicks between two spans
  // > focusOffset is given correctly in the event
  // > element is not always given correctly
  // focusOffset may correspond to the previous element
  // this is why left node must be checked also

  let realX = 0 // x coordinate relative to the paragraph
  if (props.el.parentElement !== null) {
    const parent = props.el.parentElement
    console.log('parent:', parent)
    const bounds = parent.getBoundingClientRect()
    console.log('bounds:', bounds)
    realX = props.x - bounds.left
  }

  console.log('real.x:', realX)
  console.log('props.x:', props.x)

  let bestDiff = Number.MAX_VALUE

  if (props.offset <= props.length(pos.pindex, pos.sindex)) {
    ;[pos.caret.x, pos.caret.y] = Coords.getCoords(props.el, props.offset)
    console.log('caret.x:', pos.caret.x)
    bestDiff = Math.abs(pos.caret.x - realX)
    console.log('bestDiff:', bestDiff)
  }

  if (
    pos.sindex > 0 &&
    props.offset <= props.length(pos.pindex, pos.sindex - 1)
  ) {
    if (props.el.previousSibling !== null) {
      const prevSpan = props.el.previousSibling as HTMLElement // left node
      const [prevX, prevY] = Coords.getCoords(prevSpan, props.offset)
      console.log('prev.x:', prevX)
      const diff = Math.abs(prevX - realX)
      if (diff <= bestDiff) {
        // left node pos is closer to cursor
        console.log('> fix inaccuracies')
        pos.caret.x = prevX
        pos.caret.y = prevY
        pos.sindex--
      }
    }
  }

  const p = document.querySelectorAll('.paragraph')[pos.pindex]
  const arr = editor.paragraphs[pos.pindex]

  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()

  const outOfBounds = checkBounds(
    p,
    arr,
    props.x,
    cont.left + config.PARAGRAPH_PADDING
  )

  if (outOfBounds && props.offset > 0) {
    console.log('snap to start')
    let nextOffset = props.offset + 1
    if (nextOffset > arr[pos.sindex].text.length) {
      nextOffset = 0
      pos.sindex++
    }
    const span = p.children[pos.sindex]
    const rect = Coords.getRectFromRange(span.childNodes[0], nextOffset)
    pos.caret.x = config.PARAGRAPH_PADDING
    pos.caret.y = rect.top - cont.top + d.scrollTop
  }

  // fix offset
  if (props.offset === 0 && pos.sindex > 0) {
    console.log('fix offset')
    pos.caret.offset = props.length(pos.pindex, pos.sindex - 1)
    pos.sindex--
  }

  return pos
}

export function setCaretForParagraph(
  editor: EditorState,
  props: SetterProps
): Position {
  const attrPindex = props.el.getAttribute('p-index')!
  const pindex = Number(attrPindex)
  const paragraph = editor.paragraphs[pindex]
  return fixToNearestSpan(props.el, paragraph, props.offset, props.x, props.y)
}
