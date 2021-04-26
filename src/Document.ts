import React from 'react'

type DocumentProps = {}

export type Style = {
  bold: boolean
  italic: boolean
}

type TextNode = {
  style: Style
  text: string
}

type Paragraph = {
  contents: Array<TextNode>
}

type DocumentState = {
  paragraphs: Array<Paragraph>
}

const examples: Array<Paragraph> = []
const bold: Style = { bold: true, italic: false }
const italic: Style = { bold: false, italic: true }
const normal: Style = { bold: false, italic: false }
const n1: TextNode = { style: normal, text: 'This is an example text with ' }
const n2: TextNode = { style: bold, text: 'bold' }
const n3: TextNode = { style: normal, text: ' and ' }
const n4: TextNode = { style: italic, text: 'italic' }
const n5: TextNode = {
  style: normal,
  text: ' elements. This is the second line of the first paragraph.'
}
const n6: TextNode = { style: normal, text: 'This is the third paragraph.' }
const n7: TextNode = { style: normal, text: '' }
const n8: TextNode = {
  style: normal,
  text:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus placerat eleifend iaculis. Morbi orci urna, tristique in auctor id, ultrices sed neque. Suspendisse eget neque orci. Cras sed tempor nulla. Sed congue arcu id suscipit viverra. Vestibulum sit amet commodo erat. Sed egestas blandit ex, eget suscipit diam semper non. Sed id sagittis purus. Aenean placerat sapien id ultrices congue. Morbi congue lorem sed felis molestie, id porta justo pellentesque.'
}

const p1: Paragraph = { contents: [n1, n2, n3, n4, n5] }
const p2: Paragraph = { contents: [n6] }
const linebreak: Paragraph = { contents: [n7] }
const p4: Paragraph = { contents: [n8] }
examples[0] = p1
examples[1] = linebreak
examples[2] = p2
examples[3] = linebreak
examples[4] = p4

class Document extends React.Component<DocumentProps, DocumentState> {
  constructor(props: DocumentProps) {
    super(props)
    this.state = {
      paragraphs: examples
    }
  }

  public getParagraphs(): Array<Paragraph> {
    return this.state.paragraphs
  }
}

export default Document
