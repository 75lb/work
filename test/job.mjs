import TestRunner from 'test-runner'
import { Job, Queue } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere/index.mjs'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('sync function', async function () {
  const actuals = []
  const job = new Job({ fn: () => { actuals.push(1) } })
  await job.process()
  a.deepEqual(actuals, [1])
})

tom.test('async function', async function () {
  const actuals = []
  const job = new Job({ fn: async () => { actuals.push(1) } })
  await job.process()
  a.deepEqual(actuals, [1])
})

tom.test('sync job onFail: sync job', async function () {
  const actuals = []
  const job = new Job({
    name: 'failing-fn',
    fn: () => {
      throw new Error('broken')
    }
  })
  job.onFail = new Job({ fn: (err, job) => actuals.push(err.message, job.name) })
  await job.process()
  a.deepEqual(actuals, ['broken', 'failing-fn'])
})

tom.test('async job onFail: sync job', async function () {
  const actuals = []
  const job = new Job({
    name: 'failing-fn',
    fn: async () => {
      throw new Error('broken')
    }
  })
  job.onFail = new Job({ fn: (err, job) => actuals.push(err.message, job.name) })
  await job.process()
  a.deepEqual(actuals, ['broken', 'failing-fn'])
})

tom.test('async job onFail: queue', async function () {
  const actuals = []
  const job = new Job({
    fn: async () => {
      throw new Error('broken')
    }
  })
  const failQueue = new Queue()
  failQueue.add(new Job({ fn: () => actuals.push(1) }))
  job.onFail = failQueue
  await job.process()
  a.deepEqual(actuals, [1])
})

tom.todo('onFail: conditional', async function () {
  const actuals = []
  const job = new Job()
  job.fn = () => {
    throw new Error('broken')
  }
  job.onFailCondition = /broken/
  job.onFail = new Job({ fn: () => actuals.push(1) })
  await job.process()
  a.deepEqual(actuals, [1])
})

tom.test('job.args', async function () {
  const actuals = []
  const job = new Job()
  job.fn = function (...args) { actuals.push(...args) }
  job.args = [1, 2, 3]
  await job.process()
  a.deepEqual(actuals, [1, 2, 3])
})

tom.skip('.process(args)', async function () {
  const actuals = []
  const job = new Job({ fn: (...args) => { actuals.push(...args) } })
  job.args = [-1, -2, -3]
  await job.process(1, 2, 3)
  a.deepEqual(actuals, [1, 2, 3])
})

tom.test('events', async function () {
  const actuals = []
  const job = new Job({ fn: (...args) => { actuals.push(...args) } })
  job.args = [1]
  job.on('state', (state) => actuals.push(state))
  await job.process()
  a.deepEqual(actuals, [ 'in-progress', 1, 'successful' ])
})

export default tom
