import { insertNewline } from '../../editor/Writer'
import { normal, bold, italic, randomStyle } from '../../editor/Examples'

describe('function insertNewline: Inserts a newline correctly', () => {
  test('In an empty paragraph', () => {
    const originalStyle = randomStyle()
    const copy = { ...originalStyle } // Remove object reference
    const example = [[{ style: copy, text: '' }]]
    const status = { pindex: 0, sindex: 0, offset: 0 }

    insertNewline(example, status)

    // Check status
    expect(status.pindex).toEqual(1)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check paragraphs
    expect(example.length).toEqual(2)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text.length).toEqual(0)

    // Check style
    expect(example[status.pindex][status.sindex].style).toEqual(originalStyle)
  })

  test('In the start of a paragraph with one node', () => {
    const originalStyle = randomStyle()
    const copy = { ...originalStyle } // Remove object reference
    const text = 'example'
    const example = [[{ style: copy, text }]]
    const status = { pindex: 0, sindex: 0, offset: 0 }

    insertNewline(example, status)

    // Check status
    expect(status.pindex).toEqual(1)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check that there are two paragraphs
    expect(example.length).toEqual(2)
    // Check that the first paragraph is empty
    expect(example[status.pindex - 1].length).toEqual(1)
    expect(example[status.pindex - 1][0].text.length).toEqual(0)
    // Check that the second paragraph contains the text now
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual(text)

    // Check style
    expect(example[status.pindex][status.sindex].style).toEqual(originalStyle)
  })

  test('In the end of a paragraph with one node', () => {
    const originalStyle = randomStyle()
    const copy = { ...originalStyle } // Remove object reference
    const text = 'example'
    const example = [[{ style: copy, text }]]
    const status = { pindex: 0, sindex: 0, offset: text.length }

    insertNewline(example, status)

    // Check status
    expect(status.pindex).toEqual(1)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check that there are two paragraphs
    expect(example.length).toEqual(2)
    // Check that the first paragraph is the same
    expect(example[status.pindex - 1].length).toEqual(1)
    expect(example[status.pindex - 1][0].text).toEqual(text)
    // Check that the second paragraph is empty
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text.length).toEqual(0)

    // Check style
    expect(example[status.pindex][status.sindex].style).toEqual(originalStyle)
  })

  test('Between two nodes', () => {
    const textA = 'Node A'
    const textB = 'Node B'
    const example = [
      [
        { style: bold(), text: textA },
        { style: italic(), text: textB }
      ]
    ]
    const status = { pindex: 0, sindex: 0, offset: textA.length }

    insertNewline(example, status)

    // Check status
    expect(status.pindex).toEqual(1)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check that there are two paragraphs
    expect(example.length).toEqual(2)
    // Check that the first paragraph contains only the first node
    expect(example[status.pindex - 1].length).toEqual(1)
    expect(example[status.pindex - 1][0].text).toEqual(textA)
    // Check that the second paragraph contains only the second node
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual(textB)

    // Check styles
    expect(example[status.pindex - 1][0].style).toEqual(bold())
    expect(example[status.pindex][status.sindex].style).toEqual(italic())
  })

  test('In the middle of a node', () => {
    const originalStyle = randomStyle()
    const copy = { ...originalStyle } // Remove object reference
    const textA = 'Node A'
    const textB = 'Node B'
    const text = textA.concat(textB)
    const example = [[{ style: copy, text }]]
    const status = { pindex: 0, sindex: 0, offset: textA.length }

    insertNewline(example, status)

    // Check status
    expect(status.pindex).toEqual(1)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check that there are two paragraphs
    expect(example.length).toEqual(2)
    // Check that the first paragraph contains the right text
    expect(example[status.pindex - 1].length).toEqual(1)
    expect(example[status.pindex - 1][0].text).toEqual(textA)
    // Check that the second paragraph contains the right text
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual(textB)

    // Check styles
    expect(example[status.pindex - 1][0].style).toEqual(originalStyle)
    expect(example[status.pindex][status.sindex].style).toEqual(originalStyle)
  })
})
