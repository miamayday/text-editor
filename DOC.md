This is a text editor made with React and Typescript. WIP.

## Editor

Editor contains example paragraphs. A paragraph is defined as an array of text nodes. A text node has a text and a style that can be applied in CSS. Two consequtive text nodes within a paragraph cannot have the same style.

Editor renders a toolbar and a document. The toolbar contains buttons for toggling between styles and status information on the caret position. The document contains the paragraphs. A paragraph is rendered as a div element and a text node is rendered as a span element.

Editor responds to certain events:

- Click on toolbar: Sets editor style (bold/italic)
- Click on document: Positions caret
- Click outside document: Vanishes caret
- Press key: Moves caret according to arrow keys / Writes to caret position

Caret position is manually calculated.

Information related to caret position:

- offset: window.getSelection().focusOffset
  > The Selection.focusOffset read-only property returns the number of characters that the selection's focus is offset within the Selection.
- x: X coordinate relative to document ('left' value in CSS)
- y: Y coordinate relative to document ('top' value in CSS)
- pindex: Paragraph index
- sindex: Span (text node) index

## Editor Components

- editor/caret/Setter: Sets the caret closest to where user clicked.
- editor/caret/Mover: Moves the caret according to arrow keys.
- editor/Writer: Writes a character to the current position, inserts a newline, or deletes content.

## Setter

When the user clicks on the document, the event target is either a paragraph element or a span element. Setter calculates a new caret position for either of the situations.

Caret coordinate calculation requires a span element and an offset. The offset is already known; all that's left to do is to find the span element that corresponds to the offset. This is easy if the event target is a span element, though there are still a couple border cases that need to be checked. If the target is a paragraph element, then the span elements within that paragraph must be searched through.
