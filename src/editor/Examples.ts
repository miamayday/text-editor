/* This file contains the example paragraphs used in the editor */

import { Style, TextNode } from './Types'

export function normal(): Style {
  return { bold: false, italic: false }
}

export function bold(): Style {
  return { bold: true, italic: false }
}

export function italic(): Style {
  return { bold: false, italic: true }
}

export function bolditalic(): Style {
  return { bold: true, italic: true }
}

export function randomStyle(): Style {
  const bold = Math.random() < 0.5
  const italic = Math.random() < 0.5
  return { bold, italic }
}

/*type Options = {
  nodes: number
}

function generateParagraphs(options: Array<number>) {
  const paragraphs: Array<Array<TextNode>> = []
  for (const nodeCount of options) {
    const paragraph: Array<TextNode> = []
    for (let i = 0; i < nodeCount; i++) {
      const node: TextNode = {}
    }
  }
}*/

export function generateExamples() {
  const n1: TextNode = {
    style: normal(),
    text: 'This is an example text with '
  }
  const n2: TextNode = { style: bold(), text: 'bold' }
  const n3: TextNode = { style: normal(), text: ' and ' }
  const n4: TextNode = { style: italic(), text: 'italic' }
  const n5: TextNode = {
    style: normal(),
    text: ' elements. This is the se co   nd line of the first paragraph.'
  }
  const n7: TextNode = {
    style: italic(),
    text: 'This is another paragraph with text.'
  }
  const n8: TextNode = { style: normal(), text: '' }
  const n9: TextNode = {
    style: normal(),
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus placerat eleifend iaculis. Morbi orci urna, tristique in auctor id, ultrices sed neque. Suspendisse eget neque orci. Cras sed tempor nulla. Sed congue arcu id suscipit viverra. Vestibulum sit amet commodo erat. Sed egestas blandit ex, eget suscipit diam semper non. Sed id sagittis purus. Aenean placerat sapien id ultrices congue. Morbi congue lorem sed felis molestie, id porta justo pellentesque.'
  }

  return [[n1, n2, n3, n4, n5], [n7], [n8], [n9]]
}

const n1: TextNode = { style: normal(), text: 'This is an example text with ' }
const n2: TextNode = { style: bold(), text: 'bold' }
const n3: TextNode = { style: normal(), text: ' and ' }
const n4: TextNode = { style: italic(), text: 'italic' }
const n5: TextNode = {
  style: normal(),
  text: ' elements. This is the se co   nd line of the first paragraph.'
}
const n6: TextNode = { style: normal(), text: '' }
const n7: TextNode = {
  style: italic(),
  text: 'This is another paragraph with text.'
}
const n8: TextNode = { style: normal(), text: '' }
const n9: TextNode = {
  style: normal(),
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus placerat eleifend iaculis. Morbi orci urna, tristique in auctor id, ultrices sed neque. Suspendisse eget neque orci. Cras sed tempor nulla. Sed congue arcu id suscipit viverra. Vestibulum sit amet commodo erat. Sed egestas blandit ex, eget suscipit diam semper non. Sed id sagittis purus. Aenean placerat sapien id ultrices congue. Morbi congue lorem sed felis molestie, id porta justo pellentesque.'
}

export const examples: Array<Array<TextNode>> = [
  [n1, n2, n3, n4, n5],
  //[n6],
  [n7],
  [n8],
  [n9]
]

/* These only work when navigating, editing doesn't work because they refer to each other
[
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4,
    n3,
    n2,
    n3,
    n4
  ]
*/
