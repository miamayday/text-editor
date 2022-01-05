import { deleteCharacter } from '../../../editor/Writer'
import { normal, bold, italic } from '../../../editor/Examples'

describe('function deleteCharacter: Deletes a character correctly', () => {
  test('From an empty node', () => {
    const example = [[{ style: normal(), text: '' }]]
    const status = { pindex: 0, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text.length).toEqual(0)
  })

  test('From a node with one character', () => {
    const example = [[{ style: normal(), text: 'A' }]]
    const status = { pindex: 0, sindex: 0, offset: 1 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text.length).toEqual(0)
  })

  test('From a node with two characters', () => {
    const example = [[{ style: normal(), text: 'AB' }]]
    const status = { pindex: 0, sindex: 0, offset: 2 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual('A')
  })

  test('From a node with one character, next to a previous node', () => {
    const example = [
      [
        { style: normal(), text: 'A' },
        { style: bold(), text: 'B' }
      ]
    ]

    const status = { pindex: 0, sindex: 1, offset: 1 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual('A')
  })

  test('From a node with one character, between two nodes with the same style', () => {
    const example = [
      [
        { style: normal(), text: 'A' },
        { style: bold(), text: 'B' },
        { style: normal(), text: 'C' }
      ]
    ]

    const status = { pindex: 0, sindex: 1, offset: 1 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual('AC')
  })

  test('From a node with one character, between two nodes with different styles', () => {
    const example = [
      [
        { style: normal(), text: 'A' },
        { style: bold(), text: 'B' },
        { style: italic(), text: 'C' }
      ]
    ]

    const status = { pindex: 0, sindex: 1, offset: 1 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(2)
    expect(example[status.pindex][status.sindex].text).toEqual('A')
    expect(example[status.pindex][status.sindex + 1].text).toEqual('C')
  })

  test('From an empty paragraph, with the previous paragraph ending in the same style', () => {
    const example = [
      [{ style: normal(), text: 'A' }],
      [{ style: normal(), text: '' }]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual('A')

    // Check style
    const style = example[status.pindex][status.sindex].style
    expect(style).toEqual(normal())
  })

  test('From an empty paragraph, with the previous paragraph ending in a different style', () => {
    const example = [
      [{ style: italic(), text: 'A' }],
      [{ style: normal(), text: '' }]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual('A')

    // Check style
    const style = example[status.pindex][status.sindex].style
    expect(style).toEqual(italic())
  })

  test('From a paragraph with one node, with the previous paragraph ending in the same style', () => {
    const example = [
      [{ style: normal(), text: 'A' }],
      [{ style: normal(), text: 'B' }]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual('AB')

    // Check style
    const style = example[status.pindex][status.sindex].style
    expect(style).toEqual(normal())
  })

  test('From a paragraph with two nodes, with the previous paragraph ending in the same style', () => {
    const example = [
      [{ style: normal(), text: 'A' }],
      [
        { style: normal(), text: 'B' },
        { style: italic(), text: 'C' }
      ]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(2)
    expect(example[status.pindex][status.sindex].text).toEqual('AB')
    expect(example[status.pindex][status.sindex + 1].text).toEqual('C')

    // Check styles
    expect(example[status.pindex][status.sindex].style).toEqual(normal())
    expect(example[status.pindex][status.sindex + 1].style).toEqual(italic())
  })

  test('From a paragraph with one node, with the previous paragraph ending in a different style', () => {
    const example = [
      [{ style: italic(), text: 'A' }],
      [{ style: normal(), text: 'B' }]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(2)
    expect(example[status.pindex][status.sindex].text).toEqual('A')
    expect(example[status.pindex][status.sindex + 1].text).toEqual('B')

    // Check styles
    expect(example[status.pindex][status.sindex].style).toEqual(italic())
    expect(example[status.pindex][status.sindex + 1].style).toEqual(normal())
  })

  test('From a paragraph with two nodes, with the previous paragraph ending in a different style', () => {
    const example = [
      [{ style: bold(), text: 'A' }],
      [
        { style: normal(), text: 'B' },
        { style: italic(), text: 'C' }
      ]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(3)
    expect(example[status.pindex][status.sindex].text).toEqual('A')
    expect(example[status.pindex][status.sindex + 1].text).toEqual('B')
    expect(example[status.pindex][status.sindex + 2].text).toEqual('C')

    // Check styles
    expect(example[status.pindex][status.sindex].style).toEqual(bold())
    expect(example[status.pindex][status.sindex + 1].style).toEqual(normal())
    expect(example[status.pindex][status.sindex + 2].style).toEqual(italic())
  })

  test('From an empty paragraph, with the previous paragraph being empty (same style)', () => {
    const example = [
      [{ style: normal(), text: '' }],
      [{ style: normal(), text: '' }]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)

    // Check style
    const style = example[status.pindex][status.sindex].style
    expect(style).toEqual(normal())
  })

  test('From an empty paragraph, with the previous paragraph being empty (different style)', () => {
    const example = [
      [{ style: italic(), text: '' }],
      [{ style: normal(), text: '' }]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(0)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)

    // Check style
    // * If both paragraphs are empty, favor the style of the original (deleted) node
    const style = example[status.pindex][status.sindex].style
    expect(style).toEqual(normal())
  })

  test('From an empty paragraph, with the previous paragraph containing one node (same style)', () => {
    const example = [
      [{ style: normal(), text: 'A' }],
      [{ style: normal(), text: '' }]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual('A')

    // Check style
    const style = example[status.pindex][status.sindex].style
    expect(style).toEqual(normal())
  })

  test('From an empty paragraph, with the previous paragraph containing one node (different style)', () => {
    const example = [
      [{ style: italic(), text: 'A' }],
      [{ style: normal(), text: '' }]
    ]

    const status = { pindex: 1, sindex: 0, offset: 0 }

    deleteCharacter(example, status)

    // Check status
    expect(status.pindex).toEqual(0)
    expect(status.sindex).toEqual(0)
    expect(status.offset).toEqual(1)

    // Check paragraphs
    expect(example.length).toEqual(1)
    expect(example[status.pindex].length).toEqual(1)
    expect(example[status.pindex][status.sindex].text).toEqual('A')

    // Check style
    const style = example[status.pindex][status.sindex].style
    expect(style).toEqual(italic())
  })
})
