import React from 'react'
import Editor from './editor/Editor'
import './App.css'

type AppProps = {}

type AppState = {}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event: React.MouseEvent): void {
    if (event.target instanceof HTMLElement) {
      const el = event.target
      if (el.className === 'app') {
        console.log('should vanish caret but how?')
      }
    }
  }

  render() {
    return (
      <div className="app" onClick={this.handleClick}>
        <Editor />
      </div>
    )
  }
}

export default App
