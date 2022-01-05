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

export function wertherExtract() {
  const extract =
    'When, while the lovely valley teems with vapour around me, and the meridian sun strikes the upper surface of the impenetrable foliage of my trees, and but a few stray gleams steal into the inner sanctuary, I throw myself down among the tall grass by the trickling stream; and, as I lie close to the earth, a thousand unknown plants are noticed by me: when I hear the buzz of the little world among the stalks, and grow familiar with the countless indescribable forms of the insects and flies, then I feel the presence of the Almighty, who formed us in his own image, and the breath of that universal love which bears and sustains us, as it floats around us in an eternity of bliss; and then, my friend, when darkness overspreads my eyes, and heaven and earth seem to dwell in my soul and absorb its power, like the form of a beloved mistress, then I often think with longing, Oh, would I could describe these conceptions, could impress upon paper all that is living so full and warm within me, that it might be the mirror of my soul, as my soul is the mirror of the infinite God!'
  return [[{ style: italic(), text: extract }]]
}

export function kafkaExctract() {
  const extract =
    'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked.'
  return [[{ style: italic(), text: extract }]]
}

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
  const n10: TextNode = { style: normal(), text: '' }
  const n11: TextNode = {
    style: normal(),
    text: 'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections.'
  }

  return [
    [n1, n2, n3, n4, n5],
    //[n6],
    [n7],
    [n8],
    [n9],
    [n10],
    [n11],
    navigationExamples()
  ]
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
  [n6],
  [n7],
  [n8],
  [n9]
]

function navigationExamples() {
  return [
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
}
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
