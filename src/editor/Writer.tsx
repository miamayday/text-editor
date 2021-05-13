import { WriterProps, TextNode, Style, Direction } from './Types'

export function newLine(props: WriterProps): {
  paragraphs: Array<Array<TextNode>>
  direction: Direction
} {
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
