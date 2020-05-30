import TestRunner from 'test-runner'
import { Planner, Job } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere/index.mjs'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('toModel(job): invoke', async function () {
  const planner = new Planner()
  planner.addService({
    job1: n => { actuals.push(n) },
    job2: n => { actuals.push(n) },
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'job1',
    args: 1,
    onFail: {
      type: 'job',
      invoke: 'job2'
    }
  })
  a.equal(result.fn, planner.services.default.job1)
  a.equal(result.onFail.fn, planner.services.default.job2)
})

tom.test('toModel(job): fn', async function () {
  const planner = new Planner()
  const job1 = n => { actuals.push(n) }
  const job2 = n => { actuals.push(n) }
  const result = planner.toModel({
    type: 'job',
    fn: job1,
    args: 1,
    onFail: {
      type: 'job',
      fn: job2
    }
  })
  a.equal(result.fn, job1)
  a.equal(result.onFail.fn, job2)
})

tom.test('toModel(job): fn, invoke', async function () {
  const planner = new Planner()
  const job1 = n => { actuals.push(n) }
  planner.addService({
    job2: n => { actuals.push(n) },
  })
  const result = planner.toModel({
    type: 'job',
    fn: job1,
    args: 1,
    onFail: {
      type: 'job',
      invoke: 'job2'
    }
  })
  a.equal(result.fn, job1)
  a.equal(result.onFail.fn, planner.services.default.job2)
})

tom.test('single job invocation', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: n => { actuals.push(n) }
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
    job1: n => { actuals.push(n) }
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

tom.test('addService: default', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: n => actuals.push(n)
  })
  a.ok(planner.services.default.job1)
})

tom.test('addService: merge into default', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: n => actuals.push(n)
  })
  planner.addService({
    job2: n => actuals.push(n)
  })
  a.ok(planner.services.default.job1)
  a.ok(planner.services.default.job2)
})

tom.test('addService: named', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService('service1', {
    job1: n => actuals.push(n)
  })
  a.ok(!planner.services.default.job1)
  a.ok(planner.services.service1.job1)
})

tom.test('addService: named and default', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService('service1', {
    job1: n => actuals.push(n)
  })
  planner.addService({
    job2: n => actuals.push(n)
  })
  a.ok(!planner.services.default.job1)
  a.ok(planner.services.default.job2)
  a.ok(planner.services.service1.job1)
  a.ok(!planner.services.service1.job2)
})

tom.todo('template store', async function () {
  planner.addTemplate('name', function () {
    return {
      type: 'job',
      invoke: 'fetchFromCache',
      args: [user.github, 'githubUser', 'githubUser'],
      onFail: {
        type: 'queue',
        queue: [
          {
            type: 'job',
            invoke: 'collectGithubUser'
          },
          {
            type: 'job',
            invoke: 'updateCache',
            args: [user.github, 'githubUser', 'githubUser']
          }
        ]
      }
    }
  })
})

export default tom
