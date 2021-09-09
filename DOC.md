This is a text editor made with React and Typescript. WIP.

## Components

- Setter: Sets the caret closest to where user clicked.
- Mover: Moves the caret according to arrow keys.
- Writer: Writes a character to the current position, inserts a newline, or deletes content.

## Project structure

App.tsx loads the Editor from Editor.tsx.

Editor contains example paragraphs.
Monitored events:

- Click on tooltips (bold/italic)
- Click on editor window: Positions caret
- Click outside editor window: Vanishes caret
- Press key: Moves caret/Writes to caret position

Caret position is manually calculated.

- offset: window.getSelection().focusOffset
  > The Selection.focusOffset read-only property returns the number of characters that the selection's focus is offset within the Selection.
- pindex: Paragraph index
- sindex: Span index
  Paragraphs are div elements that consist of span elements. A span element is a text node with a uniform style (bold/italic).
