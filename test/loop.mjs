import TestRunner from 'test-runner'
import { Loop, Job } from '../index.mjs'
import assert from 'assert'
const a = assert.strict

const tom = new TestRunner.Tom()

tom.test('loop: for 1', async function () {
  const actuals = []
  const loop = new Loop()
  loop.for = () => ({ var: 'n', of: [1, 2, 3] })
  loop.scope.n = 'root'
  loop.Node = class LoopJob extends Job {
    constructor (options) {
      super(options)
      this.args = ['arg: •{n}']
    }

    fn (a) {
      actuals.push(a)
    }
  }
  loop.args = ['arg: •{n}']
  await loop.process()
  a.deepEqual(actuals, ['arg: 1', 'arg: 2', 'arg: 3'])
  a.equal(loop.args[0], 'arg: root')
})

tom.test('loop: async for', async function () {
  const actuals = []
  const loop = new Loop()
  loop.for = async function () {
    return { var: 'n', of: [1, 2, 3] }
  }
  loop.scope.n = 'root'
  loop.Node = class LoopJob extends Job {
    constructor (options) {
      super(options)
      this.args = ['arg: •{n}']
    }

    fn (a) {
      actuals.push(a)
    }
  }
  loop.args = ['arg: •{n}']
  await loop.process()
  a.deepEqual(actuals, ['arg: 1', 'arg: 2', 'arg: 3'])
  a.equal(loop.args[0], 'arg: root')
})

tom.test('loop: for, argsFn', async function () {
  const actuals = []
  const loop = new Loop()
  loop.for = () => ({ var: 'n', of: [1, 2, 3] })
  loop.Node = class LoopJob extends Job {
    constructor (options) {
      super(options)
      this.argsFn = function () { return [this.scope.n] }
    }

    fn (n) {
      actuals.push(n)
    }
  }
  await loop.process()
  a.deepEqual(actuals, [1, 2, 3])
})

export default tom
