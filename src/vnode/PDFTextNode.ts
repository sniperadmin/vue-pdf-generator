import { PDFNode } from './PDFNode'

export class PDFTextNode extends PDFNode {
  text: string
  constructor(value: string) {
    super()
    this.text = value
  }
}
