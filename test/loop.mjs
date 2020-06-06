import TestRunner from 'test-runner'
import { Loop } from '../index.mjs'
import assert from 'assert'
const a = assert.strict

const tom = new TestRunner.Tom()

tom.skip('loop1', async function () {
  const actuals = []
  const loop = new Loop()
  loop.forEach = () => [1, 2, 3]
  loop.fn = function (n) {
    return function (arg) {
      actuals.push(`forEach: ${n}, arg: ${arg}`)
    }
  }
  loop.args = n => [n]
  await loop.process()
  // this.data = actuals
  a.deepEqual(actuals, [ 'forEach: 1, arg: 1', 'forEach: 2, arg: 2', 'forEach: 3, arg: 3' ])
})

tom.test('loop', async function () {
  const actuals = []
  const loop = new Loop()
  loop.forEach = () => [1, 2, 3]
  loop.fn = (n) => actuals.push(n)
  loop.args = ['${i}']
  await loop.process()
  // this.data = actuals
  a.deepEqual(actuals, [1, 2, 3])
})

export default tom
