import React from 'react'
// Toolbar icons
import { ReactComponent as BoldIcon } from '../assets/bold.svg'
import { ReactComponent as ItalicIcon } from '../assets/italic.svg'
// Interfaces, types, enums
import {
  Style,
  EditorProps,
  EditorState,
  Direction,
  Action,
  Coordinates,
  Status
} from './Types'
// Functionality for caret navigation and editing
import * as CaretSetter from './caret/Setter'
import * as CaretMover from './caret/Mover'
import * as Writer from './Writer'
// Example paragraphs
import { examples } from './Examples'

const defaultStyle: Style = {
  bold: false,
  italic: false
}

class Editor extends React.Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props)
    this.state = {
      style: defaultStyle,
      caret: false,
      paragraphs: examples
    }

    this.handleClick = this.handleClick.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleBoldClick = this.handleBoldClick.bind(this)
    this.handleItalicClick = this.handleItalicClick.bind(this)
  }

  componentDidUpdate(): void {
    // Two important attributes:
    // - this.state.direction: Indicates a change to the caret
    // - this.state.action: Indicates a change to the paragraphs
    // Only one of the attributes can be defined at a time.
    // Prequisite for either event is that the caret has been set.
    if (this.state.direction !== undefined) {
      this.moveCaret()
    } else if (this.state.action !== undefined) {
      this.edit()
    }
  }

  getStyle(status: Status): Style {
    return this.state.paragraphs[status.pindex][status.sindex].style
  }

  /* CARET NAVIGATION */

  /**
   * Calls the Mover to calculate a new position for the caret.
   * @see moveHorizontal function in caret/Mover.ts
   * @see moveVertical function in caret/Mover.ts
   */
  moveCaret(): void {
    if (!this.state.caret) {
      return
    }

    const { pos, status } = CaretMover.calculateCaretPosition(
      this.state.direction!,
      this.state.paragraphs,
      this.state.pos!,
      this.state.status!
    )

    const style = this.getStyle(status)
    this.setState({
      pos,
      status,
      style,
      direction: undefined
    })
  }

  /**
   * Calls the Setter to calculate the caret position.
   * @see calculateCaretPosition function in caret/Setter.ts
   */
  setCaret(el: HTMLElement, client: Coordinates, initialStatus: Status): void {
    const { pos, status } = CaretSetter.calculateCaretPosition(
      this.state.paragraphs,
      el,
      client,
      initialStatus
    )

    const style = this.getStyle(status)
    this.setState({
      caret: true,
      pos,
      status,
      style,
      direction: undefined
    })
  }

  /* EDITING (writing, deleting, inserting a newline) */

  /**
   * Calls the Writer to edit paragraphs.
   *
   * Possible actions: Write, Delete, Newline.
   * @see Writer.ts
   */
  edit(): void {
    if (!this.state.caret || this.state.action === undefined) {
      return
    }

    const newState = Writer.editParagraphs(
      this.state.action,
      this.state.paragraphs,
      this.state.status!,
      this.state.key,
      this.state.style
    )
    this.setState({ ...newState, action: undefined })
  }

  /* EVENT HANDLERS */

  /**
   * Handles a key down event.
   *
   * May set this.state.direction or this.state.command depending on the key code.
   * @param event onKeyDown event on div.app
   */
  handleKeyDown(event: React.KeyboardEvent): void {
    // These cause problems otherwise
    // Firefox may still act up TODO:
    const avoid = ['ArrowUp', 'ArrowDown', ' ']
    if (avoid.includes(event.key)) {
      event.preventDefault()
    }

    if (!this.state.caret) {
      return // Do nothing if caret has not been set
    }

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
        this.setState({ action: Action.NewLine })
        break
      case 'Backspace':
        this.setState({ action: Action.Delete })
        break
      case 'F5':
        break
      default:
        this.setState({ action: Action.Write, key: event.key })
    }
  }

  /**
   * Handles a mouse click event on the document.
   *
   * Sets the caret depending on where the user clicks. Different procedures
   * are used for text nodes and paragraphs.
   * @param event onClick event on div.document
   */
  handleClick(event: React.MouseEvent): void {
    event.preventDefault()

    if (event.target instanceof HTMLElement) {
      const el = event.target

      // Check that element is of class 'text-node' or 'paragraph'
      if (!el.className) {
        return // Nothing to do here
      } else if (el.className === 'caret') {
        console.log('Clicked on caret')
        return // Rare occurence
      } else if (el.className !== 'text-node' && el.className !== 'paragraph') {
        console.log('Clicked on unknown element')
        return
      }

      // Check that element contains 'p-index' attribute
      // * p-index: Paragraph index
      // This is a must for both text nodes and paragraphs
      const attrPindex = el.getAttribute('p-index')
      if (attrPindex === null) {
        console.warn(
          "Attribute 'p-index' missing. See that the paragraphs are rendered correctly."
        )
        return
      }
      const pindex = Number(attrPindex)

      // Get offset from selection
      // This is crucial for calculating the caret position
      // * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Selection/focusOffset
      const offset = window.getSelection()?.focusOffset
      if (offset === undefined) {
        return // Nothing can be done without offset
      }

      let sindex = 0
      // The clicked element is either a text node (span element)
      // or paragraph (p element)
      if (el.className === 'text-node') {
        // Check that the span element contains 's-index' attribute
        // * s-index: Span index
        // This is only required for text nodes
        const attrSindex = el.getAttribute('s-index')
        if (attrSindex === null) {
          console.warn(
            "Attribute 's-index' missing. See that the paragraphs are rendered correctly."
          )
          return
        }
        sindex = Number(attrSindex)
      }

      const client: Coordinates = { x: event.clientX, y: event.clientY }
      const status: Status = { offset, pindex, sindex }
      this.setCaret(el, client, status)
    }
  }

  /**
   * Vanishes the caret, since the user clicked outside the app.
   * @param event onClick event on div.app
   */
  handleClickOutside(event: React.MouseEvent): void {
    event.preventDefault()

    if (event.target instanceof HTMLElement) {
      const el = event.target
      const classes = ['paragraph', 'text-node']
      if (el.className && !classes.includes(el.className)) {
        console.log('Clicked outside')
        this.setState({ caret: false })
      }
    }
  }

  /**
   * Toggles bold styling.
   * @param event onClick event on the bold toolbar icon
   */
  handleBoldClick(event: React.MouseEvent): void {
    event.preventDefault()
    this.setState({
      style: { ...this.state.style, bold: !this.state.style.bold }
    })
  }

  /**
   * Toggles italic styling.
   * @param event onClick event on the italic toolbar icon
   */
  handleItalicClick(event: React.MouseEvent): void {
    event.preventDefault()
    this.setState({
      style: { ...this.state.style, italic: !this.state.style.italic }
    })
  }

  /* STYLERS FOR TEXT NODES AND THE CARET */

  /**
   * Converts the style of a text node into CSS properties.
   * @param style Style of a text node
   * @returns Corresponding CSS properties
   */
  nodeToCSSProps(style: Style): React.CSSProperties {
    const props: React.CSSProperties = {
      fontWeight: style.bold ? 'bold' : 'normal',
      fontStyle: style.italic ? 'italic' : 'normal'
    }
    return props
  }

  /**
   * Converts caret coordinates into CSS properties.
   * @returns Left and top values for the caret
   */
  caretToCSSProps(): React.CSSProperties {
    if (this.state.caret) {
      return {
        left: this.state.pos!.x + 'px',
        top: this.state.pos!.y + 'px'
      }
    }
    return {}
  }

  render() {
    return (
      <div className="editor" onClick={this.handleClickOutside}>
        <div className="panel-wrapper">
          <div className="side panel">
            <div className="status block">
              <div className="annotation">
                <span>Offset</span>
                <span>{this.state.caret && this.state.status!.offset}</span>
              </div>
              <div className="annotation">
                <span>Pindex</span>
                <span>{this.state.caret && this.state.status!.pindex}</span>
              </div>
              <div className="annotation">
                <span>Sindex</span>
                <span>{this.state.caret && this.state.status!.sindex}</span>
              </div>
            </div>
            <div className="status block">
              <div className="annotation">
                <span>X</span>
                <span>{this.state.caret && this.state.pos!.x}</span>
              </div>
              <div className="annotation">
                <span>Y</span>
                <span>{this.state.caret && this.state.pos!.y}</span>
              </div>
            </div>
          </div>
          <div
            className="main panel"
            onKeyDown={this.handleKeyDown}
            tabIndex={0} // Cannot write otherwise
          >
            <div className="toolbar block">
              <BoldIcon
                className={
                  this.state.style.bold ? 'toolbar-icon active' : 'toolbar-icon'
                }
                onClick={this.handleBoldClick}
              />
              <ItalicIcon
                className={
                  this.state.style.italic
                    ? 'toolbar-icon active'
                    : 'toolbar-icon'
                }
                onClick={this.handleItalicClick}
              />
            </div>
            <div className="document block" onClick={this.handleClick}>
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
            <div className="block">
              Icons made by{' '}
              <a href="https://www.flaticon.com/authors/google" title="Google">
                Google
              </a>{' '}
              from{' '}
              <a href="https://www.flaticon.com/" title="Flaticon">
                www.flaticon.com
              </a>
            </div>
          </div>
          <div className="side panel"></div>
        </div>
      </div>
    )
  }
}

export default Editor
