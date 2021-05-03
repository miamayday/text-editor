import React from 'react'
import type { TextNode, Style } from './Document'
import { ReactComponent as BoldIcon } from './assets/bold.svg'
import { ReactComponent as ItalicIcon } from './assets/italic.svg'
import * as Coords from './editor/Coords'
import * as Navigation from './editor/Navigation'

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
  mouse?: Mouse // a pink square that acts a snapping guide
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

  // moved to editor/Coords

  /* Movers */

  shiftRight(): void {
    if (this.state.caret && this.state.pindex && this.state.sindex) {
      const output = Navigation.incrementOffset(
        this.state.caret.offset,
        this.state.pindex,
        this.state.sindex,
        this.state.paragraphs
      )

      if (output === null) {
        return
      }

      const { offset, pindex, sindex } = output
      const span = document.querySelectorAll('.paragraph')[pindex].children[
        sindex
      ]
      const [x, y] = Coords.getCoords(span, offset)
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

  setCaretForSpan(
    span: HTMLElement,
    offset: number,
    clickX: number,
    clickY: number
  ): void {
    console.log('set caret for span', span)

    const attrPindex = span.getAttribute('p-index')
    const attrSindex = span.getAttribute('s-index')
    if (attrPindex !== null && attrSindex !== null) {
      let pindex = Number(attrPindex)
      let sindex = Number(attrSindex)

      const [x, y] = Coords.getCoords(span, offset)
      const caret = { offset, x, y }

      const p = document.querySelectorAll('.paragraph')[pindex]
      const arr = this.state.paragraphs[pindex]

      const d = document.querySelectorAll('.document')[0]
      const cont = d.getBoundingClientRect()

      const outOfBounds = Navigation.checkBounds(
        p,
        arr,
        clickX,
        cont.left + 100
      )

      if (outOfBounds && offset > 0) {
        console.log('snap to start')
        let nextOffset = offset + 1
        if (nextOffset > arr[sindex].text.length) {
          nextOffset = 0
          sindex++
        }
        const span = p.children[sindex]
        const rect = Coords.getRectFromRange(span.childNodes[0], nextOffset)
        caret.x = 100 - 2 // width
        caret.y = Coords.calcTop(rect.top - cont.top + d.scrollTop)
      }

      this.setState({
        caret,
        mouse: undefined,
        pindex,
        sindex
      })
    }
  }

  setCaretForParagraph(
    p: HTMLElement,
    offset: number,
    clickX: number,
    clickY: number
  ): void {
    console.log('set caret for paragraph', p)

    const pindex = p.getAttribute('p-index')
    if (pindex !== null) {
      const paragraph = this.state.paragraphs[Number(pindex)]
      const state = Navigation.fixToNearestSpan(
        p,
        paragraph,
        offset,
        clickX,
        clickY
      )
      this.setState({ ...state, pindex: Number(pindex) })
    }
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
        this.setCaretForSpan(el, offset, event.clientX, event.clientY)
      } else if (el.className === 'paragraph') {
        this.setCaretForParagraph(el, offset, event.clientX, event.clientY)
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
