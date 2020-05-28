import TestRunner from 'test-runner'
import { Planner, Job } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere/index.mjs'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('single job invocation', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: n => {
      actuals.push(n)
    }
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'job1',
    args: 1
  })
  await result.process()
  a.deepEqual(actuals, [1])
})

tom.test('single job', async function () {
  const actuals = []
  const planner = new Planner()
  const result = planner.toModel({
    type: 'job',
    fn: n => actuals.push(n),
    args: 1
  })
  await result.process()
  a.deepEqual(actuals, [1])
})

tom.test('single queue', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: n => {
      actuals.push(1)
    }
  })
  const result = planner.toModel({
    type: 'queue',
    queue: [
      {
        type: 'job',
        invoke: 'job1'
      },
      {
        type: 'job',
        invoke: 'job1'
      }
    ]
  })
  await result.process()
  a.deepEqual(actuals, [1, 1])
})

tom.test('nested queue', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: n => {
      actuals.push(n)
    }
  })
  const result = planner.toModel({
    type: 'queue',
    queue: [
      {
        type: 'job',
        invoke: 'job1',
        args: 1
      },
      {
        type: 'queue',
        queue: [
          {
            type: 'job',
            invoke: 'job1',
            args: 2
          }
        ]
      }
    ]
  })
  await result.process()
  a.deepEqual(actuals, [1, 2])
})

tom.test('template', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: n => actuals.push(n)
  })
  const root = planner.toModel({
    type: 'queue',
    queue: [
      {
        type: 'template',
        repeatForEach: () => [1, 2],
        template: n => ({
          type: 'job',
          invoke: 'job1',
          args: n
        })
      }
    ]
  })
  await root.process()
  a.deepEqual(actuals, [1, 2])
})

export default tom
