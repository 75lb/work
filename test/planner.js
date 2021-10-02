import TestRunner from 'test-runner'
import { Planner } from 'work'
import assert from 'assert'
import sleep from 'sleep-anywhere'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('toModel(job): invoke', async function () {
  const planner = new Planner()
  planner.addService({
    job1: function () {},
    job2: function () {}
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
  const job1 = function () {}
  const job2 = function () {}
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

tom.test('toModel(job): fn, onFail invoke', async function () {
  const planner = new Planner()
  const job1 = function () {}
  planner.addService({
    job2: function () {}
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

tom.test('toModel(job): single job invocation', async function () {
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

tom.test('toModel(job): single job', async function () {
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

tom.test('toModel(queue): single queue', async function () {
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

tom.test('toModel(queue): nested queue', async function () {
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

tom.test('addService: default', async function () {
  const planner = new Planner()
  const service = {
    job1: function () {}
  }
  planner.addService(service)
  a.ok(planner.services.default.job1)
  a.equal(planner.services.default, service)
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
  const planner = new Planner()
  planner.addService('service1', {
    job1: function () {}
  })
  a.ok(!(planner.services.default && planner.services.default.job1))
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
          args: ['75lb', 'contributionsPerOrg:•{org.id}'],
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
                args: ['75lb', 'contributionsPerOrg:•{org.id}']
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
    ['fetch', '75lb', 'contributionsPerOrg:1'],
    ['collect', '75lb'],
    ['update', '75lb', 'contributionsPerOrg:1'],
    ['display'],
    ['fetch', '75lb', 'contributionsPerOrg:2'],
    ['collect', '75lb'],
    ['update', '75lb', 'contributionsPerOrg:2'],
    ['display']
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

tom.test('toModel(factory): fn', async function () {
  const actuals = []
  const planner = new Planner()
  const result = planner.toModel({
    type: 'factory',
    fn: function () {
      return planner.toModel({
        type: 'job',
        fn: () => actuals.push(1)
      })
    }
  })
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, [1])
})

tom.test('toModel(factory): fn, args', async function () {
  const actuals = []
  const planner = new Planner()
  const result = planner.toModel({
    type: 'factory',
    fn: function () {
      return planner.toModel({
        type: 'job',
        fn: (n) => actuals.push(n)
      })
    },
    args: ['•one']
  })
  result.scope.one = 1
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, [1])
})

tom.test('toModel(factory): invoke', async function () {
  const actuals = []
  const planner = new Planner()
  planner.addService({
    one: function () {
      return planner.toModel({
        type: 'job',
        fn: () => actuals.push(1)
      })
    }
  })
  const result = planner.toModel({
    type: 'factory',
    invoke: 'one'
  })
  await result.process()
  // this.data = actuals
  a.deepEqual(actuals, [1])
})

tom.test('plan.result: write result to context, job', async function () {
  const ctx = {}
  const planner = new Planner(ctx)
  const result = planner.toModel({
    type: 'job',
    fn: () => 1,
    result: 'one'
  })

  await result.process()
  a.equal(ctx.one, 1)
})

tom.test('plan.result: write result to context, queue', async function () {
  const ctx = {}
  const planner = new Planner(ctx)
  const result = planner.toModel({
    type: 'queue',
    queue: [
      {
        type: 'job',
        fn: () => 1
      },
      {
        type: 'job',
        fn: () => 2
      }
    ],
    result: 'one'
  })

  await result.process()
  a.deepEqual(ctx.one, [1, 2])
})

tom.test('plan.result: invoke, write result to context', async function () {
  const ctx = {}
  const planner = new Planner(ctx)
  planner.addService({
    fn: () => 1
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'fn',
    result: 'one'
  })

  await result.process()
  a.equal(ctx.one, 1)
})

tom.test('plan.result, scope', async function () {
  const ctx = {}
  const planner = new Planner(ctx)
  const result = planner.toModel({
    type: 'job',
    scope: { n: 2 },
    fn: () => 'test',
    result: 'one-•{n}'
  })

  await result.process()
  a.equal(ctx['one-2'], 'test')
})

tom.test('plan.result: async job, correct ctx on next job', async function () {
  const actuals = []
  const ctx = {}
  const planner = new Planner(ctx)
  const result = planner.toModel({
    type: 'queue',
    queue: [
      {
        type: 'job',
        scope: { n: 2 },
        fn: async function () {
          await sleep(50)
          return 'ok'
        },
        result: 'one'
      },
      {
        type: 'job',
        fn: async function () {
          actuals.push(ctx.one)
        }
      }
    ]
  })

  await result.process()
  a.deepEqual(actuals, ['ok'])
})

tom.test('toModel(job): invoke, onSuccess invoke', async function () {
  const planner = new Planner()
  planner.addService({
    job1: function () {},
    job2: function () {}
  })
  const result = planner.toModel({
    type: 'job',
    invoke: 'job1',
    args: 1,
    onSuccess: {
      type: 'job',
      invoke: 'job2'
    }
  })
  a.equal(result.fn.name, 'bound job1')
  a.equal(result.onSuccess.fn.name, 'bound job2')
})

tom.test('_createContext()', async function () {
  const actuals = []
  const planner = new Planner()
  planner.on('ctx-read', (prop, val) => {
    actuals.push(`ctx-read: ${prop}, ${val}`)
  })
  planner.on('ctx-write', (prop, val) => {
    actuals.push(`ctx-write: ${prop}, ${val}`)
  })
  const ctx = planner._createContext()
  ctx.something = 1
  actuals.push('read: ' + ctx.something)
  // this.data = actuals
  a.deepEqual(actuals, ['ctx-write: something, 1', 'ctx-read: something, 1', 'read: 1'])
})

tom.todo('finally')

export default tom
