import { Component } from 'react'
import Editor from './Editor'
import './App.css'

type MyProps = {}

type MyState = {}

class App extends Component<MyProps, MyState> {
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
