/* This file contains functionality for editing paragraphs.

   Possible actions:
   - Write
   - Delete
   - Newline
   
   Main function editParagraphs is at the bottom. */

import {
  WriterProps,
  TextNode,
  Style,
  Direction,
  Caret,
  Action,
  Position
} from './Types'

function stylesMatch(s1: Style, s2: Style): Boolean {
  return s1.bold === s2.bold && s1.italic === s2.italic
}

/**
 * Writes one character in the current position.
 *
 * @param props Caret position and paragraphs
 * @param key Character to be written
 * @param style Styling of the text node
 * @returns New state and a Direction
 */
export function Write(
  props: WriterProps,
  key: string,
  style: Style
): {
  caret: Caret
  sindex: number
  paragraphs: Array<Array<TextNode>>
  direction: Direction
} {
  const out = {
    caret: { ...props.caret },
    sindex: props.sindex,
    paragraphs: props.paragraphs,
    direction: Direction.Write
  }

  const paragraph = props.paragraphs[props.pindex]
  const node = paragraph[props.sindex]

  if (stylesMatch(node.style, style)) {
    const text = [
      node.text.slice(0, out.caret.offset),
      key, // add new character
      node.text.slice(out.caret.offset)
    ].join('')
    node.text = text
    out.caret.offset++
    return out
  }

  console.log('styles are different')

  const newNode: TextNode = { style, text: key }

  if (
    out.sindex + 1 < paragraph.length &&
    out.caret.offset === node.text.length
  ) {
    const next = paragraph[out.sindex + 1]
    if (stylesMatch(next.style, style)) {
      // merge with next node
      console.log('merge with next node')
      const next = paragraph[out.sindex + 1]
      const text = [next.text.slice(0, 1), key, next.text.slice(1)].join('')
      paragraph[out.sindex + 1].text = text // update next node
    } else {
      // insert new node with different style
      console.log('insert new node with different style')
      paragraph.splice(out.sindex + 1, 0, newNode)
    }
  } else if (out.caret.offset < node.text.length) {
    // split the current node and insert new
    console.log('split the current node and insert new')
    const text = node.text
    const head = text.slice(0, out.caret.offset)
    const tail = text.slice(out.caret.offset)

    const rightNode: TextNode = { style: node.style, text: tail }

    node.text = head
    paragraph.splice(out.sindex + 1, 0, newNode)
    paragraph.splice(out.sindex + 2, 0, rightNode)
  } else {
    // add new node to the end
    console.log('add new node to the end')
    paragraph.push(newNode)
  }

  out.caret.offset = 1
  out.sindex++
  return out
}

export function Delete(props: WriterProps): Object | null {
  if (props.caret.offset === 0 && props.pindex === 0 && props.sindex === 0) {
    // document start
    return null
  }

  /* Paragraph deletion */

  if (props.caret.offset === 0 && props.sindex === 0) {
    // paragraph start
    const left = props.paragraphs[props.pindex - 1]
    const right = props.paragraphs[props.pindex]

    const leftNode = left[left.length - 1]
    const rightNode = right[0]

    // left orig values
    const textLength = leftNode.text.length
    const spanCount = left.length

    if (textLength === 0) {
      // left is empty: right dominates left
      props.paragraphs[props.pindex - 1] = right
      props.paragraphs.splice(props.pindex, 1)
      console.log('right dominates left')
      return {
        caret: { ...props.caret, offset: 0 },
        pindex: props.pindex - 1,
        sindex: props.sindex,
        paragraphs: props.paragraphs,
        direction: Direction.Delete
      }
    } else if (rightNode.text.length === 0) {
      // right is empty: left dominates right
      props.paragraphs.splice(props.pindex, 1)
      console.log('left dominates right')
      return {
        caret: { ...props.caret, offset: textLength },
        pindex: props.pindex - 1,
        sindex: spanCount - 1,
        paragraphs: props.paragraphs,
        direction: Direction.Delete
      }
    }

    // combine spans if they are of the same style
    if (leftNode.style === rightNode.style) {
      leftNode.text = leftNode.text.concat(rightNode.text)
      if (right.length > 1) {
        right.splice(0, 1)
        left.push(...right)
      }
      props.paragraphs.splice(props.pindex, 1)
      console.log('combine spans')
      return {
        caret: { ...props.caret, offset: textLength },
        pindex: props.pindex - 1,
        sindex: spanCount - 1,
        paragraphs: props.paragraphs,
        direction: Direction.Delete
      }
    }

    // combine paragraphs only
    left.push(...right)
    props.paragraphs.splice(props.pindex, 1)
    console.log('combine paragraphs')
    return {
      caret: { ...props.caret, offset: textLength },
      pindex: props.pindex - 1,
      sindex: spanCount - 1,
      paragraphs: props.paragraphs,
      direction: Direction.Delete
    }
  }

  /* Span deletion */

  const node = props.paragraphs[props.pindex][props.sindex]
  const text = [
    node.text.slice(0, props.caret.offset - 1),
    node.text.slice(props.caret.offset)
  ].join('')

  if (text.length === 0 && props.sindex > 0) {
    // delete node
    props.paragraphs[props.pindex].splice(props.sindex, 1)
    console.log('delete node')
    return {
      caret: {
        ...props.caret,
        offset: props.paragraphs[props.pindex][props.sindex - 1].text.length
      },
      pindex: props.pindex,
      sindex: props.sindex - 1,
      paragraphs: props.paragraphs,
      direction: Direction.Delete
    }
  }

  props.paragraphs[props.pindex][props.sindex].text = text
  props.caret.offset--
  if (props.caret.offset < 1 && props.sindex > 0) {
    console.log('adjust placement')
    props.caret.offset =
      props.paragraphs[props.pindex][props.sindex - 1].text.length
    props.sindex--
  } else if (
    props.caret.offset === 0 &&
    props.paragraphs[props.pindex].length > 1
  ) {
    console.log('delete preceding span')
    props.paragraphs[props.pindex].splice(0, 1)
  }

  return {
    caret: props.caret,
    pindex: props.pindex,
    sindex: props.sindex,
    paragraphs: props.paragraphs,
    direction: Direction.Delete
  }
}

