import { rootCertificates } from 'node:tls'
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
const n6: TextNode = { style: normal, text: 'This is a new paragraph.' }

const p1: Paragraph = { contents: [n1, n2, n3, n4, n5] }
const p2: Paragraph = { contents: [n6] }
examples[0] = p1
examples[1] = p2

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
