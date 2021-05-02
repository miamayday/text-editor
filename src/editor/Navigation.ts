import { TextNode } from '../Document'
import * as Coords from './Coords'
import * as Type from './Types'

type State = {
  caret: Type.Caret
  mouse: Type.Mouse
  sindex: number
}

export function fixToNearestSpan(
  p: HTMLElement,
  paragraph: Array<TextNode>,
  offset: number,
  pageX: number,
  pageY: number
): State {
  const caret: Type.Caret = { offset, x: 0, y: 0 }

  let bestX = Number.MAX_VALUE
  let bestY = Number.MAX_VALUE
  let bestDiff = Number.MAX_VALUE
  let bestSindex = 0

  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()

  for (let sindex = 0; sindex < paragraph.length; sindex++) {
    const node = paragraph[sindex]
    if (node.text.length >= offset) {
      const span = p.children[sindex]
      const rect = Coords.getRectFromRange(span.childNodes[0], offset)
      const [x, y] = [rect.left, rect.top]

      // TODO: when surpass y just stop

      const diff = Math.sqrt(Math.pow(pageX - x, 2) + Math.pow(pageY - y, 2))
      if (diff < bestDiff) {
        bestX = x
        bestY = y
        bestDiff = diff
        bestSindex = sindex
        caret.x = Coords.calcLeft(rect.left - cont.left)
        caret.y = Coords.calcTop(rect.top - cont.top + d.scrollTop)
      }
    } else if (node.text.length === 0) {
      const x = cont.left + 100 // margin
      const y = p.offsetTop + cont.top + d.scrollTop + 4 // (28 - 20) / 2
      const diff = Math.sqrt(Math.pow(pageX - x, 2) + Math.pow(pageY - y, 2))
      if (diff < bestDiff) {
        bestX = x
        bestY = y
        bestDiff = diff
        bestSindex = 0
        caret.x = 100
        caret.y = p.offsetTop
      }
    }
  }

  const mouse: Type.Mouse = { x: bestX, y: bestY }
  return { caret, mouse, sindex: bestSindex }
}
