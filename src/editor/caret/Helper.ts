/* Helper functions used by Setter.ts and Mover.ts */

import { TextNode, Status } from '../Types'

// TODO:
class OffsetIterator {
  private paragraphs: Array<Array<TextNode>>
  private offset: number = 0
  private pindex: number = 0
  private sindex: number = 0

  private slen: number = 0
  private plen: number = 0

  constructor(paragraphs: Array<Array<TextNode>>, status: Status) {
    this.paragraphs = paragraphs
    this.offset = status.offset
    this.pindex = status.pindex
    this.sindex = status.sindex

    const p = paragraphs[status.pindex]
    const s = p[status.sindex]
    this.slen = s.text.length
    this.plen = p.length
  }

  public left(): number {
    return this.offset
  }

  public right(): number {
    return this.offset
  }
}

function incrementOffset(
  paragraphs: Array<Array<TextNode>>,
  status: Status
): Status | null {
  let offset = status.offset + 1
  let pindex = status.pindex
  let sindex = status.sindex

  if (offset <= paragraphs[pindex][sindex].text.length) {
    return { offset, pindex, sindex }
  } else {
    // Go to next span
    offset = 1
    sindex++
  }

  if (sindex < paragraphs[pindex].length) {
    return { offset, pindex, sindex }
  } else {
    // Go to next paragraph
    pindex++
    sindex = 0
    offset = 0
  }

  if (pindex < paragraphs.length) {
    return { offset, pindex, sindex }
  } else {
    // Reach end of document
    return null
  }
}

function decrementOffset(
  paragraphs: Array<Array<TextNode>>,
  status: Status
): Status | null {
  let offset = status.offset - 1
  let pindex = status.pindex
  let sindex = status.sindex

  if (offset >= 1 || (offset >= 0 && sindex === 0)) {
    return { offset, pindex, sindex }
  } else {
    // Go to previous span
    sindex--
  }

  if (sindex >= 0) {
    offset = paragraphs[pindex][sindex].text.length
    return { offset, pindex, sindex }
  } else {
    // Go to previous paragraph
    pindex--
  }

  if (pindex >= 0) {
    sindex = paragraphs[pindex].length - 1
    offset = paragraphs[pindex][sindex].text.length
    return { offset, pindex, sindex }
  } else {
    // Reach start of document
    return null
  }
}

/**
 * Shifts offset left/right by one increment.
 * @param left Move offset left/right
 * @param paragraphs Paragraphs in the editor
 * @param pos Current position
 * @returns Newly calculated position, excluding xy coordinates
 */
export function moveOffset(
  left: boolean,
  paragraphs: Array<Array<TextNode>>,
  status: Status
): Status | null {
  if (left) {
    return decrementOffset(paragraphs, status)
  } else {
    return incrementOffset(paragraphs, status)
  }
}
