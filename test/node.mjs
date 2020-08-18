import TestRunner from 'test-runner'
import { Node } from '../index.mjs'
import assert from 'assert'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('scope', async function () {
  const node = new Node({
    scope: { value: 'a' }
  })
  a.equal(node.scope.value, 'a')
})

tom.test('scope level 2', async function () {
  const root = new Node({
    scope: { value: 1 }
  })
  const one = new Node({
    scope: { value: 2 }
  })
  const two = new Node()
  root.add(one)
  root.add(two)
  a.equal(root.scope.value, 1)
  a.equal(one.scope.value, 2)
  a.equal(two.scope.value, 1)
})

tom.test('scope: onSuccess has access to parent scope', async function () {
  const actuals = []
  const node = new Node({
    scope: { value: 'a' },
    _process: function () {
      actuals.push(this.scope.value)
    },
    onSuccess: new Node({
      _process: function () {
        actuals.push(this.scope.value + '2')
      }
    })
  })
  await node.process()
  a.deepEqual(actuals, ['a', 'a2'])
})

tom.test('skipIf', async function () {
  const actuals = []
  const one = new Node({
    fn: () => actuals.push('ok'),
    skipIf: true
  })
  await one.process()
  a.deepEqual(actuals, [])
})

tom.test('onSuccess: called', async function () {
  const actuals = []

  class Root extends Node {
    _process () {
      actuals.push(this.constructor.name)
    }
  }
  class Success extends Node {
    _process () {
      actuals.push(this.constructor.name)
    }
  }

  const onSuccess = new Success()
  const root = new Root({ onSuccess })

  await root.process()
  a.deepEqual(actuals, ['Root', 'Success'])
  a.equal(root.state, 'successful')
  a.equal(onSuccess.state, 'successful')
})

tom.test('onSuccess: args', async function () {
  const actuals = []

  class Root extends Node {
    _process () {
      return 'ok'
    }
  }
  class Success extends Node {
    _process (...processArgs) {
      const args = this._getArgs(processArgs)
      actuals.push(...args)
    }
  }

  const onSuccess = new Success()
  const root = new Root({ onSuccess })

  await root.process()
  a.deepEqual(actuals, ['ok', root])
})

tom.test('onSuccess: not called', async function () {
  const actuals = []

  class Root extends Node {
    _process () {
      actuals.push(this.constructor.name)
      throw new Error('broken')
    }
  }
  class Success extends Node {
    _process () {
      actuals.push(this.constructor.name)
    }
  }

  const onSuccess = new Success()
  const root = new Root({ onSuccess })

  await a.rejects(
    async () => await root.process(),
    /broken/
  )

  a.deepEqual(actuals, ['Root'])
  a.equal(root.state, 'failed')
  a.equal(onSuccess.state, 'pending')
})

tom.test('onSuccess: fails', async function () {
  const actuals = []

  class Root extends Node {
    _process () {
      actuals.push(this.constructor.name)
    }
  }
  class Success extends Node {
    _process () {
      actuals.push(this.constructor.name)
      throw new Error('broken')
    }
  }

  const onSuccess = new Success()
  const root = new Root({ onSuccess })

  await a.rejects(
    async () => await root.process(),
    /broken/
  )

  a.deepEqual(actuals, ['Root', 'Success'])
  a.equal(root.state, 'failed')
  a.equal(onSuccess.state, 'failed')
})

tom.test('onSuccess: parent node returns onSuccess return value', async function () {
  class TestNode extends Node {
    _process () {
      return this.constructor.name
    }
  }
  class TestNode2 extends Node {
    _process () {
      return this.constructor.name
    }
  }

  const node = new TestNode({ onSuccess: new TestNode2() })
  const result = await node.process()
  a.equal(result, 'TestNode2')
})

tom.test('onFail: parent node returns onFail return value', async function () {
  class TestNode extends Node {
    _process () {
      throw new Error('broken')
    }
  }
  class TestNode2 extends Node {
    _process () {
      return this.constructor.name
    }
  }

  const node = new TestNode({ onFail: new TestNode2() })
  const result = await node.process()
  a.equal(result, 'TestNode2')
})

tom.test('onFail: conditional match', async function () {
  const actuals = []
  const node = new Node({
    _process: function () {
      throw new Error('broken')
    },
    onFailCondition: /broken/,
    onFail: new Node({
      _process: () => actuals.push(1)
    })
  })
  await node.process()
  a.deepEqual(actuals, [1])
})

tom.test('onFail: conditional miss', async function () {
  const actuals = []
  const node = new Node({
    _process: function () {
      throw new Error('broken')
    },
    onFailCondition: /something-else/,
    onFail: new Node({
      _process: () => actuals.push(1)
    })
  })
  await a.rejects(
    () => node.process(),
    /broken/
  )
  a.deepEqual(actuals, [])
})

tom.test('Validation: onFail', async function () {
  const node = new Node()
  node.onFail = 'invalid'
  a.rejects(
    () => node.process(),
    /onFail must be a valid Node instance/
  )
})

tom.test('global: accessible in onSuccess', async function () {
  const actuals = []
  const node = new Node({
    scope: { value: 'a' },
    _process: function () {
      actuals.push(this.global.value)
    },
    onSuccess: new Node({
      _process: function () {
        actuals.push(this.global.value + '2')
      }
    })
  })
  await node.process()
  a.deepEqual(actuals, ['a', 'a2'])
})

tom.test('finally: passing', async function () {
  const actuals = []
  class TestNode extends Node {
    _process () {
      return 'ok'
    }
  }
  class NodeOnSuccess extends Node {
    _process (arg) {
      actuals.push(arg)
      return 'onSuccess'
    }
  }
  class NodeOnFinally extends Node {
    _process (arg) {
      actuals.push(arg)
      return 'finally'
    }
  }

  const node = new TestNode({
    onSuccess: new NodeOnSuccess(),
    finally: new NodeOnFinally(),
  })
  const result = await node.process()
  a.equal(result, 'finally')
  a.deepEqual(actuals, ['ok', 'onSuccess'])
})

tom.test('finally: failing', async function () {
  const actuals = []
  class TestNode extends Node {
    _process () {
      throw new Error('broken')
    }
  }
  class NodeOnFail extends Node {
    _process (err) {
      actuals.push(err.message)
      return 'onFail'
    }
  }
  class NodeOnFinally extends Node {
    _process (arg) {
      actuals.push(arg)
      return 'finally'
    }
  }

  const node = new TestNode({
    onFail: new NodeOnFail(),
    finally: new NodeOnFinally(),
  })
  const result = await node.process()
  a.equal(result, 'finally')
  a.deepEqual(actuals, ['broken', 'onFail'])
})

export default tom
