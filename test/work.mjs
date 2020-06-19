import TestRunner from 'test-runner'
import { Work, Job, Queue, Planner, Loop } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('work plan', async function () {
  const actuals = []
  const work = new Work()
  work.ctx = {
    data: {
      githubUser: {},
      npmPackages: [],
      githubRepos: []
    }
  }

  class Api {
    collectRepos () {
      actuals.push('collectRepos')
    }
  }

  /* Plan can invoke methods on any actor */
  work.addService('api', new Api())

  /* default service */
  work.addService({
    fetchFromCache: async function (...args) {
      actuals.push('fetchFromCache', ...args)
      throw new Error('not found in cache')
    },
    fetchUserFromRemote: async function (...args) {
      actuals.push('fetchUserFromRemote', ...args)
    },
    updateCache: async function (...args) {
      actuals.push('updateCache', ...args)
    },
    displayData: function (...args) {
      actuals.push('displayData', ...args)
    },
    one: function () {
      actuals.push('ONE')
    },
    two: function () {
      actuals.push('TWO')
    }
  })

  work.setPlan({
    name: 'buildPage',
    type: 'queue',
    maxConcurrency: 1,
    queue: [
      {
        name: 'collectData',
        type: 'queue',
        maxConcurrency: 1,
        queue: [
          {
            name: 'collectUser',
            type: 'job',
            invoke: 'fetchFromCache',
            args: ['user'],
            onFail: {
              name: 'failQueue',
              type: 'queue',
              maxConcurrency: 1,
              queue: [
                { type: 'job', invoke: 'fetchUserFromRemote' },
                { type: 'job', invoke: 'updateCache', args: ['user'] }
              ]
            }
          },
          {
            type: 'job',
            service: 'api',
            invoke: 'collectRepos'
          },
          {
            type: 'template',
            repeatForEach: function () {
              return ['one', 'two']
            },
            template: (item) => ({
              type: 'job',
              invoke: item
            })
          }
        ]
      },
      {
        type: 'job',
        invoke: 'displayData'
      }
    ]
  })

  await work.process()
  a.deepEqual(actuals, [
    'fetchFromCache',
    'user',
    'fetchUserFromRemote',
    'updateCache',
    'user',
    'collectRepos',
    'ONE',
    'TWO',
    'displayData'
  ])
})

tom.test('test-runner style: exception handling', async function () {
  const actuals = []
  const work = new Work()

  work.stats = {
    commands: 3,
    invocations: 3,
    pending: 10,
    inProgress: 2,
    complete: 14,
    success: 13,
    fail: 1
  }

  work.addService({
    logger: arg => actuals.push(arg),
    failLogger: (err, job) => actuals.push(err.message, job.name)
  })

  work.setPlan({
    name: 'testSuite',
    type: 'queue',
    maxConcurrency: 1,
    queue: [
      {
        name: 'file1-before',
        type: 'queue',
        queue: [
          {
            type: 'job',
            invoke: 'logger',
            args: 'before'
          }
        ]
      },
      {
        name: 'file1',
        type: 'queue',
        maxConcurrency: 1,
        queue: [
          {
            type: 'job',
            invoke: 'logger',
            args: 'one'
          },
          {
            name: 'failing-test',
            type: 'job',
            fn: () => { throw new Error('failed') },
            onFail: {
              type: 'job',
              invoke: 'failLogger'
            }
          }
        ]
      },
      {
        name: 'file1-after',
        type: 'queue',
        queue: [
          {
            type: 'job',
            invoke: 'logger',
            args: 'after'
          }
        ]
      },
      {
        name: 'file2',
        type: 'queue',
        queue: [
          {
            name: 'stressTest',
            type: 'template',
            repeatForEach: [1, 2, 3],
            template: n => ({
              type: 'job',
              invoke: 'logger',
              args: [`template: ${n}`]
            })
          }
        ]
      }
    ]
  })

  work.on('fail', async function (err, job) {
    actuals.push(err.message)
  })

  await work.process()
  a.deepEqual(actuals, [
    'before',
    'one',
    'failed',
    'failing-test',
    'after',
    'template: 1',
    'template: 2',
    'template: 3'
  ])
})

tom.test('createContext()', async function () {
  const actuals = []
  const work = new Work()
  work.on('ctx-read', (prop, val) => {
    actuals.push(`ctx-read: ${prop}, ${val}`)
  })
  work.on('ctx-write', (prop, val) => {
    actuals.push(`ctx-write: ${prop}, ${val}`)
  })
  const ctx = work.createContext()
  ctx.something = 1
  actuals.push('read: ' + ctx.something)
  // this.data = actuals
  a.deepEqual(actuals, ['ctx-write: something, 1', 'ctx-read: something, 1', 'read: 1'])
})

tom.test('scope', async function () {
  const actuals = []
  const job = new Job({
    fn: function () {
      actuals.push(this.scope.value)
    },
    scope: {
      value: 'a'
    }
  })
  await job.process()
  a.deepEqual(actuals, ['a'])
})

tom.test('scope, level 2', async function () {
  const actuals = []
  const queue = new Queue({ scope: { value: 'a' } })
  queue.add(new Job({
    fn: function () {
      actuals.push(this.scope.value)
    },
    scope: {
      value: 'b'
    }
  }))
  queue.add(new Job({
    fn: function () {
      actuals.push(this.scope.value)
    },
    scope: {}
  }))
  await queue.process()
  // this.data = actuals
  a.deepEqual(actuals, ['b', 'a'])
})

tom.test('complex model', async function () {
  const actuals = []

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

  const loop = new Loop()
  loop.for = () => ({ var: 'org', of: ['org1', 'org2'] })
  loop.Node = class OrgQueue extends Queue {
    constructor (options) {
      super(options)
      /* get data */
      this.add(new Job({
        fn: cache.fetch.bind(cache),
        argsFn: function () {
          return ['75lb', `perOrg:${this.scope.org}`]
        },
        onFail: new Queue({
          name: 'refresh',
          jobs: [
            new Job({
              fn: cache.collect.bind(cache),
              args: '75lb'
            }),
            new Job({
              fn: cache.update.bind(cache),
              argsFn: function () {
                return ['75lb', `perOrg:${this.scope.org}`]
              }
            })
          ]
        })
      }))
      /* display data */
      this.add(new Job({
        fn: cache.display
      }))
    }
  }

  await loop.process()
  // this.data = actuals
  a.deepEqual(actuals, [
    ['fetch', '75lb', 'perOrg:org1'],
    ['collect', '75lb'],
    ['update', '75lb', 'perOrg:org1'],
    ['display'],
    ['fetch', '75lb', 'perOrg:org2'],
    ['collect', '75lb'],
    ['update', '75lb', 'perOrg:org2'],
    ['display']
  ])
})

export default tom

/*
- define util functions (the toolkit, e.g. fetch from cache), the tests (the workload) and the strategy separately.
- The toolkit
  - A collection of abitrary utility functions.
- The "staff" (actors, third-party services)
  - An actor brings his own toolkit.
- The workload
  - A collection of commands to run.
- The context
  - The current environment and conditions.
- The strategy
  - a strategy defines which tests are run, if any, and in which order, with which concurrency
  - each step in the strategy has a onSuccess, onFail, onComplete linking to next step.
- A workload is executed using supplied strategy
- A KPI.
- High visibility of workload execution, measuring performance and efficiency.
  - For each job in progress
    - which tools and services it uses
    - The context data it reads and writes
*/

/*

*/