export function Newline(props: WriterProps): {
  paragraphs: Array<Array<TextNode>>
  direction: Direction
} {
  console.log('new line:', props)

  const paragraph = props.paragraphs[props.pindex]
  const node = paragraph[props.sindex]
  const text = node.text
  const head = text.slice(0, props.caret.offset)
  const tail = text.slice(props.caret.offset)

  // copy paragraph
  const newParagraph: Array<TextNode> = []
  for (let i = props.sindex; i < paragraph.length; i++) {
    newParagraph.push(paragraph[i])
  }

  // copy node
  const style: Style = { ...node.style }
  const newNode: TextNode = { style, text: tail }
  newParagraph[0] = newNode

  paragraph[props.sindex].text = head
  paragraph.length = props.sindex + 1

  const paragraphs = props.paragraphs
  paragraphs[props.pindex] = paragraph
  paragraphs.splice(props.pindex + 1, 0, newParagraph)

  return { paragraphs, direction: Direction.NewLine }
}

// TODO: REPLACEMENT FUNCTIONS

function WriteNew(
  paragraphs: Array<Array<TextNode>>,
  pos: Position,
  key: string,
  style: Style
): void {
  const paragraph = paragraphs[pos.pindex]
  const node = paragraph[pos.sindex]

  if (stylesMatch(node.style, style)) {
    const text = [
      node.text.slice(0, pos.caret.offset),
      key, // Add new character
      node.text.slice(pos.caret.offset)
    ].join('')
    node.text = text
    pos.caret.offset++
    return
  }

  console.log('Styles are different')

  const newNode: TextNode = { style, text: key }

  if (
    pos.sindex + 1 < paragraph.length &&
    pos.caret.offset === node.text.length
  ) {
    const next = paragraph[pos.sindex + 1]
    if (stylesMatch(next.style, style)) {
      // Merge with next node
      console.log('Merge with next node')
      const next = paragraph[pos.sindex + 1]
      const text = [next.text.slice(0, 1), key, next.text.slice(1)].join('')
      paragraph[pos.sindex + 1].text = text // Update next node
    } else {
      // Insert new node with different style
      console.log('Insert new node with different style')
      paragraph.splice(pos.sindex + 1, 0, newNode)
    }
  } else if (pos.caret.offset < node.text.length) {
    // Split the current node and insert new
    console.log('Split the current node and insert new')
    const text = node.text
    const head = text.slice(0, pos.caret.offset)
    const tail = text.slice(pos.caret.offset)

    const rightNode: TextNode = { style: node.style, text: tail }

    node.text = head
    paragraph.splice(pos.sindex + 1, 0, newNode)
    paragraph.splice(pos.sindex + 2, 0, rightNode)
  } else {
    // Add new node to the end
    console.log('Add new node to the end')
    paragraph.push(newNode)
  }

  pos.caret.offset = 1
  pos.sindex++
}

