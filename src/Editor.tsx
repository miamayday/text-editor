import React from 'react'
import Document from './Document'
import type { Style } from './Document'
import { ReactComponent as BoldIcon } from './assets/bold.svg'
import { ReactComponent as ItalicIcon } from './assets/italic.svg'

type EditorProps = {}

type EditorState = {
  styleProps: React.CSSProperties
  document: Document
}

class Editor extends React.Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props)
    this.state = {
      styleProps: {
        fontStyle: 'normal',
        fontWeight: 'normal'
      },
      document: new Document({})
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
          <BoldIcon className="toolbar-icon" />
          <ItalicIcon className="toolbar-icon" />
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
}

export default Editor
