import TestRunner from 'test-runner'
import { Loop, Job } from '../index.mjs'
import assert from 'assert'
const a = assert.strict

const tom = new TestRunner.Tom()

tom.test('loop: forEach', async function () {
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
  a.deepEqual(actuals, [1, 'arg: 1', 2, 'arg: 2', 3, 'arg: 3'])
})

tom.test('loop: for', async function () {
  const actuals = []
  const loop = new Loop()
  loop.for = () => ({ var: 'n', of: [1, 2, 3] })
  loop.Node = class LoopJob extends Job {
    constructor (options) {
      super(options)
      this.argsFn = function () { return [this.scope.get('n')] }
    }
    fn (n) {
      actuals.push(n)
    }
  }
  await loop.process()
  a.deepEqual(actuals, [1, 2, 3])
})

export default tom
