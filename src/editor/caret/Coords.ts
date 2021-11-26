/* Helpful functions for computing caret coordinates */

export function calcMiddle(x1: number, x2: number) {
  return x1 + (x2 - x1) / 2
}

export function getRectFromRange(node: Node, offset: number): DOMRect {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse()
  return range.getBoundingClientRect()
}

export function getViewportCoords(
  span: Element,
  offset: number
): [number, number] {
  const rect = getRectFromRange(span.childNodes[0], offset)
  const x = rect.left
  const y = rect.top
  return [x, y]
}

export function getDocumentCoords(
  span: Element,
  offset: number
): [number, number] {
  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()
  let [x, y] = getViewportCoords(span, offset)
  x = x - cont.left
  y = y - cont.top + d.scrollTop
  return [x, y]
}

export function getCoords(span: Element, offset: number): [number, number] {
  const rect = getRectFromRange(span.childNodes[0], offset)
  const d = document.querySelectorAll('.document')[0]
  const cont = d.getBoundingClientRect()
  const x = rect.left - cont.left
  const y = rect.top - cont.top + d.scrollTop
  return [x, y]
}
