import StateMachine from 'fsm-base/index.mjs'
import CompositeClass from 'composite-class/index.mjs'
import mixInto from 'create-mixin/index.mjs'

class Scope extends Map {
  constructor (iterable, node) {
    super(iterable)
    this.node = node
  }
  get (key) {
    if (this.has(key)) {
      return super.get(key)
    } else if (this.node && this.node.parent) {
      return this.node.parent.scope.get(key)
    }
  }
}

class Node extends mixInto(CompositeClass)(StateMachine) {
  constructor (options = {}) {
    super('pending', [
      { from: 'pending', to: 'in-progress' },
      { from: 'in-progress', to: 'failed' },
      { from: 'in-progress', to: 'successful' },
      { from: 'failed', to: 'complete' },
      { from: 'successful', to: 'complete' },
      { from: 'pending', to: 'cancelled' },
      { from: 'in-progress', to: 'cancelled' }
    ])
    this.scope = new Scope(null, this)
    for (const prop in options.scope) {
      this.scope.set(prop, options.scope[prop])
    }
  }

  process () {
    throw new Error('not implemented')
  }
}

export default Node
