import TestRunner from 'test-runner'
import { Work, Job, Queue, Planner } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('work strategy', async function () {
  const actuals = []
  const work = new Work()
  work.ctx = {
    data: {
      githubUser: {},
      npmPackages: [],
      githubRepos: []
    }
  }

  work.plan = {
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
  }

  class Api {
    collectRepos () {
      actuals.push('collectRepos')
    }
  }

  /* Plan can invoke methods on any actor */
  work.addService(new Api(), 'api')

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

tom.test('test-runner style', async function () {
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

  work.plan = {
    name: 'testSuite',
    type: 'queue',
    maxConcurrency: 1,
    queue: [
      {
        name: 'file1',
        type: 'queue',
        maxConcurrency: 10,
        beforeQueue: {
          type: 'queue',
          queue: [
            {
              type: 'job',
              invoke: 'logger',
              args: 'before'
            }
          ]
        },
        afterQueue: {
          type: 'queue',
          queue: [
            {
              type: 'job',
              invoke: 'logger',
              args: 'after'
            }
          ]
        },
        queue: [
          {
            type: 'job',
            invoke: 'logger',
            args: 'one'
          },
          {
            type: 'job',
            invoke: 'logger',
            args: 'two'
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
  }

  work.on('fail', async function () {

  })

  work.addService({
    logger: console.log
  })

  class DefaultExceptionHandlingStrategy {
    catch (err, component, work) {
      work.emit('fail', err, component)
      throw err
    }
  }

  class KeepGoingStrategy {
    constructor (runner) {
      this.runner = runner
    }

    catch (err, component, work) {
      this.state = 'fail'
      if (this.options.debug) {
        console.error('DEBUG')
        console.error(err)
      }
    }
  }

  // work.exceptionHandlingStrategy = new KeepGoingStrategy({ state: 'pending' })
  await work.process()
})

tom.skip('simple model, job root', async function () {
  const actuals = []
  const root = new Job(() => {
    actuals.push(1)
  })
  const work = new Work()
  await work.process(root)
  a.deepEqual(actuals, [1])
})

tom.skip('simple model, queue root', async function () {
  const actuals = []
  const root = new Queue()
  root.add(new Job(() => {
    actuals.push(1)
  }))
  const work = new Work()
  await work.process(root)
  a.deepEqual(actuals, [1])
})

tom.skip('model from planner', async function () {
  const actuals = []
  const planner = new Planner()
  const model = planner.toModel({
    type: 'job',
    fn: n => actuals.push(n),
    args: 1
  })
  const work = new Work()
  await work.process(model)
  a.deepEqual(actuals, [1])
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

