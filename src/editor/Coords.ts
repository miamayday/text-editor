/* Coords.ts
   - helpful functions for computing caret coordinates
*/

export function calcLeft(left: number): number {
  return left - 2
}

export function calcTop(top: number): number {
  return top - 5
}

export function calcMiddle(x1: number, x2: number) {
  return x1 + (x2 - x1) / 2
}

export function getRectFromRange(node: Node, offset: number): DOMRect {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse()
  return range.getBoundingClientRect()
}

export function getCoords(span: Element, offset: number): [number, number] {
  const rect = getRectFromRange(span.childNodes[0], offset)
  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()
  const x = calcLeft(rect.left - cont.left)
  const y = calcTop(rect.top - cont.top + d.scrollTop)
  return [x, y]
}
