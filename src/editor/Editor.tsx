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
  WriterProps,
  Position
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
      style: {
        bold: false,
        italic: false
      },
      paragraphs: examples
    }

    this.handleClick = this.handleClick.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleBoldClick = this.handleBoldClick.bind(this)
    this.handleItalicClick = this.handleItalicClick.bind(this)
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
    const props: React.CSSProperties = {
      fontWeight: style.bold ? 'bold' : 'normal',
      fontStyle: style.italic ? 'italic' : 'normal'
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

  /**
   * Calls the Mover to move the caret in the current Direction.
   *
   * @see Mover.ts
   */
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

    let position: Position = {
      caret: this.state.caret,
      pindex: this.state.pindex,
      sindex: this.state.sindex
    }

    switch (this.state.direction) {
      case Direction.Up:
        position = CaretMover.moveVertical(true, props)
        break
      case Direction.Right:
        position = CaretMover.moveHorizontal(false, props)
        break
      case Direction.Down:
        position = CaretMover.moveVertical(false, props)
        break
      case Direction.Left:
        position = CaretMover.moveHorizontal(true, props)
        break
      case Direction.Write:
        position = CaretMover.moveAfterWrite(props)
        break
      case Direction.Delete:
        position = CaretMover.moveAfterDelete(props)
        break
      case Direction.NewLine:
        position = CaretMover.moveAfterNewline(props)
        break
    }

    const style = this.state.paragraphs[position.pindex][position.sindex].style

    this.setState({ ...this.state, ...position, style, direction: undefined })
  }

  /**
   * Calls the Setter to set the caret within the clicked span (text node).
   *
   * @see setCaretForSpan function in Setter.ts
   * @param props Information related to the position of the cursor and the editor state.
   */
  setCaretForSpan(props: SetterProps): void {
    console.log('set caret for span', props.el)

    const newState = CaretSetter.setCaretForSpan(this.state, props)
    if (newState !== null) {
      this.setState({ ...this.state, ...newState })
    }
  }

  /**
   * Calls the Setter to set the caret within the clicked paragraph.
   *
   * @see setCaretForParagraph function in Setter.ts
   * @param props Information related to the position of the cursor and the editor state.
   */
  setCaretForParagraph(props: SetterProps): void {
    console.log('set caret for paragraph', props.el)

    const newState = CaretSetter.setCaretForParagraph(this.state, props)
    if (newState !== null) {
      this.setState({ ...this.state, ...newState })
    }
  }

  /* Editing */

  /**
   * Call the Writer to execute one of the three commands: Write, Delete, Newline.
   *
   * @see Writer.tsx
   */
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
        console.log('write', this.state.key)
        if (this.state.key) {
          this.setState(Writer.Write(props, this.state.key, this.state.style))
        }
        break
      case Command.Delete:
        const state = Writer.Delete(props)
        if (state !== null) {
          this.setState({ ...this.state, ...state })
        }
        break
      case Command.NewLine:
        this.setState(Writer.Newline(props))
        break
    }

    this.setState({ command: undefined })
  }

  /* Event handlers */

  handleKeyDown(event: React.KeyboardEvent): void {
    //event.preventDefault()

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
      case 'F5':
        break
      default:
        this.setState({ command: Command.Write, key: event.key })
    }
  }

  handleClickOutside(event: React.MouseEvent): void {
    event.preventDefault()

    if (event.target instanceof HTMLElement) {
      const el = event.target
      if (el.className && el.className === 'app') {
        console.log('clicked outside')
        this.setState({
          caret: undefined,
          direction: undefined,
          pindex: undefined,
          sindex: undefined
        })
      }
    }
  }

  /**
   * Handles a mouse click event on the document.
   *
   * Sets the caret depending on where the user clicks. Different procedures
   * are used for text nodes and paragraphs.
   */
  handleClick(event: React.MouseEvent): void {
    event.preventDefault()

    if (event.target instanceof HTMLElement) {
      const el = event.target

      if (el.className) {
        if (el.className === 'caret') {
          console.log('clicked on caret')
          return
        } else if (
          el.className !== 'text-node' &&
          el.className !== 'paragraph'
        ) {
          console.log('clicked on middle ground')
          this.setState({
            caret: undefined,
            direction: undefined,
            pindex: undefined,
            sindex: undefined
          })
          return
        }
      }

      const offset = window.getSelection()?.focusOffset
      if (offset === undefined) {
        return
      }

      console.log('focusOffset:', offset)

      const props: SetterProps = {
        el,
        offset,
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

      console.log('event.clientX:', event.clientX)
      //console.log('event.clientY:', event.clientY)

      if (el.className === 'text-node') {
        this.setCaretForSpan(props)
      } else if (el.className === 'paragraph') {
        this.setCaretForParagraph(props)
      }
    }
  }

  handleBoldClick(event: React.MouseEvent): void {
    event.preventDefault()
    this.setState({
      style: { ...this.state.style, bold: !this.state.style.bold }
    })
  }

  handleItalicClick(event: React.MouseEvent): void {
    event.preventDefault()
    this.setState({
      style: { ...this.state.style, italic: !this.state.style.italic }
    })
  }

  render() {
    return (
      <div
        className="app"
        onClick={this.handleClickOutside}
        onKeyDown={this.handleKeyDown}
        tabIndex={0}
      >
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
            <BoldIcon
              className={
                this.state.style.bold ? 'toolbar-icon active' : 'toolbar-icon'
              }
              onClick={this.handleBoldClick}
            />
            <ItalicIcon
              className={
                this.state.style.italic ? 'toolbar-icon active' : 'toolbar-icon'
              }
              onClick={this.handleItalicClick}
            />
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
          <div className="document" onClick={this.handleClick}>
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
      </div>
    )
  }
}

export default Editor
