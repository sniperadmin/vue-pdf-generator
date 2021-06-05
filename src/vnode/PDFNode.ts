export class PDFNode {
  id = (Math.random() * 1000).toFixed(0)
  parent?: string
  children: string[] = []
  styles: Record<string, string>
  constructor() {
    this.styles = {}
  }
}
