import StateMachine from 'fsm-base/index.mjs'
import CompositeClass from 'composite-class/index.mjs'
import mixInto from 'create-mixin/index.mjs'

class Node extends mixInto(CompositeClass)(StateMachine) {
  process () {
    throw new Error('not implemented')
  }
}

export default Node
