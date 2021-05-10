import React from 'react'
import { ReactComponent as BoldIcon } from '../assets/bold.svg'
import { ReactComponent as ItalicIcon } from '../assets/italic.svg'
import {
  Style,
  TextNode,
  EditorProps,
  EditorState,
  Direction,
  SetterProps
} from './Types'
import * as Navigation from './Navigation'

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

  componentDidUpdate(): void {
    if (this.state.direction !== undefined) {
      switch (this.state.direction) {
        case Direction.Up:
          this.moveUp()
          break
        case Direction.Right:
          this.moveRight()
          break
        case Direction.RightAfterWrite:
          break
        case Direction.Left:
          this.moveLeft()
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

  /* Caret movers */

  moveUp(): void {
    console.log('move up')

    const newState = Navigation.moveUp(this.state)
    this.setState({ ...this.state, ...newState })
  }

  moveRight(): void {
    console.log('move right')

    const newState = Navigation.moveRight(this.state)
    this.setState({ ...this.state, ...newState })
  }

  moveLeft(): void {
    console.log('move left')

    const newState = Navigation.moveLeft(this.state)
    this.setState({ ...this.state, ...newState })
  }

  /* Caret setters */

  setCaretForSpan(props: SetterProps): void {
    console.log('set caret for span', props.el)

    const newState = Navigation.setCaretForSpan(this.state, props)
    if (newState !== null) {
      this.setState({ ...this.state, ...newState })
    }
  }

  setCaretForParagraph(props: SetterProps): void {
    console.log('set caret for paragraph', props.el)

    const newState = Navigation.setCaretForParagraph(this.state, props)
    if (newState !== null) {
      this.setState({ ...this.state, ...newState })
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

  /* Event handlers */

  handleKeyDown(event: React.KeyboardEvent): void {
    event.preventDefault()

    //this.write(event.key)

    switch (event.key) {
      case 'ArrowUp':
        this.setState({ direction: Direction.Up })
        break
      case 'ArrowRight':
        this.setState({ direction: Direction.Right })
        break
      case 'ArrowLeft':
        this.setState({ direction: Direction.Left })
        break
    }
  }

  handleClick(event: React.MouseEvent): void {
    event.preventDefault()

    if (event.target instanceof HTMLElement) {
      const el = event.target
      if (el.className)
        if (el.className !== 'text-node' && el.className !== 'paragraph') {
          this.setState({
            caret: undefined,
            direction: undefined,
            pindex: undefined,
            sindex: undefined
          })
          console.log('undefined')
          return
        }

      const offset = window.getSelection()?.focusOffset
      if (offset === undefined) {
        return
      }

      const props: SetterProps = {
        el,
        offset,
        x: event.clientX,
        y: event.clientY
      }

      if (el.className === 'text-node') {
        this.setCaretForSpan(props)
      } else if (el.className === 'paragraph') {
        this.setCaretForParagraph(props)
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
          <span className="status">
            offset: {this.state.caret && this.state.caret.offset}
          </span>
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
