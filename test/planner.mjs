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
    job2: n => { actuals.push(n) }
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
  a.equal(result.fn.name, 'bound job1')
  a.equal(result.onFail.fn.name, 'bound job2')
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
    job2: n => { actuals.push(n) }
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
  a.equal(result.onFail.fn.name, 'bound job2')
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

tom.test('template: evaluated immediately', async function () {
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

tom.todo('template: deferred evaluation', async function () {
  const actuals = []
  const ctx = {}
  const planner = new Planner(ctx)
  planner.addService({
    job1: n => actuals.push(n)
  })
  const root = planner.toModel({
    type: 'queue',
    queue: [
      {
        type: 'job',
        fn: () => {
          /* add items at run time */
          ctx.items = [1, 2, 3]
        }
      },
      {
        type: 'template',
        repeatForEach: () => ctx.items,
        template: n => ({
          type: 'job',
          invoke: 'job1',
          args: n
        })
      }
    ]
  })
  await root.process()
  this.data = actuals
  // a.deepEqual(actuals, [1, 2, 3])
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

tom.test('loop: simple job', async function () {
  const actuals = []
  const ctx = {
    items: [1, 2, 3],
    args: n => n
  }
  const planner = new Planner(ctx)
  planner.addService({
    job1: n => actuals.push(n)
  })
  const result = planner.toModel({
    type: 'loop',
    for: { var: 'n', of: 'items' },
    node: {
      type: 'job',
      invoke: 'job1'
    },
    argsFn: 'args'
  })
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, [1, 2, 3])
})

tom.test('loop: job with scope args', async function () {
  const actuals = []
  const ctx = {
    items: [1],
    args: n => n
  }
  const planner = new Planner(ctx)
  planner.addService({
    job1: n => actuals.push(n)
  })
  const result = planner.toModel({
    type: 'loop',
    for: { var: 'n', of: 'items' },
    scope: { one: 'A' },
    node: {
      type: 'job',
      invoke: 'job1',
      args: ['•one']
    },
    argsFn: 'args'
  })
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, ['A'])
})

tom.test('loop: complex', async function () {
  const actuals = []
  const ctx = {
    orgs: () => [{ id: 1 }, { id: 2 }]
  }
  const planner = new Planner(ctx)
  class Cache {
    fetch (pk, sk) {
      actuals.push(['fetch', pk, sk])
      throw new Error('failed')
    }

    update (pk, sk) {
      actuals.push(['update', pk, sk])
    }

    collect (user) {
      actuals.push(['collect', user])
    }

    display () {
      actuals.push(['display'])
    }
  }
  const cache = new Cache()
  planner.addService('cache', cache)

  const result = planner.toModel({
    type: 'loop',
    for: { var: 'org', of: 'orgs' },
    node: {
      name: 'contributionsPerOrg',
      type: 'queue',
      queue: [
        {
          type: 'job',
          service: 'cache',
          invoke: 'fetch',
          args: ['75lb', "contributionsPerOrg:•{org.id}"],
          onFail: {
            type: 'queue',
            name: 'refresh',
            queue: [
              {
                type: 'job',
                service: 'cache',
                invoke: 'collect',
                args: '75lb'
              },
              {
                type: 'job',
                service: 'cache',
                invoke: 'update',
                args: ['75lb', "contributionsPerOrg:•{org.id}"]
              }
            ]
          }
        },
        {
          type: 'job',
          service: 'cache',
          invoke: 'display'
        }
      ]
    }
  })
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, [
    [ 'fetch', '75lb', 'contributionsPerOrg:1' ],
    [ 'collect', '75lb' ],
    [ 'update', '75lb', 'contributionsPerOrg:1' ],
    [ 'display' ],
    [ 'fetch', '75lb', 'contributionsPerOrg:2' ],
    [ 'collect', '75lb' ],
    [ 'update', '75lb', 'contributionsPerOrg:2' ],
    [ 'display' ]
  ])
})

tom.test('scope access in args, template access', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: (...args) => { actuals.push(...args) }
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'job1',
    args: ['•{two}']
  })
  result.scope.two = 2
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, ['2'])
})

tom.test('scope access in args, dot syntax', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: (...args) => { actuals.push(...args) }
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'job1',
    args: ['•two']
  })
  result.scope.two = 2
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, [2])
})

tom.test('scope access in args, dot syntax, deep', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: (...args) => { actuals.push(...args) }
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'job1',
    args: ['•obj.two[0]']
  })
  result.scope.obj = { two: [2] }
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, [2])
})

tom.test('scope access in args, dot syntax, deep, embedded', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: (...args) => { actuals.push(...args) }
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'job1',
    args: ['prefix: •{obj.two[0]}']
  })
  result.scope.obj = { two: [2] }
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, ['prefix: 2'])
})

tom.test('scope access in args, dot syntax, deep, string-embedded, nested', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    job1: (...args) => { actuals.push(...args) }
  })
  const result = planner.toModel({
    type: 'queue',
    queue: [
      {
        type: 'job',
        invoke: 'job1',
        args: ['prefix: •{obj.two[0]}']
      }
    ]
  })
  result.scope.obj = { two: [2] }
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, ['prefix: 2'])
})

export default tom
