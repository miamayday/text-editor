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
  Command,
  SetterProps,
  MoverProps,
  WriterProps,
  Position
} from './Types'
// Functionality for caret navigation and editing
import * as CaretSetter from './caret/Setter'
import * as CaretMover from './caret/Mover'
import * as Writer from './Writer'
// Example paragraphs
import { examples } from './Examples'

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
    // Two important attributes:
    // - this.state.direction: Indicates a change to the caret
    // - this.state.command: Indicates a change to the paragraphs
    // Only one of the attributes can be defined at a time.
    // Prequisite for either event is that the caret has been set.
    if (this.state.direction !== undefined) {
      this.moveCaret()
    } else if (this.state.command !== undefined) {
      this.executeCommand()
    }
  }

  /* CARET NAVIGATION */

  /**
   * Calls the Mover to move the caret in the current Direction.
   * @see Mover.ts in /caret
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
   * @see setCaretForSpan function in caret/Setter.ts
   * @param props Information related to the position of the cursor and the editor state.
   */
  setCaretForSpan(props: SetterProps): void {
    console.log('set caret for span', props.el)

    const position = CaretSetter.setCaretForSpan(this.state, props)
    const style = this.state.paragraphs[position.pindex][position.sindex].style
    this.setState({ ...this.state, ...position, style, direction: undefined })
  }

  /**
   * Calls the Setter to set the caret within the clicked paragraph.
   * @see setCaretForParagraph function in caret/Setter.ts
   * @param props Information related to the position of the cursor and the editor state.
   */
  setCaretForParagraph(props: SetterProps): void {
    console.log('set caret for paragraph', props.el)

    const position = CaretSetter.setCaretForParagraph(this.state, props)
    const style = this.state.paragraphs[position.pindex][position.sindex].style
    this.setState({ ...this.state, ...position, style, direction: undefined })
  }

  /* EDITING (writing, deleting, inserting a newline) */

  /**
   * Call the Writer to execute one of the three commands: Write, Delete, Newline.
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

  /* EVENT HANDLERS */

  /**
   * Handles a key down event.
   *
   * May set this.state.direction or this.state.command depending on the key code.
   * @param event onKeyDown event on div.app
   */
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
      case 'F5':
        break
      default:
        this.setState({ command: Command.Write, key: event.key })
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
        console.log('clicked on caret')
        return // Rare occurence
      } else if (el.className !== 'text-node' && el.className !== 'paragraph') {
        console.log('clicked on unknown element')
        // TODO: Should the caret be vanished in this case?
        this.setState({
          caret: undefined,
          direction: undefined,
          pindex: undefined,
          sindex: undefined
        })
        return
      }

      // Check that element contains 'p-index' attribute
      // * p-index: Paragraph index
      // This is a must for both text nodes and paragraphs
      if (el.getAttribute('p-index') === null) {
        console.warn(
          "Attribute 'p-index' missing. See that the paragraphs are rendered correctly."
        )
        return
      }

      // Get offset from selection
      // This is crucial for calculating the caret position
      // * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Selection/focusOffset
      const offset = window.getSelection()?.focusOffset
      if (offset === undefined) {
        return // Nothing can be done without offset
      }

      console.log('focusOffset:', offset)
      console.log('event.clientX:', event.clientX)
      console.log('event.clientY:', event.clientY)

      // TODO: Is this too much information to be passed around?
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

      // The clicked element is either a text node (span element)
      // or paragraph (p element)
      if (el.className === 'text-node') {
        // Check that the span element contains 's-index' attribute
        // * s-index: Span index
        // This is only required for text nodes
        if (el.getAttribute('s-index') === null) {
          console.warn(
            "Attribute 's-index' missing. See that the paragraphs are rendered correctly."
          )
          return
        }
        this.setCaretForSpan(props)
      } else if (el.className === 'paragraph') {
        this.setCaretForParagraph(props)
      }
    }
  }

  /**
   * Vanishes the caret, since the user clicked outside the document.
   * @param event onClick event on div.app
   */
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
   * @param style  Style of a text node
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
    if (this.state.caret !== undefined) {
      return {
        left: this.state.caret.x + 'px',
        top: this.state.caret.y + 'px'
      }
    } else {
      return {}
    }
  }

  render() {
    return (
      <div
        className="app"
        onClick={this.handleClickOutside}
        onKeyDown={this.handleKeyDown}
        tabIndex={0} // TODO: Needed?
      >
        <div className="editor">
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
