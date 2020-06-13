import { Queue, Job } from '../index.mjs'

class Loop extends Queue {
  constructor (options = {}) {
    super(options)
    this.type = 'loop'
    this.forEach = options.forEach
    this.for = options.for
    /**
     * A new instance will be created on each iteration.
     */
    this.Node = options.Node
  }

  async process () {
    /* build queue children */
    if (this.for) {
      const { var: varName, of: iterable } = this.for()
      for (const i of iterable) {
        const node = new this.Node()
        node.name = 'loop'
        node.scope.set(varName, i)
        this.add(node)
      }
    } else if (this.forEach) {
      const iterable = this.forEach()
      for (const i of iterable) {
        const node = new this.Node()
        node.name = 'loop'
        const args = this.args(i)
        node.args = node.args || args
        this.add(node)
      }
    }
    /* process queue */
    return super.process()
  }
}

export default Loop
