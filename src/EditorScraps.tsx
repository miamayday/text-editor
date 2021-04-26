import React from 'react'
import Document from './Document'
import type { Style } from './Document'
import { ReactComponent as BoldIcon } from './assets/bold.svg'
import { ReactComponent as ItalicIcon } from './assets/italic.svg'

type EditorProps = {}

type EditorOptions = {
  lineHeight: number
  bold: boolean
}

type CombinationKeys = {
  ctrlOn: boolean
}

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
  options: EditorOptions
  styleProps: React.CSSProperties
  keys: CombinationKeys
  caret?: Caret
  direction?: Direction
  pindex?: number
  paragraphList: Array<string>
  document: Document
}

const initialParagraphList = [
  'This is an example text.',
  '',
  'Another one.',
  '',
  'This example positions a "highlight" rectangle behind the contents of a range. The range\'s content starts here and continues on until it ends here. The bounding client rectangle contains everything selected in the range.',
  '',
  'More text.',
  '',
  'Should be scrolling soon.',
  '',
  'The European languages are members of the same family. Their separate existence is a myth. For science, music, sport, etc, Europe uses the same vocabulary. The languages only differ in their grammar, their pronunciation and their most common words.'
]

class Editor extends React.Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props)
    this.state = {
      options: { lineHeight: 28, bold: false },
      styleProps: {
        fontStyle: 'normal',
        fontWeight: 'normal'
      },
      keys: { ctrlOn: false },
      paragraphList: [],
      document: new Document({})
    }

    this.setCaret = this.setCaret.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  calcLeft(left: number): number {
    return left - 1
  }

  calcTop(top: number): number {
    return top - 4
  }

  getCoords(el: Element, offset: number): [number, number] {
    const range = document.createRange()
    range.setStart(el.childNodes[0], offset)
    range.setEnd(el.childNodes[0], offset)
    const rect = range.getClientRects()[0]
    const x = this.calcLeft(rect.left)
    const y = this.calcTop(rect.top)
    return [x, y]
  }

  paragraphElement(pindex: number): Element {
    return document.querySelectorAll('.paragraph')[pindex]
  }

  moveToParagraph(pindex: number, offset: number): void {
    const el = this.paragraphElement(pindex)
    const [x, y] = this.getCoords(el, offset)
    this.setState({ caret: { offset, x, y }, direction: undefined, pindex })
  }

  moveToParagraphStart(pindex: number): void {
    this.moveToParagraph(pindex, 0)
    console.log('move to paragraph start:', 0)
  }

  moveToParagraphEnd(pindex: number): void {
    const offset = this.state.paragraphList[pindex].length
    this.moveToParagraph(pindex, offset)
    console.log('move to paragraph end:', offset)
  }

  moveToNextLineStart(): void {
    if (this.state.pindex && this.state.caret) {
      const el = this.paragraphElement(this.state.pindex)
      const range = document.createRange()
      range.setStart(el.childNodes[0], 0)
      range.setEnd(el.childNodes[0], 0)
      const start = range.getClientRects()[0]
      const x = start.left - 2
      const y = this.state.caret.y + this.state.options.lineHeight

      this.setState({
        caret: { offset: this.state.caret.offset, x, y },
        direction: undefined
      })
      console.log('move to next line start:', this.state.caret.offset)
    }
  }

  moveToPrevLineEnd(): void {
    if (this.state.pindex && this.state.caret) {
      const el = this.paragraphElement(this.state.pindex)
      const range = document.createRange()
      range.setStart(el.childNodes[0], this.state.caret.offset)
      range.setEnd(el.childNodes[0], this.state.caret.offset)
      const rect = range.getClientRects()[0]
      const x = rect.left - 2
      const y = this.state.caret.y - this.state.options.lineHeight

      this.setState({
        caret: { offset: this.state.caret.offset, x, y },
        direction: undefined
      })
      console.log('move to prev line end:', this.state.caret.offset)
    }
  }

  moveToLineStart(): void {
    if (this.state.pindex && this.state.caret) {
      const el = this.paragraphElement(this.state.pindex)
      const range = document.createRange()
      range.setStart(el.childNodes[0], 0)
      range.setEnd(el.childNodes[0], 0)
      const start = range.getClientRects()[0]
      const x = start.left - 2
      const offset = this.state.caret.offset - 1

      this.setState({
        caret: { offset, x, y: this.state.caret.y },
        direction: undefined
      })
      console.log('move to line start:', offset)
    }
  }

  shiftCursor(offset: number): void {
    if (this.state.pindex) {
      const el = this.paragraphElement(this.state.pindex)
      const [x, y] = this.getCoords(el, offset)
      this.setState({ caret: { offset, x, y }, direction: undefined })
    }
  }

  shiftCursorRight(): void {
    if (this.state.caret) {
      const offset = this.state.caret.offset + 1
      this.shiftCursor(offset)
      console.log('shift right:', offset)
    }
  }

  shiftCursorLeft(): void {
    if (this.state.caret) {
      const offset = this.state.caret.offset - 1
      this.shiftCursor(offset)
      console.log('shift left:', offset)
    }
  }

  isAtLineEnd(): boolean {
    if (this.state.pindex && this.state.caret) {
      if (
        this.state.caret.offset + 1 >
        this.state.paragraphList[this.state.pindex].length
      ) {
        return false
      }

      const el = this.paragraphElement(this.state.pindex)
      const offset = this.state.caret.offset + 1
      const range = document.createRange()
      range.setStart(el.childNodes[0], offset)
      range.setEnd(el.childNodes[0], offset)
      const rect = range.getClientRects()[0]
      const y = rect.top - 4

      return y > this.state.caret.y
    } else {
      return false
    }
  }

  /* Up */

  moveToParagraphEndSnapX(pindex: number): void {
    if (this.state.caret) {
      const el = this.paragraphElement(pindex)

      let offset = this.state.paragraphList[pindex].length
      let [x, y] = this.getCoords(el, offset)
      let diffX = Math.abs(x - this.state.caret.x)
      while (offset > 0) {
        const [prevX, prevY] = this.getCoords(el, offset - 1)
        const newDiffX = Math.abs(prevX - this.state.caret.x)
        if (newDiffX < diffX) {
          x = prevX
          y = prevY
          diffX = newDiffX
          offset--
        } else {
          break
        }
      }

      const caret = { offset, x, y }
      this.setState({
        caret,
        direction: undefined,
        pindex
      })
      console.log('snap to prev paragraph:', offset)
    }
  }

  moveToPrevLineSnapX(): void {
    if (this.state.pindex && this.state.caret) {
      const el = this.paragraphElement(this.state.pindex)
      let y = this.getCoords(el, 0)[1]
      while (this.state.caret.y > y + this.state.options.lineHeight) {
        y += this.state.options.lineHeight
      }

      let seekX = this.state.caret.x
      let seekY = this.state.caret.y
      let offset = this.state.caret.offset
      while (seekY !== y) {
        offset--
        const [prevX, prevY] = this.getCoords(el, offset)
        seekX = prevX
        seekY = prevY
      }

      let diffX = Math.abs(seekX - this.state.caret.x)
      while (offset > 0) {
        const prevX = this.getCoords(el, offset - 1)[0]
        const newDiffX = Math.abs(prevX - this.state.caret.x)
        if (newDiffX < diffX) {
          seekX = prevX
          diffX = newDiffX
          offset--
        } else {
          break
        }
      }

      const caret = { offset, x: seekX, y: seekY }
      this.setState({ caret, direction: undefined })
      console.log('snap to prev line:', offset)
    }
  }

  /* Down */

  moveToParagraphStartSnapX(pindex: number): void {
    if (this.state.caret) {
      const el = this.paragraphElement(pindex)

      let offset = 0
      let [x, y] = this.getCoords(el, offset)
      let diffX = Math.abs(x - this.state.caret.x)
      const max = this.state.paragraphList[pindex].length
      while (offset < max) {
        const [prevX, prevY] = this.getCoords(el, offset + 1)
        const newDiffX = Math.abs(prevX - this.state.caret.x)
        if (newDiffX < diffX) {
          x = prevX
          y = prevY
          diffX = newDiffX
          offset++
        } else {
          break
        }
      }

      const caret = { offset, x, y }
      this.setState({
        caret,
        direction: undefined,
        pindex
      })
      console.log('snap to next paragraph:', offset)
    }
  }

  moveToNextLineSnapX(): void {
    if (this.state.pindex && this.state.caret) {
      const el = this.paragraphElement(this.state.pindex)
      let y = this.getCoords(el, 0)[1]
      while (this.state.caret.y >= y) {
        y += this.state.options.lineHeight
      }

      let seekX = this.state.caret.x
      let seekY = this.state.caret.y
      let offset = this.state.caret.offset
      while (seekY !== y) {
        offset++
        const [prevX, prevY] = this.getCoords(el, offset)
        seekX = prevX
        seekY = prevY
      }

      let diffX = Math.abs(seekX - this.state.caret.x)
      const max = this.state.paragraphList[this.state.pindex].length
      while (offset < max) {
        const prevX = this.getCoords(el, offset + 1)[0]
        const newDiffX = Math.abs(prevX - this.state.caret.x)
        if (newDiffX < diffX) {
          seekX = prevX
          diffX = newDiffX
          offset++
        } else {
          break
        }
      }

      const caret = { offset, x: seekX, y: seekY }
      this.setState({ caret, direction: undefined })
      console.log('snap to next line:', offset)
    }
  }

  /* Move callers */

  moveUp(): void {
    if (this.state.pindex && this.state.caret) {
      const el = this.paragraphElement(this.state.pindex)
      const y = this.getCoords(el, 0)[1]
      if (y === this.state.caret.y && this.state.pindex > 0) {
        // move to prev paragraph, retain cursor x position
        this.moveToParagraphEndSnapX(this.state.pindex - 1)
        return
      } else if (y < this.state.caret.y) {
        // move to prev line, retain cursor x position
        this.moveToPrevLineSnapX()
        return
      }
    }
  }

  moveRight(): void {
    if (this.state.pindex && this.state.caret) {
      if (
        this.state.caret.offset ===
        this.state.paragraphList[this.state.pindex].length
      ) {
        const pindex = this.state.pindex + 1
        if (pindex < this.state.paragraphList.length) {
          this.moveToParagraphStart(pindex)
        }
        return
      }

      if (this.isAtLineEnd()) {
        this.moveToNextLineStart()
      } else {
        this.shiftCursorRight()
      }
    }
  }

  moveRightAfterWrite(): void {
    this.shiftCursorRight()
  }

  moveDown(): void {
    if (this.state.pindex && this.state.caret) {
      const el = this.paragraphElement(this.state.pindex)
      const y = this.getCoords(
        el,
        this.state.paragraphList[this.state.pindex].length
      )[1]
      if (
        y === this.state.caret.y &&
        this.state.pindex + 1 < this.state.paragraphList.length
      ) {
        // move to next paragraph, retain cursor x position
        this.moveToParagraphStartSnapX(this.state.pindex + 1)
        return
      } else if (y > this.state.caret.y) {
        // move to next line, retain cursor x position
        this.moveToNextLineSnapX()
        return
      }
    }
  }

  moveLeft(): void {
    if (this.state.pindex && this.state.caret) {
      if (this.state.caret.offset === 0) {
        const pindex = this.state.pindex - 1
        if (pindex >= 0) {
          this.moveToParagraphEnd(pindex)
        }
        return
      }

      if (this.state.caret.offset - 1 >= 0) {
        const el = this.paragraphElement(this.state.pindex)
        const range = document.createRange()
        range.setStart(el.childNodes[0], 0)
        range.setEnd(el.childNodes[0], 0)
        const start = range.getClientRects()[0]
        const x = start.left - 2

        const offset = this.state.caret.offset - 1
        range.setStart(el.childNodes[0], offset)
        range.setEnd(el.childNodes[0], offset)
        const prev = range.getClientRects()[0]
        const y = prev.top - 4

        if (x === this.state.caret.x && y < this.state.caret.y) {
          // first spot at line start
          this.moveToPrevLineEnd()
          return
        } else if (x < this.state.caret.x && y < this.state.caret.y) {
          // second spot at line start
          this.moveToLineStart()
          return
        }
      }

      this.shiftCursorLeft()
    }
  }

  moveLeftAfterDelete(): void {
    if (this.state.caret) {
      if (this.state.caret.offset === 0) {
        return
      }
      this.shiftCursorLeft()
    }
  }

  /* Caret movement */

  componentDidUpdate(): void {
    if (this.state.caret && this.state.direction) {
      switch (this.state.direction) {
        case Direction.Up:
          this.moveUp()
          break
        case Direction.Right:
          this.moveRight()
          break
        case Direction.RightAfterWrite:
          // move after write (simpler)
          this.moveRightAfterWrite()
          break
        case Direction.Down:
          this.moveDown()
          break
        case Direction.Left:
          this.moveLeft()
          break
        case Direction.LeftAfterDelete:
          // move after deletion (+paragraph operations)
          this.moveLeftAfterDelete()
          break
      }
    }
  }

  write(key: string): void {
    if (this.state.pindex && this.state.caret) {
      const newParagraphList = this.state.paragraphList
      let p = this.state.paragraphList[this.state.pindex]
      p = [
        p.slice(0, this.state.caret.offset),
        key,
        p.slice(this.state.caret.offset)
      ].join('')
      newParagraphList[this.state.pindex] = p
      this.setState({
        paragraphList: newParagraphList,
        direction: Direction.RightAfterWrite
      })
    }
  }

  /* doesn't work on highlight */
  delete(): void {
    if (this.state.pindex && this.state.caret) {
      const newParagraphList = this.state.paragraphList

      if (this.state.caret.offset === 0 && this.state.pindex > 0) {
        // join to prev paragraph
        let p = this.state.paragraphList[this.state.pindex - 1]
        const newOffset = p.length
        p = p.concat(this.state.paragraphList[this.state.pindex])
        newParagraphList[this.state.pindex - 1] = p
        newParagraphList.splice(this.state.pindex, 1)
        this.setState({
          paragraphList: newParagraphList // direction?
        })
        return
      }

      let p = this.state.paragraphList[this.state.pindex]
      p = [
        p.slice(0, this.state.caret.offset - 1),
        p.slice(this.state.caret.offset)
      ].join('')
      newParagraphList[this.state.pindex] = p
      this.setState({
        paragraphList: newParagraphList,
        direction: Direction.LeftAfterDelete
      })
    }
  }

  handleKeyDown(event: React.KeyboardEvent): void {
    if (!this.state.caret) {
      return
    }

    if (event.key === 'Enter') {
      //this.setState({ direction: Direction. })
      return
    } else if (event.key === 'Backspace') {
      this.delete()
      return
    } else if (event.key === 'ArrowUp') {
      this.setState({ direction: Direction.Up })
      return
    } else if (event.key === 'ArrowRight') {
      this.setState({ direction: Direction.Right })
      return
    } else if (event.key === 'ArrowDown') {
      this.setState({ direction: Direction.Down })
      return
    } else if (event.key === 'ArrowLeft') {
      this.setState({ direction: Direction.Left })
      return
    } else if (event.key === 'Shift') {
      return
    }

    this.write(event.key)
  }

  setCaret(event: React.MouseEvent): void {
    if (event.target instanceof Element) {
      const el = event.target
      if (el.className !== 'paragraph') {
        this.setState({
          caret: undefined,
          direction: undefined,
          pindex: undefined
        })
        return
      }

      //this.setState({ direction: undefined })

      if (this.state.paragraphList.length === 0) {
      }

      let pindex = 0
      let prev = el.previousSibling
      while (prev) {
        prev = prev.previousSibling
        pindex++
      }

      const offset = window.getSelection()?.focusOffset
      if (offset === undefined) {
        // first line of paragraph
        let [x, y] = this.getCoords(el, 0)
        const caret = { offset: 0, x, y }
        this.setState({ caret, pindex })
      } else {
        // coords for middle
        let [x, y] = this.getCoords(el, offset)

        // coords for sides
        if (offset + 1 < this.state.paragraphList[pindex].length) {
          const range = document.createRange()
          range.setStart(el.childNodes[0], 0)
          range.setEnd(el.childNodes[0], 0)
          const start = range.getClientRects()[0]
          range.setStart(el.childNodes[0], offset + 1)
          range.setEnd(el.childNodes[0], offset + 1)
          const next = range.getClientRects()[0]
          const diff = next.left - start.left
          // could sharpen this... snaps too easily to start
          if (event.clientX <= start.left + diff / 2) {
            x = this.calcLeft(start.left)
            y = this.calcTop(next.top)
          }
        }

        const caret = { offset, x, y }
        this.setState({ caret, pindex })
      }
    }
  }

  convertStyle(style: Style): React.CSSProperties {
    const props: React.CSSProperties = { ...this.state.styleProps }
    if (style.bold) {
      props.fontWeight = 'bold'
    }
    if (style.italic) {
      props.fontStyle = 'italic'
    }
    return props
  }

  render() {
    return (
      <div className="editor">
        <div className="toolbar">
          <button>bold</button>
          <button>italic</button>
        </div>
        <div className="document">
          {this.state.document.getParagraphs().map((p, i) => (
            <p key={`p-${i}`} className="paragraph">
              {p.contents.map((node, j) => (
                <span
                  key={`span-${i}-${j}`}
                  style={this.convertStyle(node.style)}
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

  /*render() {
    return (
      <div className="app">
        <div
          className="editor"
          onClick={this.setCaret}
          onKeyDown={this.handleKeyDown}
          tabIndex={0}
        >
          {this.state.paragraphList.map((p, i) => (
            <p key={i} className="paragraph">
              {p}
            </p>
          ))}
          {this.state.caret && (
            <div
              className="caret"
              style={{
                left: this.state.caret.x + 'px',
                top: this.state.caret.y + 'px'
              }}
            ></div>
          )}
        </div>
      </div>
    )
  }*/
}

export default Editor
