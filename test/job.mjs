import TestRunner from 'test-runner'
import { Job, Queue } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere/index.mjs'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('sync function', async function () {
  const actuals = []
  const job = new Job(() => { actuals.push(1) })
  await job.process()
  a.deepEqual(actuals, [1])
})

tom.test('async function', async function () {
  const actuals = []
  const job = new Job(async () => { actuals.push(1) })
  await job.process()
  a.deepEqual(actuals, [1])
})

tom.test('onFail', async function () {
  const actuals = []
  const job = new Job(() => {
    throw new Error('broken')
  })
  job.onFail = new Job(() => actuals.push(1))
  await job.process()
  a.deepEqual(actuals, [1])
})

tom.todo('onFail: conditional', async function () {
  const actuals = []
  const job = new Job(() => {
    throw new Error('broken')
  })
  job.onFailCondition = /broken/
  job.onFail = new Job(() => actuals.push(1))
  await job.process()
  a.deepEqual(actuals, [1])
})

export default tom
