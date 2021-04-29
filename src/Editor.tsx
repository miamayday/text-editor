import React from 'react'
import type { TextNode, Paragraph, Style } from './Document'
import { ReactComponent as BoldIcon } from './assets/bold.svg'
import { ReactComponent as ItalicIcon } from './assets/italic.svg'

type EditorProps = {}

type Caret = {
  offset: number
  x: number
  y: number
}

enum Direction {
  Up = 1,
  Down,
  Left,
  LeftAfterDelete,
  Right,
  RightAfterWrite
}

type EditorState = {
  styleProps: React.CSSProperties
  caret?: Caret
  direction?: Direction
  pindex?: number
  sindex?: number
  paragraphs: Array<Array<TextNode>>
}

const bold: Style = { bold: true, italic: false }
const italic: Style = { bold: false, italic: true }
const normal: Style = { bold: false, italic: false }
const n1: TextNode = { style: normal, text: 'This is an example text with ' }
const n2: TextNode = { style: bold, text: 'bold' }
const n3: TextNode = { style: normal, text: ' and ' }
const n4: TextNode = { style: italic, text: 'italic' }
const n5: TextNode = {
  style: normal,
  text: ' test. elements. This is the se co   nd line of the first paragraph.'
}
const n6: TextNode = { style: normal, text: '' }
const n7: TextNode = { style: normal, text: 'This is the third paragraph.' }
const n8: TextNode = { style: normal, text: '' }
const n9: TextNode = {
  style: normal,
  text:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus placerat eleifend iaculis. Morbi orci urna, tristique in auctor id, ultrices sed neque. Suspendisse eget neque orci. Cras sed tempor nulla. Sed congue arcu id suscipit viverra. Vestibulum sit amet commodo erat. Sed egestas blandit ex, eget suscipit diam semper non. Sed id sagittis purus. Aenean placerat sapien id ultrices congue. Morbi congue lorem sed felis molestie, id porta justo pellentesque.'
}

const examples: Array<Array<TextNode>> = [
  [n1, n2, n3, n4, n5],
  [n6],
  [n7],
  [n8],
  [n9]
]

