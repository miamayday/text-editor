import React from 'react'
import { ReactComponent as BoldIcon } from '../assets/bold.svg'
import { ReactComponent as ItalicIcon } from '../assets/italic.svg'
import {
  Style,
  TextNode,
  EditorProps,
  EditorState,
  Direction,
  Command,
  SetterProps,
  MoverProps,
  WriterProps
} from './Types'
import * as CaretSetter from './caret/Setter'
import * as CaretMover from './caret/Mover'
import * as Writer from './Writer'

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
const n7: TextNode = {
  style: italic,
  text: 'This is another paragraph with text.'
}
const n8: TextNode = { style: normal, text: '' }
const n9: TextNode = {
  style: normal,
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus placerat eleifend iaculis. Morbi orci urna, tristique in auctor id, ultrices sed neque. Suspendisse eget neque orci. Cras sed tempor nulla. Sed congue arcu id suscipit viverra. Vestibulum sit amet commodo erat. Sed egestas blandit ex, eget suscipit diam semper non. Sed id sagittis purus. Aenean placerat sapien id ultrices congue. Morbi congue lorem sed felis molestie, id porta justo pellentesque.'
}

const examples: Array<Array<TextNode>> = [
  [n1, n2, n3, n4, n5],
  //[n6],
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
      this.moveCaret()
    } else if (this.state.command !== undefined) {
      this.executeCommand()
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

  /* Caret navigation */

  moveCaret(): void {
    if (
      this.state.caret === undefined ||
      this.state.pindex === undefined ||
      this.state.sindex === undefined
    ) {
      return
    }

    const props: MoverProps = {
      caret: this.state.caret,
      pindex: this.state.pindex,
      sindex: this.state.sindex,
      length: (pindex: number, sindex: number) => {
        return this.state.paragraphs[pindex][sindex].text.length
      },
      spanCount: (pindex: number) => {
        return this.state.paragraphs[pindex].length
      },
      pCount: this.state.paragraphs.length
    }

    let state

    switch (this.state.direction) {
      case Direction.Up:
        state = CaretMover.moveUp(props)
        break
      case Direction.Right:
        state = CaretMover.moveRight(props)
        break
      case Direction.Down:
        state = CaretMover.moveDown(props)
        break
      case Direction.Left:
        state = CaretMover.moveLeft(props)
        break
      case Direction.Write:
        state = CaretMover.moveAfterWrite(props)
        break
      case Direction.Delete:
        state = CaretMover.moveAfterDelete(props)
        break
      case Direction.NewLine:
        state = CaretMover.moveAfterNewLine(props)
        break
    }

    this.setState({ ...this.state, ...state })
  }

  setCaretForSpan(props: SetterProps): void {
    console.log('set caret for span', props.el)

    const newState = CaretSetter.setCaretForSpan(this.state, props)
    if (newState !== null) {
      this.setState({ ...this.state, ...newState })
    }
  }

  setCaretForParagraph(props: SetterProps): void {
    console.log('set caret for paragraph', props.el)

    const newState = CaretSetter.setCaretForParagraph(this.state, props)
    if (newState !== null) {
      this.setState({ ...this.state, ...newState })
    }
  }

  /* Editing */

  executeCommand(): void {
    if (
      this.state.caret === undefined ||
      this.state.pindex === undefined ||
      this.state.sindex === undefined
    ) {
      return
    }

    const props: WriterProps = {
      caret: this.state.caret,
      pindex: this.state.pindex,
      sindex: this.state.sindex,
      paragraphs: this.state.paragraphs
    }

    switch (this.state.command) {
      case Command.Write:
        break
      case Command.Delete:
        const state = Writer.Delete(props)
        if (state !== null) {
          this.setState({ ...this.state, ...state })
        }
        break
      case Command.NewLine:
        this.setState(Writer.newLine(props))
        break
    }

    this.setState({ command: undefined })
  }

  write(key: string): void {
    if (
      this.state.caret !== undefined &&
      this.state.pindex !== undefined &&
      this.state.sindex !== undefined
    ) {
      const node = this.state.paragraphs[this.state.pindex][this.state.sindex]
      const text = [
        node.text.slice(0, this.state.caret.offset),
        key,
        node.text.slice(this.state.caret.offset)
      ].join('')
      const paragraphs = this.state.paragraphs
      paragraphs[this.state.pindex][this.state.sindex].text = text
      this.setState({ paragraphs, direction: Direction.Write })
    }
  }

  /* Event handlers */

  handleKeyDown(event: React.KeyboardEvent): void {
    event.preventDefault()

    switch (event.key) {
      case 'ArrowUp':
        this.setState({ direction: Direction.Up })
        break
      case 'ArrowRight':
        this.setState({ direction: Direction.Right })
        break
      case 'ArrowDown':
        this.setState({ direction: Direction.Down })
        break
      case 'ArrowLeft':
        this.setState({ direction: Direction.Left })
        break
      case 'Enter':
        this.setState({ command: Command.NewLine })
        break
      case 'Backspace':
        this.setState({ command: Command.Delete })
        break
      default:
        this.setState({ command: Command.Write, key: event.key })
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

      console.log('focusOffset:', offset)

      const props: SetterProps = {
        el,
        offset, // TODO: what about between two spans? and empty paragraph?
        x: event.clientX,
        y: event.clientY,
        length: (pindex: number, sindex: number) => {
          return this.state.paragraphs[pindex][sindex].text.length
        },
        spanCount: (pindex: number) => {
          return this.state.paragraphs[pindex].length
        },
        pCount: this.state.paragraphs.length
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
          <span className="status">
            pindex: {this.state.pindex && this.state.pindex}
          </span>
          <span className="status">
            sindex: {this.state.sindex && this.state.sindex}
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
