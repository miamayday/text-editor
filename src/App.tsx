import React from 'react'
import './App.css'

type EditorProps = {}

type EditorState = {
  paragraphList: Array<string>
}

class Editor extends React.Component<EditorProps, EditorState> {
  state: EditorState = {
    paragraphList: [
      'This is an example text.',
      'Another one.',
      'This example positions a "highlight" rectangle behind the contents of a range. The range\'s content starts here and continues on until it ends here. The bounding client rectangle contains everything selected in the range.',
      'More text.',
      'Should be scrolling soon.',
      'The European languages are members of the same family. Their separate existence is a myth. For science, music, sport, etc, Europe uses the same vocabulary. The languages only differ in their grammar, their pronunciation and their most common words.'
    ]
  }
  render() {
    return (
      <div className="editor">
        {this.state.paragraphList.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    )
  }
}

type MyProps = {}

type MyState = {}

class App extends React.Component<MyProps, MyState> {
  state: MyState = {}
  render() {
    return (
      <div className="app">
        <Editor />
      </div>
    )
  }
}

export default App