class Editor extends React.Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props)
    this.state = {
      styleProps: {
        fontStyle: 'normal',
        fontWeight: 'normal'
      },
      paragraphs: examples
    }

    this.handleClick = this.handleClick.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  componentDidMount(): void {
    if (this.state.direction !== undefined) {
      // move caret after write
    }
  }

  nodeToCSSProps(style: Style): React.CSSProperties {
    const props: React.CSSProperties = { ...this.state.styleProps }
    if (style.bold) {
      props.fontWeight = 'bold'
    }
    if (style.italic) {
      props.fontStyle = 'italic'
    }
    return props
  }

  caretToCSSProps(): React.CSSProperties {
    if (this.state.caret !== undefined) {
      return {
        left: this.state.caret.x + 'px',
        top: this.state.caret.y + 'px'
      }
    } else {
      return {}
    }
  }

  calcLeft(left: number): number {
    return left - 2
  }

  calcTop(top: number): number {
    return top - 5
  }

  getRectFromRange(node: Node, offset: number): DOMRect {
    const range = document.createRange()
    range.setStart(node, offset)
    range.collapse()
    return range.getBoundingClientRect()
  }

  getCoords(span: Element, offset: number): [number, number] {
    const rect = this.getRectFromRange(span.childNodes[0], offset)
    const d = document.querySelectorAll('.document')[0]
    const cont = d.getBoundingClientRect()
    const x = this.calcLeft(rect.left - cont.left)
    const y = this.calcTop(rect.top - cont.top + d.scrollTop)
    return [x, y]
  }

  setCaretForEmptyLine(span: Element): void {
    console.log('set caret for empty line')

    const paragraph = span.parentElement
    const pindex = span.getAttribute('p-index')
    const sindex = span.getAttribute('s-index')
    if (paragraph !== null && pindex !== null && sindex !== null) {
      const html: HTMLElement = paragraph.querySelectorAll('span')[
        Number(sindex)
      ]
      if (html !== null) {
        const x = html.offsetLeft
        const y = paragraph.offsetTop
        const caret = { offset: 0, x, y }
        this.setState({
          caret,
          pindex: Number(pindex),
          sindex: Number(sindex)
        })
      }
    }
  }

  setCaretForSpan(span: Element, offset: number): void {
    console.log('set caret for span')

    if (span.textContent !== null && span.textContent.length === 0) {
      this.setCaretForEmptyLine(span)
      return
    }

    const pindex = span.getAttribute('p-index')
    const sindex = span.getAttribute('s-index')
    if (pindex !== null && sindex !== null) {
      const [x, y] = this.getCoords(span, offset)
      const caret = { offset, x, y }
      this.setState({
        caret,
        pindex: Number(pindex),
        sindex: Number(sindex)
      })
    }
  }

  setCaretForParagraph(paragraph: Element, offset: number): void {
    console.log('set caret for paragraph')

    const span = paragraph.children[0]
    const pindex = span.getAttribute('p-index')
    const sindex = span.getAttribute('s-index')
    if (pindex === null || sindex === null) {
      return
    }

    if (span.textContent !== null && span.textContent.length === 0) {
      this.setCaretForEmptyLine(span)
      return
    }

    // TODO: Fix p,s = 0 errors

    const rect = this.getRectFromRange(span.childNodes[0], offset)

    const d = document.querySelectorAll('.document')[0]
    const cont = d.getBoundingClientRect()
    const x = this.calcLeft(rect.left - cont.left)
    const y = this.calcTop(rect.top - cont.top + d.scrollTop)
    const caret = { offset, x, y }
    this.setState({
      caret,
      pindex: Number(pindex),
      sindex: Number(sindex)
    })

    //this.setState({ caret, pindex })
    /*range.setStart(el.childNodes[0], offset + 1)
          range.collapse()
          const next = range.getClientRects()[0]
          const diff = next.left - start.left
          // could sharpen this... snaps too easily to start
          if (event.clientX <= start.left + diff / 2) {
            const d = document.querySelectorAll('.document')[0]
            const cont = d.getBoundingClientRect()
            const x = this.calcLeft(start.left - cont.left)
            const y = this.calcTop(next.top - cont.top + d.scrollTop)
            const caret = { offset, x, y }
            this.setState({ caret, pindex })
          }*/
    /*const d = document.querySelectorAll('.document')[0]
          const docRect = d.getBoundingClientRect()
          const x = this.calcLeft(charRect.left - docRect.left)
          const y = this.calcTop(charRect.top - docRect.top + d.scrollTop)*/
  }

  handleKeyDown(event: React.KeyboardEvent): void {
    event.preventDefault()

    if (
      this.state.caret !== undefined &&
      this.state.pindex !== undefined &&
      this.state.sindex !== undefined
    ) {
      const node = this.state.paragraphs[this.state.pindex][this.state.sindex]
      node.text = [
        node.text.slice(0, this.state.caret.offset),
        event.key,
        node.text.slice(this.state.caret.offset)
      ].join('')
      const paragraphs = this.state.paragraphs
      paragraphs[this.state.pindex][this.state.sindex] = node
      this.setState({ direction: Direction.RightAfterWrite, paragraphs })
    }
  }

  handleClick(event: React.MouseEvent): void {
    event.preventDefault()

    if (event.target instanceof Element) {
      const el = event.target
      if (el.className !== 'text-node' && el.className !== 'paragraph') {
        this.setState({
          caret: undefined,
          direction: undefined,
          pindex: undefined,
          sindex: undefined
        })
        return
      }

      const offset = window.getSelection()?.focusOffset
      if (offset === undefined) {
        return
      }

      console.log('offset:', offset)

      if (el.className === 'text-node') {
        this.setCaretForSpan(el, offset)
      } else if (el.className === 'paragraph') {
        this.setCaretForParagraph(el, offset)
      }
    }
  }

  render() {
    return (
      <div className="editor">
        <div className="toolbar">
          <BoldIcon className="toolbar-icon active" />
          <ItalicIcon className="toolbar-icon" />
        </div>
        <div
          className="document"
          onClick={this.handleClick}
          onKeyDown={this.handleKeyDown}
          tabIndex={0}
        >
          {this.state.caret && (
            <div className="caret" style={this.caretToCSSProps()}></div>
          )}
          {this.state.paragraphs.map((p, i) => (
            <p key={`p-${i}`} className="paragraph">
              {p.map((node, j) => (
                <span
                  key={`span-${i}-${j}`}
                  p-index={i}
                  s-index={j}
                  className="text-node"
                  style={this.nodeToCSSProps(node.style)}
                >
                  {node.text}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    )
  }
}

export default Editor
