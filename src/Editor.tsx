import { Component, MouseEvent } from 'react'

type EditorProps = {}

type EditorOptions = {
  lineHeight: number
}

type Cursor = {
  offset: number
  x: number
  y: number
}

enum Direction {
  Up,
  Down,
  Left,
  Right
}

type EditorState = {
  options: EditorOptions
  cursor?: Cursor
  direction?: Direction
  pindex?: number
  paragraphList: Array<string>
}

class Editor extends Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props)
    this.state = {
      options: { lineHeight: 28 },
      paragraphList: [
        'This is an example text.',
        'Another one.',
        'This example positions a "highlight" rectangle behind the contents of a range. The range\'s content starts here and continues on until it ends here. The bounding client rectangle contains everything selected in the range.',
        'More text.',
        'Should be scrolling soon.',
        'The European languages are members of the same family. Their separate existence is a myth. For science, music, sport, etc, Europe uses the same vocabulary. The languages only differ in their grammar, their pronunciation and their most common words.'
      ]
    }

    this.setCursor = this.setCursor.bind(this)
  }

  calcLeft(left: number) {
    return left - 1
  }

  calcTop(top: number) {
    return top - 4
  }

  getCoords(el: Element, offset: number) {
    const range = document.createRange()
    range.setStart(el.childNodes[0], offset)
    range.setEnd(el.childNodes[0], offset)
    const rect = range.getClientRects()[0]
    const x = this.calcLeft(rect.left)
    const y = this.calcTop(rect.top)
    return [x, y]
  }

  // scroll event not checked!!
  handleKeyDown(event: KeyboardEvent) {
    if (this.state.cursor === undefined) {
      return
    }
  }

  setCursor(event: MouseEvent) {
    event.preventDefault()
    if (event.target instanceof Element) {
      const el = event.target
      if (el.className !== 'paragraph') {
        this.setState({
          cursor: undefined,
          direction: undefined,
          pindex: undefined
        })
        return
      }

      //this.setState({ direction: undefined })

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
        const cursor: Cursor = { offset: 0, x, y }
        this.setState({ cursor, pindex })
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

        const cursor = { offset, x, y }
        this.setState({ cursor, pindex })
      }
    }
  }

  render() {
    return (
      <div className="editor" onClick={this.setCursor}>
        {this.state.paragraphList.map((p, i) => (
          <div key={i} className="paragraph">
            {p}
          </div>
        ))}
        {this.state.cursor && (
          <div
            className="cursor"
            style={{
              left: this.state.cursor.x + 'px',
              top: this.state.cursor.y + 'px'
            }}
          ></div>
        )}
      </div>
    )
  }
}

export default Editor
