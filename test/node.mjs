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

tom.test('Validation: onFail', async function () {
  const node = new Node()
  node.onFail = 'invalid'
  a.rejects(
    () => node.process(),
    /onFail must be a valid Node instance/
  )
})

export default tom
