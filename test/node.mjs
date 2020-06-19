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

export default tom