function DeleteNew(paragraphs: Array<Array<TextNode>>, pos: Position): void {
  if (pos.caret.offset === 0 && pos.pindex === 0 && pos.sindex === 0) {
    // Document start
    return
  }

  /* Paragraph deletion */

  if (pos.caret.offset === 0 && pos.sindex === 0) {
    // Paragraph start
    const left = paragraphs[pos.pindex - 1]
    const right = paragraphs[pos.pindex]

    const leftNode = left[left.length - 1]
    const rightNode = right[0]

    // Left orig values
    const textLength = leftNode.text.length
    const spanCount = left.length

    if (textLength === 0) {
      // Left is empty: right dominates left
      paragraphs[pos.pindex - 1] = right
      paragraphs.splice(pos.pindex, 1)
      console.log('Right dominates left')
      pos.caret.offset = 0
      pos.pindex -= 1
      return
    } else if (rightNode.text.length === 0) {
      // Right is empty: left dominates right
      paragraphs.splice(pos.pindex, 1)
      console.log('Left dominates right')
      pos.caret.offset = textLength
      pos.pindex -= 1
      pos.sindex = spanCount - 1
      return
    }

    // Combine spans if they are of the same style
    if (leftNode.style === rightNode.style) {
      leftNode.text = leftNode.text.concat(rightNode.text)
      if (right.length > 1) {
        right.splice(0, 1)
        left.push(...right)
      }
      paragraphs.splice(pos.pindex, 1)
      console.log('Combine spans')
      pos.caret.offset = textLength
      pos.pindex -= 1
      pos.sindex = spanCount - 1
      return
    }

    // Combine paragraphs only
    left.push(...right)
    paragraphs.splice(pos.pindex, 1)
    console.log('Combine paragraphs')
    pos.caret.offset = textLength
    pos.pindex -= 1
    pos.sindex = spanCount - 1
    return
  }

  /* Span deletion */

  const node = paragraphs[pos.pindex][pos.sindex]
  const text = [
    node.text.slice(0, pos.caret.offset - 1),
    node.text.slice(pos.caret.offset)
  ].join('')

  if (text.length === 0 && pos.sindex > 0) {
    // Delete node
    paragraphs[pos.pindex].splice(pos.sindex, 1)
    console.log('dDlete node')
    pos.caret.offset = paragraphs[pos.pindex][pos.sindex - 1].text.length
    pos.sindex -= 1
    return
  }

  paragraphs[pos.pindex][pos.sindex].text = text
  pos.caret.offset--
  if (pos.caret.offset < 1 && pos.sindex > 0) {
    console.log('Adjust placement')
    pos.caret.offset = paragraphs[pos.pindex][pos.sindex - 1].text.length
    pos.sindex--
  } else if (pos.caret.offset === 0 && paragraphs[pos.pindex].length > 1) {
    console.log('Delete preceding span')
    paragraphs[pos.pindex].splice(0, 1)
  }
}

function NewlineNew(paragraphs: Array<Array<TextNode>>, pos: Position): void {
  console.log('New line:', pos)

  const paragraph = paragraphs[pos.pindex]
  const node = paragraph[pos.sindex]
  const text = node.text
  const head = text.slice(0, pos.caret.offset)
  const tail = text.slice(pos.caret.offset)

  // Copy paragraph
  const newParagraph: Array<TextNode> = []
  for (let i = pos.sindex; i < paragraph.length; i++) {
    newParagraph.push(paragraph[i])
  }

  // Copy node
  const style: Style = { ...node.style }
  const newNode: TextNode = { style, text: tail }
  newParagraph[0] = newNode

  paragraph[pos.sindex].text = head
  paragraph.length = pos.sindex + 1

  paragraphs[pos.pindex] = paragraph
  paragraphs.splice(pos.pindex + 1, 0, newParagraph)
}

export function editParagraphs(
  action: Action,
  paragraphs: Array<Array<TextNode>>,
  pos: Position,
  key?: string,
  style?: Style
): {
  paragraphs: Array<Array<TextNode>>
  pos: Position
  direction: Direction
} {
  console.log(' * * * EDITING * * * ')

  let direction: Direction

  switch (action) {
    case Action.Write:
      WriteNew(paragraphs, pos, key!, style!)
      direction = Direction.Write
      break
    case Action.Delete:
      DeleteNew(paragraphs, pos)
      direction = Direction.Delete
      break
    case Action.NewLine:
      NewlineNew(paragraphs, pos)
      direction = Direction.NewLine
      break
  }

  return { paragraphs, pos, direction }
}
