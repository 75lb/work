import { Queue, Job } from '../index.mjs'

class Loop extends Queue {
  constructor (options = {}) {
    super(options)
    this.type = 'loop'
    this.forEach = options.forEach
    this.Node = options.Node
  }

  async process () {
    /* build queue children */
    const iterable = this.forEach()
    for (const i of iterable) {
      const node = new this.Node()
      node.name = 'loop'
      const args = this.args(i)
      node.args = node.args || args
      this.add(node)
    }
    /* process queue */
    return super.process()
  }
}

export default Loop
