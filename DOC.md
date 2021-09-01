This is a text editor made with React and Typescript. WIP.

## Project structure

```
/src
  /editor
    /caret
      Coords.ts
      Helper.ts
      Mover.ts    // Moves caret (arrow keys)
      Setter.ts   // Sets caret position
    Editor.tsx
    Types.tsx
    Writer.tsx
  App.tsx
```

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
