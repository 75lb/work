import { Queue } from '../index.mjs'

class Loop extends Queue {
  constructor (options = {}) {
    super(options)
    this.type = 'loop'
    this.for = options.for
    /**
     * A new instance will be created on each iteration.
     */
    this.Node = options.Node
  }

  async _process (...fnArgs) {
    if (this.for) {
      const { var: varName, of: iterable } = await this.for()
      for (const i of iterable) {
        const node = new this.Node()
        this.add(node)
        node.scope[varName] = i
        const args = this._getArgs(fnArgs, i)
        node.args = node.args || args
      }
    }
    return super._process()
  }
}

export default Loop
