import React from 'react'
import type { TextNode, Style } from './Document'
import { ReactComponent as BoldIcon } from './assets/bold.svg'
import { ReactComponent as ItalicIcon } from './assets/italic.svg'

type EditorProps = {}

type Caret = {
  offset: number
  x: number
  y: number
}

type Mouse = {
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
  mouse?: Mouse
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
      switch (this.state.direction) {
        case Direction.RightAfterWrite:
          this.shiftRight()
          break
      }
    }
  }

  /* Stylers */

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

  /* Coords */

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

  /* Movers */

  shiftRight(): void {
    if (this.state.caret && this.state.pindex && this.state.sindex) {
      let offset = this.state.caret.offset + 1
      let pindex = this.state.pindex
      let sindex = this.state.sindex

      // go to next span
      if (offset > this.state.paragraphs[pindex][sindex].text.length) {
        offset = 0
        sindex++
      }

      // go to next paragraph
      if (sindex >= this.state.paragraphs[pindex].length) {
        sindex = 0
        pindex++
      }

      // reach the end of the document
      if (pindex >= this.state.paragraphs.length) {
        // do nuthin!
        return
      }

      const span = document.querySelectorAll('.paragraph')[pindex].children[
        sindex
      ]
      const [x, y] = this.getCoords(span, offset)
      const caret = { offset, x, y }
      this.setState({ caret, pindex, sindex, direction: undefined })
    }
  }

  /* Typing */

  write(key: string): void {
    if (
      this.state.caret !== undefined &&
      this.state.pindex !== undefined &&
      this.state.sindex !== undefined
    ) {
      const node = this.state.paragraphs[this.state.pindex][this.state.sindex]
      node.text = [
        node.text.slice(0, this.state.caret.offset),
        key,
        node.text.slice(this.state.caret.offset)
      ].join('')
      const paragraphs = this.state.paragraphs
      paragraphs[this.state.pindex][this.state.sindex] = node
      this.setState({ direction: Direction.RightAfterWrite, paragraphs })
    }
  }

  /* Setters */

  setCaretForEmptyLine(span: Element): void {
    console.log('set caret for empty line')

    const paragraph = span.parentElement
    const pindex = span.getAttribute('p-index')
    const sindex = span.getAttribute('s-index')
    if (paragraph !== null && pindex !== null && sindex !== null) {
      // need html for the offset
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

  setCaretForParagraph(
    p: HTMLElement,
    offset: number,
    pageX: number,
    pageY: number
  ): void {
    console.log('set caret for paragraph', p)

    const pindex = p.getAttribute('p-index')
    if (pindex !== null) {
      const paragraph = this.state.paragraphs[Number(pindex)]

      const caret = { offset, x: 0, y: 0 }

      let bestX = Number.MAX_VALUE
      let bestY = Number.MAX_VALUE
      let bestDiff = Number.MAX_VALUE

      const d = document.querySelectorAll('.document')[0]
      const cont = d.getBoundingClientRect()

      for (let sindex = 0; sindex < paragraph.length; sindex++) {
        const node = paragraph[sindex]
        console.log(node.text)
        if (node.text.length >= offset) {
          const span = p.children[sindex]
          const rect = this.getRectFromRange(span.childNodes[0], offset)
          const [x, y] = [rect.left, rect.top]
          console.log(x, y, 'VS', pageX, pageY)

          // TODO: when surpass y just stop

          const diff = Math.sqrt(
            Math.pow(pageX - x, 2) + Math.pow(pageY - y, 2)
          )
          if (diff < bestDiff) {
            bestX = x
            bestY = y
            bestDiff = diff

            caret.x = this.calcLeft(rect.left - cont.left)
            caret.y = this.calcTop(rect.top - cont.top + d.scrollTop)
          }
        } else if (node.text.length === 0) {
          console.log('empty string')

          const x = cont.left + 100 // margin
          const y = p.offsetTop + cont.top + d.scrollTop + 4 // (28 - 20) / 2
          console.log(x, y, 'VS', pageX, pageY)
          const diff = Math.sqrt(
            Math.pow(pageX - x, 2) + Math.pow(pageY - y, 2)
          )
          if (diff < bestDiff) {
            bestX = x
            bestY = y
            bestDiff = diff

            caret.x = 100
            caret.y = p.offsetTop
          }
        }
      }

      const mouse = { x: bestX, y: bestY }
      this.setState({ caret })
      this.setState({ mouse })
    }

    /*const span = paragraph.children[0]
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
    })*/

    // TODO: start jumps prev end
  }

  /* Event handlers */

  handleKeyDown(event: React.KeyboardEvent): void {
    event.preventDefault()

    //this.write(event.key)
  }

  handleClick(event: React.MouseEvent): void {
    event.preventDefault()

    if (event.target instanceof HTMLElement) {
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
        this.setCaretForParagraph(el, offset, event.pageX, event.pageY)
      }
    }
  }

  render() {
    return (
      <div className="editor">
        {this.state.mouse && (
          <div
            className="mouse"
            style={{
              left: this.state.mouse.x + 'px',
              top: this.state.mouse.y + 'px'
            }}
          ></div>
        )}
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
            <p key={`p-${i}`} p-index={i} className="paragraph">
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
