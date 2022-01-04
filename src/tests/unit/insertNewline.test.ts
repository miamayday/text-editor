import { insertNewline } from '../../editor/Writer'
import { normal, bold, italic } from '../../editor/Examples'

describe('function insertNewline: Inserts a newline correctly', () => {
  test('From an empty paragraph', () => {
    const example = [[{ style: normal(), text: '' }]]
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
  })
})
