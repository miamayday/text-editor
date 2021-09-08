/* Caret positioning to nearest character */

import * as Coords from './Coords'
import { TextNode, Caret, Mouse, EditorState, SetterProps } from '../Types'
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
): {
  caret: Caret
  mouse: Mouse
  sindex: number
} {
  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()

  const caret: Caret = { offset, x: 0, y: 0 }

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
        caret.x = config.PARAGRAPH_PADDING
        caret.y = rect.top - cont.top + d.scrollTop

        const mouse: Mouse = { x: cont.left + config.PARAGRAPH_PADDING, y }
        return { caret, mouse, sindex: si }
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
        caret.x = config.PARAGRAPH_PADDING
        caret.y = p.offsetTop + config.ADJUST_Y
        caret.offset = 0
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
        caret.x = rect.left - cont.left
        caret.y = rect.top - cont.top + d.scrollTop
      }
    }
  }

  const mouse: Mouse = { x: bestX, y: bestY }
  return { caret, mouse, sindex: bestSindex }
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
): Object | null {
  const attrPindex = props.el.getAttribute('p-index')
  const attrSindex = props.el.getAttribute('s-index')
  if (attrPindex !== null && attrSindex !== null) {
    let pindex = Number(attrPindex)
    let sindex = Number(attrSindex)

    const [x, y] = Coords.getCoords(props.el, props.offset)
    const caret = { offset: props.offset, x, y }

    const p = document.querySelectorAll('.paragraph')[pindex]
    const arr = editor.paragraphs[pindex]

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
      if (nextOffset > arr[sindex].text.length) {
        nextOffset = 0
        sindex++
      }
      const span = p.children[sindex]
      const rect = Coords.getRectFromRange(span.childNodes[0], nextOffset)
      caret.x = config.PARAGRAPH_PADDING
      caret.y = rect.top - cont.top + d.scrollTop
    }

    // fix offset
    if (props.offset === 0 && sindex > 0) {
      console.log('fix offset')
      caret.offset = props.length(pindex, sindex - 1)
      sindex--
    }

    const style = { ...arr[sindex].style }

    return {
      caret,
      mouse: undefined,
      pindex,
      sindex,
      style
    }
  }
  return null
}

export function setCaretForParagraph(
  editor: EditorState,
  props: SetterProps
): Object | null {
  const attrPindex = props.el.getAttribute('p-index')
  if (attrPindex === null) {
    return null
  }
  const pindex = Number(attrPindex)
  const paragraph = editor.paragraphs[pindex]
  const state = fixToNearestSpan(
    props.el,
    paragraph,
    props.offset,
    props.x,
    props.y
  )
  const style = { ...paragraph[state.sindex].style }
  return { ...state, pindex, style }
}
