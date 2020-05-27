import TestRunner from 'test-runner'
import { Job } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere/index.mjs'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('simple function', async function () {
  const actuals = []
  const job = new Job(function () {
    actuals.push(1)
  })
  await job.process()
  a.deepEqual(actuals, [1])
})

export default tom
