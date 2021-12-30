import { deleteCharacter } from '../../editor/Writer'
import { generateExamples } from '../../editor/Examples'
import { Status, TextNode, Style } from '../../editor/Types'

function generateIndex(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function normal(): Style {
  return { bold: false, italic: false }
}

function bold(): Style {
  return { bold: true, italic: false }
}

function italic(): Style {
  return { bold: false, italic: true }
}

function bolditalic(): Style {
  return { bold: true, italic: true }
}

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
})
