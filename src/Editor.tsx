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
    if (this.state.caret) {
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
    return top - 4
  }

  getCoords(el: Element, offset: number): [number, number] {
    const range = document.createRange()
    range.setStart(el.childNodes[0], offset)
    range.collapse()
    const child = range.getClientRects()[0]

    const d = document.querySelectorAll('.document')[0]
    const parent = d.getBoundingClientRect()
    console.log('scrollTop:', d.scrollTop)
    console.log(parent)

    const x = this.calcLeft(child.left - parent.left)
    const y = this.calcTop(child.top - parent.top + d.scrollTop)
    return [x, y]
  }

  handleClick(event: React.MouseEvent): void {
    if (event.target instanceof Element) {
      const el = event.target
      console.log(event.target)
      if (el.className !== 'text-node' && el.className !== 'paragraph') {
        this.setState({
          caret: undefined,
          direction: undefined,
          pindex: undefined
        })
        return
      }

      this.setState({ direction: undefined })

      if (this.state.paragraphs.length === 0) {
        return
      }

      let pindex = 0
      let prev = el.previousSibling
      while (prev) {
        prev = prev.previousSibling
        pindex++
      }

      const offset = window.getSelection()?.focusOffset
      console.log('offset:', offset)
      if (offset) {
        if (el.className === 'text-node') {
          let [x, y] = this.getCoords(el, offset)
          console.log('x:', x, 'y:', y)

          const caret = { offset, x, y }
          this.setState({ caret, pindex })
        }
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
        <div className="document" onClick={this.handleClick}>
          {this.state.caret && (
            <div className="caret" style={this.caretToCSSProps()}></div>
          )}
          {this.state.paragraphs.map((p, i) => (
            <p key={`p-${i}`} className="paragraph">
              {p.contents.map((node, j) => (
                <span
                  key={`span-${i}-${j}`}
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
