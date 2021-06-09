import React from 'react'
import Editor from './editor/Editor'
import './App.css'

type AppProps = {}

type AppState = {}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
  }

  render() {
    return <Editor />
  }
}

export default App
