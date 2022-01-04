/* This file contains functionality for editing paragraphs.

   Possible actions:
   - Write
   - Delete
   - Newline
   
   Main function editParagraphs is at the bottom. */

import { TextNode, Style, Direction, Action, Status } from './Types'

function stylesMatch(s1: Style, s2: Style): Boolean {
  return s1.bold === s2.bold && s1.italic === s2.italic
}

export function writeCharacter(
  paragraphs: Array<Array<TextNode>>,
  status: Status,
  key: string,
  style: Style
): void {
  const paragraph = paragraphs[status.pindex]
  const node = paragraph[status.sindex]

  if (stylesMatch(node.style, style)) {
    console.log('Styles match')
    const text = [
      node.text.slice(0, status.offset),
      key, // Add new character
      node.text.slice(status.offset)
    ].join('')
    node.text = text
    status.offset++
    return
  }

  console.log('Styles are different')

  const newNode: TextNode = { style, text: key }

  if (
    status.sindex + 1 < paragraph.length &&
    status.offset === node.text.length
  ) {
    const next = paragraph[status.sindex + 1]
    if (stylesMatch(next.style, style)) {
      console.log('Merge with next node')
      const next = paragraph[status.sindex + 1]
      const text = key.concat(next.text)
      paragraph[status.sindex + 1].text = text // Update next node
    } else {
      console.log('Insert new node to the end of a node')
      paragraph.splice(status.sindex + 1, 0, newNode)
    }
  } else if (status.offset < node.text.length) {
    console.log('Split the current node and insert new')
    const text = node.text
    const head = text.slice(0, status.offset)
    const tail = text.slice(status.offset)

    const rightNode: TextNode = { style: node.style, text: tail }

    node.text = head
    paragraph.splice(status.sindex + 1, 0, newNode)
    paragraph.splice(status.sindex + 2, 0, rightNode)
  } else if (node.text.length > 0) {
    console.log('Add new node to the end to the end of a paragraph')
    paragraph.push(newNode)
  } else {
    console.log('Write to an empty paragraph')
    node.text = key
    status.offset = 1
    status.sindex = 0
    // Adopt the editor style
    node.style.bold = style.bold
    node.style.italic = style.italic
    return
  }

  // Since it's a new node within the same paragraph:
  // * Reset offset to 1
  // * Increment span index
  status.offset = 1
  status.sindex++
}

function deleteAcrossParagraphs(
  paragraphs: Array<Array<TextNode>>,
  status: Status
): void {
  const prevParagraph = paragraphs[status.pindex - 1]
  const prevNode = prevParagraph[prevParagraph.length - 1]
  const prevNodeTextLength = prevNode.text.length
  const prevParagraphLength = prevParagraph.length

  const currParagraph = paragraphs[status.pindex]
  const currNode = currParagraph[0]

  if (prevNodeTextLength === 0) {
    paragraphs[status.pindex - 1] = currParagraph
    paragraphs.splice(status.pindex, 1)
    console.log('Curr dominates prev')
    status.pindex--
    return
  } else if (currNode.text.length === 0) {
    paragraphs.splice(status.pindex, 1)
    console.log('Prev dominates curr')
    status.offset = prevNodeTextLength
    status.pindex--
    status.sindex = prevParagraphLength - 1
    return
  }

  // Merge nodes if they are of the same style
  if (stylesMatch(prevNode.style, currNode.style)) {
    prevNode.text = prevNode.text.concat(currNode.text)
    if (currParagraph.length > 1) {
      currParagraph.splice(0, 1)
      prevParagraph.push(...currParagraph)
    }
    paragraphs.splice(status.pindex, 1)
    console.log('Merge nodes')
  } else {
    prevParagraph.push(...currParagraph)
    paragraphs.splice(status.pindex, 1)
    console.log('Combine paragraphs')
  }

  status.offset = prevNodeTextLength
  status.pindex--
  status.sindex = prevParagraphLength - 1
}

