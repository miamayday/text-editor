import { writeCharacter } from '../../editor/Writer'
import { examples, generateExamples } from '../../editor/Examples'
import { Status, TextNode, Style } from '../../editor/Types'

let paragraphs: Array<Array<TextNode>> = []

const characters =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateIndex(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateKey() {
  return characters.charAt(Math.floor(Math.random() * characters.length))
}

function generateStyle() {
  const bold = Math.round(Math.random()) === 1 ? false : true
  const italic = Math.round(Math.random()) === 1 ? false : true
  return { bold, italic }
}

function chooseDifferentStyle(s1: Style, s2: Style) {
  const style = { ...s1 }
  if (s1.bold === s2.bold) {
    style.bold = !style.bold
    return style
  } else if (s1.italic === s2.italic) {
    style.italic = !style.italic
    return style
  } else {
    style.bold = !style.bold
    return style
  }
}

function printBeforeWrite(status: Status, key: string, style: Style) {
  console.log(
    `
    Key to be written: ${key}
    Status: ${status.pindex} ${status.sindex} ${status.offset}
    Editor style:
    – bold: ${style.bold}
    – italic: ${style.italic}
    `
  )
}

describe('writeCharacter: Writes a character correctly', () => {
  beforeEach(() => {
    paragraphs = generateExamples()
  })

  test('When styles match', () => {
    const pindex = generateIndex(0, paragraphs.length - 1)
    const sindex = generateIndex(0, paragraphs[pindex].length - 1)
    const offset = generateIndex(0, paragraphs[pindex][sindex].text.length)
    const status = { offset, pindex, sindex }
    const key = generateKey()
    const editorStyle = paragraphs[pindex][sindex].style

    printBeforeWrite(status, key, editorStyle)
    writeCharacter(paragraphs, status, key, editorStyle)
    console.log(paragraphs)

    const node = paragraphs[status.pindex][status.sindex]

    expect(node.text[status.offset - 1]).toMatch(key)
  })

  test('When merging with the next node', () => {
    let pindex = generateIndex(0, paragraphs.length - 1)
    let sindex = generateIndex(0, paragraphs[pindex].length - 1)

    while (sindex === paragraphs[pindex].length - 1) {
      pindex = generateIndex(0, paragraphs.length - 1)
      sindex = generateIndex(0, paragraphs[pindex].length - 1)
    }

    const offset = paragraphs[pindex][sindex].text.length
    const status = { offset, pindex, sindex }
    const key = generateKey()
    const editorStyle = paragraphs[pindex][sindex + 1].style

    printBeforeWrite(status, key, editorStyle)
    writeCharacter(paragraphs, status, key, editorStyle)
    console.log(paragraphs)

    const node = paragraphs[status.pindex][status.sindex]

    expect(node.text[status.offset - 1]).toMatch(key)
  })

  test('When inserting a new node to the end of another', () => {
    let pindex = generateIndex(0, paragraphs.length - 1)
    let sindex = generateIndex(0, paragraphs[pindex].length - 1)

    while (sindex === paragraphs[pindex].length - 1) {
      pindex = generateIndex(0, paragraphs.length - 1)
      sindex = generateIndex(0, paragraphs[pindex].length - 1)
    }

    const offset = paragraphs[pindex][sindex].text.length
    const status = { offset, pindex, sindex }
    const key = generateKey()

    const prevStyle = paragraphs[pindex][sindex].style
    const nextStyle = paragraphs[pindex][sindex + 1].style
    const editorStyle = chooseDifferentStyle(prevStyle, nextStyle)

    printBeforeWrite(status, key, editorStyle)
    writeCharacter(paragraphs, status, key, editorStyle)
    console.log(paragraphs)

    const node = paragraphs[status.pindex][status.sindex]

    expect(node.text[status.offset - 1]).toMatch(key)
  })

  test('When splitting the current node and inserting a new one', () => {
    let pindex = generateIndex(0, paragraphs.length - 1)
    let sindex = generateIndex(0, paragraphs[pindex].length - 1)

    while (paragraphs[pindex][sindex].text.length < 3) {
      pindex = generateIndex(0, paragraphs.length - 1)
      sindex = generateIndex(0, paragraphs[pindex].length - 1)
    }

    const offset = generateIndex(1, paragraphs[pindex][sindex].text.length - 1)
    const status = { offset, pindex, sindex }
    const key = generateKey()
    const editorStyle = { ...paragraphs[pindex][sindex].style }
    editorStyle.bold = !editorStyle.bold

    printBeforeWrite(status, key, editorStyle)
    writeCharacter(paragraphs, status, key, editorStyle)
    console.log(paragraphs)

    const node = paragraphs[status.pindex][status.sindex]

    expect(node.text[status.offset - 1]).toMatch(key)
  })

  test('When inserting a new node to the end of a paragraph', () => {
    let pindex = generateIndex(0, paragraphs.length - 1)
    let sindex = paragraphs[pindex].length - 1

    while (paragraphs[pindex][sindex].text.length === 0) {
      pindex = generateIndex(0, paragraphs.length - 1)
      sindex = paragraphs[pindex].length - 1
    }

    const offset = paragraphs[pindex][sindex].text.length
    const status = { offset, pindex, sindex }
    const key = generateKey()
    const editorStyle = { ...paragraphs[pindex][sindex].style }
    editorStyle.bold = !editorStyle.bold

    printBeforeWrite(status, key, editorStyle)
    writeCharacter(paragraphs, status, key, editorStyle)
    console.log(paragraphs)

    const node = paragraphs[status.pindex][status.sindex]

    expect(node.text[status.offset - 1]).toMatch(key)
  })

  test('When writing to an empty paragraph', () => {
    let pindex = generateIndex(0, paragraphs.length - 1)
    let sindex = 0

    while (paragraphs[pindex][sindex].text.length !== 0) {
      pindex = generateIndex(0, paragraphs.length - 1)
      sindex = 0
    }

    const offset = 0
    const status = { offset, pindex, sindex }
    const key = generateKey()
    const editorStyle = { ...paragraphs[pindex][sindex].style }
    editorStyle.bold = !editorStyle.bold

    printBeforeWrite(status, key, editorStyle)
    writeCharacter(paragraphs, status, key, editorStyle)
    console.log(paragraphs)

    const node = paragraphs[status.pindex][status.sindex]

    expect(node.text[status.offset - 1]).toMatch(key)
  })
})
