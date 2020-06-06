import TestRunner from 'test-runner'
import { Loop, Job } from '../index.mjs'
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

tom.skip('loop2', async function () {
  const actuals = []
  const loop = new Loop()
  loop.forEach = () => [1, 2, 3]
  loop.fn = (n) => actuals.push(n)
  loop.args = ['${i}']
  await loop.process()
  // this.data = actuals
  a.deepEqual(actuals, [1, 2, 3])
})

tom.test('loop', async function () {
  const actuals = []
  const loop = new Loop()
  loop.forEach = () => [1, 2, 3]
  loop.Node = class LoopJob extends Job {
    fn (a, b) {
      actuals.push(a, b)
    }
  }
  loop.args = i => [i, `arg: ${i}`]
  await loop.process()
  // this.data = actuals
  a.deepEqual(actuals, [1, 'arg: 1', 2, 'arg: 2', 3, 'arg: 3'])
})

export default tom