function deleteAcrossNodes(
  paragraphs: Array<Array<TextNode>>,
  status: Status
): void {
  const paragraph = paragraphs[status.pindex]
  const node = paragraph[status.sindex]
  const textAfterDeletion = [
    node.text.slice(0, status.offset - 1),
    node.text.slice(status.offset)
  ].join('')

  if (textAfterDeletion.length === 0) {
    const isFirstNode = status.sindex === 0
    const isOnlyNode = paragraph.length === 1

    if (isFirstNode && isOnlyNode) {
      console.log('Empty paragraph')
      node.text = textAfterDeletion
      status.offset = 0
      return
    }

    if (isFirstNode && !isOnlyNode) {
      console.log('Delete node')
      paragraph.splice(status.sindex, 1)
      status.offset = 0
      return
    }

    console.log('Delete middle')
    const prevNode = paragraph[status.sindex - 1]
    const prevNodeTextLength = prevNode.text.length

    if (paragraph.length - 1 > status.sindex) {
      const nextNode = paragraph[status.sindex + 1]
      // Merge nodes if they are of the same style
      if (stylesMatch(prevNode.style, nextNode.style)) {
        console.log('Merge nodes')
        prevNode.text = prevNode.text.concat(nextNode.text)
        paragraph.splice(status.sindex, 1)
      }
    }

    paragraph.splice(status.sindex, 1)
    status.offset = prevNodeTextLength
    status.sindex--
    return
  }

  node.text = textAfterDeletion
  status.offset--

  // Check if offset is between two nodes
  if (status.offset === 0 && status.sindex > 0) {
    const prevNode = paragraph[status.sindex - 1]
    const prevNodeTextLength = prevNode.text.length

    // Merge nodes if they are of the same style
    if (stylesMatch(node.style, prevNode.style)) {
      prevNode.text = prevNode.text.concat(node.text)
      paragraph.splice(status.sindex, 1)
      console.log('Merge nodes')
      status.offset = prevNodeTextLength
      status.sindex--
      return
    }

    console.log('Adjust placement')
    status.offset = paragraph[status.sindex - 1].text.length
    status.sindex--
  }
}

export function deleteCharacter(
  paragraphs: Array<Array<TextNode>>,
  status: Status
): void {
  if (status.offset === 0 && status.pindex === 0 && status.sindex === 0) {
    console.log('*Start of document*')
    return
  }

  if (status.offset === 0 && status.sindex === 0) {
    deleteAcrossParagraphs(paragraphs, status)
    return
  }

  deleteAcrossNodes(paragraphs, status)
}

export function insertNewline(
  paragraphs: Array<Array<TextNode>>,
  status: Status
): void {
  const paragraph = paragraphs[status.pindex]
  const node = paragraph[status.sindex]
  const text = node.text

  // Split text at the offset
  const left = text.slice(0, status.offset)
  const right = text.slice(status.offset)

  // Push affected nodes into a new paragraph
  const newParagraph: Array<TextNode> = []
  const isAtNodeEnd = status.offset === node.text.length
  const isAtParagraphEnd = status.sindex === paragraph.length - 1

  if (isAtNodeEnd && !isAtParagraphEnd) {
    // Offset is between two nodes
    for (let sindex = status.sindex + 1; sindex < paragraph.length; sindex++) {
      newParagraph.push(paragraph[sindex])
    }
  } else if (isAtNodeEnd && isAtNodeEnd) {
    // Offset is at the end of a paragraph
    const style: Style = { ...node.style }
    const emptyNode: TextNode = { style, text: '' }
    newParagraph.push(emptyNode)
  } else {
    // Offset is somewhere else
    for (let sindex = status.sindex; sindex < paragraph.length; sindex++) {
      newParagraph.push(paragraph[sindex])
    }
    const style: Style = { ...node.style }
    const newNode: TextNode = { style, text: right }
    newParagraph[0] = newNode
  }

  // Update original paragraph
  paragraph[status.sindex].text = left
  paragraph.length = status.sindex + 1

  // Update paragraphs array
  paragraphs[status.pindex] = paragraph
  paragraphs.splice(status.pindex + 1, 0, newParagraph)

  // Update status
  status.pindex += 1
  status.sindex = 0
  status.offset = 0
}

export function editParagraphs(
  action: Action,
  paragraphs: Array<Array<TextNode>>,
  status: Status,
  key?: string,
  style?: Style
): {
  paragraphs: Array<Array<TextNode>>
  status: Status
  direction: Direction
} {
  let direction: Direction = Direction.Write

  switch (action) {
    case Action.Write:
      writeCharacter(paragraphs, status, key!, style!)
      direction = Direction.Write
      break
    case Action.Delete:
      deleteCharacter(paragraphs, status)
      direction = Direction.Delete
      break
    case Action.NewLine:
      insertNewline(paragraphs, status)
      direction = Direction.NewLine
      break
  }

  return { paragraphs, status, direction }
}
