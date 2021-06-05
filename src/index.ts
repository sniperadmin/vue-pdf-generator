// SECTION: General imports
import {
  createRenderer,
  compile,
  defineComponent,
  defineAsyncComponent,
  RendererOptions,
  h
} from 'vue'
import PDFDocument from 'pdfkit'
import * as fs from 'fs'
// !SECTION

// SECTION: custom imports
import { PDFNode } from './vnode/PDFNode'
import { PDFTextNode } from './vnode/PDFTextNode'
// !SECTION

// SECTION: services imports
import definePDFComponent from './services/DefinePDFComponent'
// !SECTION

// SECTION: class definitions
class PDFElement extends PDFNode {}
class PDFTextElement extends PDFElement {}
class PDFViewElement extends PDFElement {}
class PDFDocumentElement extends PDFElement {}
// !SECTION

// SECTION: type definitions
type PDFNodes = PDFTextNode
type PDFElements = PDFTextElement | PDFViewElement | PDFDocumentElement
// !SECTION

const pdf = new PDFDocument()
const stream = pdf.pipe(fs.createWriteStream('../file.pdf'))

// NOTE: Define Tags to be compiled
const View = definePDFComponent('View')
const Text = definePDFComponent('Text')
// TODO: add document later
const Document = definePDFComponent('Document') 

// SECTION: create app obj
const App = defineComponent({
  components: {
    'Text': Text,
    'View': View,
    'Document': Document
  },
  render: compile(`
    <Document>
      <View>
        <Text :styles="{color: 'red'}">some text</Text>
        <Text>some text</Text>
      </View>
    </Document>
  `)
})


function noop(fn: string): any {
  throw Error(`no-op: ${fn}`)
}

// NOTE: define nodemap record and node options
const nodeMap: Record<string, PDFNodes | PDFElements> = {}

const nodeOps: RendererOptions<PDFNodes, PDFElements> = {
  patchProp: (el, key, prevVal, nextVal) => {
    if (key === 'styles') {
      el.styles = { ...el.styles, ...nextVal }
    }

    // console.log('patchProp', { el, key, prevVal, nextVal});
  },

  insert: (child, parent, anchor) => {
    if (parent instanceof PDFDocumentElement) {
      parent.id = 'root';
      nodeMap['root'] = parent;
    }

    if(!(child.id in nodeMap)) {
      nodeMap[child.id] = child;
    }

    parent.children.push(child.id);
    child.parent = parent.id;

    console.log('insert', { parent, child });
  },

  createElement: (tag) => {
    if (tag === 'Document') {
      return new PDFDocumentElement()
    }

    if (tag === 'View') {
      return new PDFViewElement()
    }

    if (tag === 'Text') {
      return new PDFTextElement()
    }


    console.log(`createElement: ${tag}`);

    throw Error(`Invalid tag ${tag}`)
  },

  createText: (text) => {
    // console.log(`createText: ${text}`);
    return new PDFTextNode(text);
  },

  parentNode: () => noop('parentNode'),
  createComment: () => noop('createComment'),
  setText: () => noop('setText'),
  setElementText: () => noop('setElementText'),
  nextSibling: () => noop('nextSibling'),
  querySelector: () => noop('querySelector'),
  setScopeId: () => noop('setScopeId'),
  cloneNode: () => noop('cloneNode'),
  insertStaticContent: () => noop('insertStaticContent'),
  forcePatchProp: () => noop('forcePatchProp'),
  remove: () => noop('remove'),
}

// NOTE: create renderer with the options
const { createApp } = createRenderer(nodeOps)

// This approach is better than const app = createApp(App)
// Because we do have nested components definitions
const app = createApp({
  render: () => h(App)
})

const root = new PDFDocumentElement()

// NOTE: for debugging
const vm = app.mount(root)
// console.log(vm.$.subTree);

const defaultStyles: any = {
  color: 'black'
}

const getParentStyle: Function = (attr: string, parent: PDFNodes | PDFElements): any => {
  if (parent instanceof PDFDocumentElement) {
    return defaultStyles[attr]
  }

  if (parent && attr in parent.styles) {
    return parent.styles[attr]
  }

  if (parent)
    return getParentStyle(attr, nodeMap[parent.parent!])
}

const draw = (node: PDFNodes | PDFElements) => {
  const color = getParentStyle('color', node)
  pdf.fill(color)

  if (node) {
    // assign styles here is a must!
    for (const [key, val] of Object.entries(node.styles)) {
      if (key === 'color') {
        // console.log('color');
        pdf.fill(val)
      }
    }
  }

  if (node instanceof PDFTextNode) {
    // console.log('text');
    pdf.text(node.text)
  }
}

const walk = (node: PDFNodes | PDFElements) => {
  if (node instanceof PDFElement) {
    // NOTE: this generates ERR (Max callstack size limit reached)
    // for (const child of node.children) {
    //   draw(nodeMap[child]);
    //   walk(nodeMap[child]);
    // }

    for (let i = 0; i < node.children.length; i++) {
      draw(nodeMap[i])
      walk(nodeMap[i])
    }
  }
}

pdf.fontSize(40)
walk(nodeMap['root']);
// console.log(nodeMap);

pdf.end()
stream.on('finish', () => {
  'pdf printed'
})
