import TestRunner from 'test-runner'
import { Node } from '../index.mjs'
import assert from 'assert'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('scope', async function () {
  const node = new Node({
    scope: { value: 'a' }
  })
  a.equal(node.scope.get('value'), 'a')
})

tom.test('scope level 2', async function () {
  const one = new Node({
    scope: { value: 1 }
  })
  const two = new Node({
    scope: { value: 2 }
  })
  const three = new Node()
  one.add(two)
  one.add(three)
  a.equal(one.scope.get('value'), 1)
  a.equal(two.scope.get('value'), 2)
  a.equal(three.scope.get('value'), 1)
})

export default tom
