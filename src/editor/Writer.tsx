import { WriterProps, TextNode, Style, Direction, Caret } from './Types'

function stylesMatch(s1: Style, s2: Style): Boolean {
  return s1.bold === s2.bold && s1.italic === s2.italic
}

export function Write(
  props: WriterProps,
  key: string,
  style: Style
): {
  caret: Caret
  sindex: number
  paragraphs: Array<Array<TextNode>>
  direction: Direction
} {
  const caret = { ...props.caret }
  let sindex = props.sindex
  const paragraphs = props.paragraphs
  const paragraph = props.paragraphs[props.pindex]
  const node = paragraph[sindex]
  if (stylesMatch(node.style, style)) {
    const text = [
      node.text.slice(0, caret.offset),
      key,
      node.text.slice(caret.offset)
    ].join('')
    node.text = text
    caret.offset++
  } else {
    console.log('styles are different')
    if (sindex + 1 < paragraph.length && caret.offset === node.text.length) {
      const next = paragraph[sindex + 1]
      if (stylesMatch(next.style, style)) {
        // merge with next node
        console.log('merge with next node')
        const next = paragraph[sindex + 1]
        const text = [next.text.slice(0, 1), key, next.text.slice(1)].join('')
        paragraph[sindex + 1].text = text
        caret.offset = 1
        sindex++
      } else {
        // insert new node with different style
        console.log('insert new node with different style')
        const newNode: TextNode = { style, text: key }
        paragraph.splice(sindex + 1, 0, newNode)
        caret.offset = 1
        sindex++
      }
    } else if (caret.offset < node.text.length) {
      // split the current node and insert new
      console.log('split the current node and insert new')
      const text = node.text
      const head = text.slice(0, caret.offset)
      const tail = text.slice(caret.offset)

      const rightNode: TextNode = { style: node.style, text: tail }
      const newNode: TextNode = { style, text: key }

      node.text = head
      paragraph.splice(sindex + 1, 0, newNode)
      paragraph.splice(sindex + 2, 0, rightNode)
      caret.offset = 1
      sindex++
    } else {
      // add new node to the end
      console.log('add new node to the end')
      const newNode: TextNode = { style, text: key }
      paragraph.push(newNode)
      caret.offset = 1
      sindex++
    }
  }

  return { caret, sindex, paragraphs, direction: Direction.Write }
}

export function Delete(props: WriterProps): Object | null {
  if (props.caret.offset === 0 && props.pindex === 0 && props.sindex === 0) {
    // document start
    return null
  }

  /* Paragraph deletion */

  if (props.caret.offset === 0 && props.sindex === 0) {
    // paragraph start
    const left = props.paragraphs[props.pindex - 1]
    const right = props.paragraphs[props.pindex]

    const leftNode = left[left.length - 1]
    const rightNode = right[0]

    // left orig values
    const textLength = leftNode.text.length
    const spanCount = left.length

    if (textLength === 0) {
      // left is empty: right dominates left
      props.paragraphs[props.pindex - 1] = right
      props.paragraphs.splice(props.pindex, 1)
      console.log('right dominates left')
      return {
        caret: { ...props.caret, offset: 0 },
        pindex: props.pindex - 1,
        sindex: props.sindex,
        paragraphs: props.paragraphs,
        direction: Direction.Delete
      }
    } else if (rightNode.text.length === 0) {
      // right is empty: left dominates right
      props.paragraphs.splice(props.pindex, 1)
      console.log('left dominates right')
      return {
        caret: { ...props.caret, offset: textLength },
        pindex: props.pindex - 1,
        sindex: spanCount - 1,
        paragraphs: props.paragraphs,
        direction: Direction.Delete
      }
    }

    // combine spans if they are of the same style
    if (leftNode.style === rightNode.style) {
      leftNode.text = leftNode.text.concat(rightNode.text)
      if (right.length > 1) {
        right.splice(0, 1)
        left.push(...right)
      }
      props.paragraphs.splice(props.pindex, 1)
      console.log('combine spans')
      return {
        caret: { ...props.caret, offset: textLength },
        pindex: props.pindex - 1,
        sindex: spanCount - 1,
        paragraphs: props.paragraphs,
        direction: Direction.Delete
      }
    }

    // combine paragraphs only
    left.push(...right)
    props.paragraphs.splice(props.pindex, 1)
    console.log('combine paragraphs')
    return {
      caret: { ...props.caret, offset: textLength },
      pindex: props.pindex - 1,
      sindex: spanCount - 1,
      paragraphs: props.paragraphs,
      direction: Direction.Delete
    }
  }

  /* Span deletion */

  const node = props.paragraphs[props.pindex][props.sindex]
  const text = [
    node.text.slice(0, props.caret.offset - 1),
    node.text.slice(props.caret.offset)
  ].join('')

  if (text.length === 0 && props.sindex > 0) {
    // delete node
    props.paragraphs[props.pindex].splice(props.sindex, 1)
    console.log('delete node')
    return {
      caret: {
        ...props.caret,
        offset: props.paragraphs[props.pindex][props.sindex - 1].text.length
      },
      pindex: props.pindex,
      sindex: props.sindex - 1,
      paragraphs: props.paragraphs,
      direction: Direction.Delete
    }
  }

  props.paragraphs[props.pindex][props.sindex].text = text
  props.caret.offset--
  if (props.caret.offset < 1 && props.sindex > 0) {
    console.log('adjust placement')
    props.caret.offset =
      props.paragraphs[props.pindex][props.sindex - 1].text.length
    props.sindex--
  } else if (
    props.caret.offset === 0 &&
    props.paragraphs[props.pindex].length > 1
  ) {
    console.log('delete preceding span')
    props.paragraphs[props.pindex].splice(0, 1)
  }

  return {
    caret: props.caret,
    pindex: props.pindex,
    sindex: props.sindex,
    paragraphs: props.paragraphs,
    direction: Direction.Delete
  }
}

export function Newline(props: WriterProps): {
  paragraphs: Array<Array<TextNode>>
  direction: Direction
} {
  console.log('new line:', props)

  const paragraph = props.paragraphs[props.pindex]
  const node = paragraph[props.sindex]
  const text = node.text
  const head = text.slice(0, props.caret.offset)
  const tail = text.slice(props.caret.offset)

  // copy paragraph
  const newParagraph: Array<TextNode> = []
  for (let i = props.sindex; i < paragraph.length; i++) {
    newParagraph.push(paragraph[i])
  }

  // copy node
  const style: Style = { ...node.style }
  const newNode: TextNode = { style, text: tail }
  newParagraph[0] = newNode

  paragraph[props.sindex].text = head
  paragraph.length = props.sindex + 1

  const paragraphs = props.paragraphs
  paragraphs[props.pindex] = paragraph
  paragraphs.splice(props.pindex + 1, 0, newParagraph)

  return { paragraphs, direction: Direction.NewLine }
}
