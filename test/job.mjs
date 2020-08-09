import TestRunner from 'test-runner'
import { Job, Queue } from '../index.mjs'
import assert from 'assert'

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

tom.test('job.args', async function () {
  const actuals = []
  const job = new Job()
  job.fn = function (...args) { actuals.push(...args) }
  job.args = [1, 2, 3]
  await job.process()
  a.deepEqual(actuals, [1, 2, 3])
})

tom.test('job.argsFn', async function () {
  const actuals = []
  const job = new Job()
  job.fn = function (...args) { actuals.push(...args) }
  job.argsFn = () => [1, 2, 3]
  await job.process()
  a.deepEqual(actuals, [1, 2, 3])
})

tom.test('.process(args) overrides .args', async function () {
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
  a.deepEqual(actuals, ['in-progress', 1, 'successful'])
})

tom.test('.onSuccess: job, default args', async function () {
  const actuals = []
  const job = new Job({
    name: 'passing-fn',
    fn: () => 'pass'
  })
  job.onSuccess = new Job({ fn: (result, parent) => actuals.push(result, parent.name) })
  await job.process()
  a.deepEqual(actuals, ['pass', 'passing-fn'])
})

export default tom
