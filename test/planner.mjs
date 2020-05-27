import TestRunner from 'test-runner'
import { Planner, Job } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere/index.mjs'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('simple', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: new Job(() => {
      actuals.push(1)
    })
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'job1'
  })
  await result.process()
  a.deepEqual(actuals, [1])
})

export default tom
