import {
  defineComponent,
  h
} from 'vue'

const definePDFComponent = (tag: string) => {
  const comp = defineComponent({
    name: tag,
    render() {
      return h(tag, this.$attrs, this.$slots?.default?.() || [])
    }
  })

  return comp
}

export default definePDFComponent
