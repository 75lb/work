import TestRunner from 'test-runner'
import { Queue, Job, Node } from 'work'
import assert from 'assert'
import sleep from 'sleep-anywhere'
const a = assert.strict

const tom = new TestRunner.Tom()

function createJob (ms, result, name) {
  return new Job({
    name,
    fn: async function () {
      return sleep(ms, result)
    }
  })
}

tom.test('.process(): maxConcurrency 1', async function () {
  const queue = new Queue({
    jobs: [
      createJob(30, 1),
      createJob(20, 1.1),
      createJob(50, 1.2)
    ],
    maxConcurrency: 1
  })

  const results = await queue.process()
  a.deepEqual(results, [1, 1.1, 1.2])
})

tom.test('.process(): events', async function () {
  const actuals = []
  const queue = new Queue({
    jobs: [
      createJob(1, 'job1', 'job1'),
      createJob(1, 'job2', 'job2'),
      createJob(1, 'job3', 'job3')
    ],
    maxConcurrency: 1,
    name: 'queue1'
  })

  queue.on('state', function (value, prev) {
    actuals.push([this.name, value, prev, Object.assign({}, queue.jobStats)])
  })
  queue.on('successful', function (target, result) {
    actuals.push(['successful', target.name, result])
  })

  await queue.process()
  // this.data = actuals
  a.deepEqual(actuals, [
   [
     'queue1',
     'in-progress',
     'pending',
     { total: 3, complete: 0, active: 0 }
   ],
   [
     'job1',
     'in-progress',
     'pending',
     { total: 3, complete: 0, active: 1 }
   ],
   [
     'job1',
     'successful',
     'in-progress',
     { total: 3, complete: 0, active: 1 }
   ],
   [ 'successful', 'job1', 'job1' ],
   [
     'job2',
     'in-progress',
     'pending',
     { total: 3, complete: 1, active: 1 }
   ],
   [
     'job2',
     'successful',
     'in-progress',
     { total: 3, complete: 1, active: 1 }
   ],
   [ 'successful', 'job2', 'job2' ],
   [
     'job3',
     'in-progress',
     'pending',
     { total: 3, complete: 2, active: 1 }
   ],
   [
     'job3',
     'successful',
     'in-progress',
     { total: 3, complete: 2, active: 1 }
   ],
   [ 'successful', 'job3', 'job3' ],
   [
     'queue1',
     'successful',
     'in-progress',
     { total: 3, complete: 3, active: 0 }
   ],
   [ 'successful', 'queue1', [ 'job1', 'job2', 'job3' ] ]
 ])
})

tom.test('.process(): maxConcurrency 3, results still in job order', async function () {
  const queue = new Queue({
    jobs: [
      createJob(50, 1),
      createJob(20, 1.1),
      createJob(100, 1.2)
    ],
    maxConcurrency: 3
  })

  const results = await queue.process()
  a.deepEqual(results, [1, 1.1, 1.2])
})

tom.test('.process(): maxConcurrency 3, job finish order correct', async function () {
  const actuals = []
  const queue = new Queue({
    maxConcurrency: 3
  })
  queue.add(new Job({
    fn: async () => {
      await sleep(50)
      actuals.push(1)
    }
  }))
  queue.add(new Job({
    fn: async () => {
      await sleep(20)
      actuals.push(1.1)
    }
  }))
  queue.add(new Job({
    fn: async () => {
      await sleep(100)
      actuals.push(1.2)
    }
  }))
  await queue.process()
  a.deepEqual(actuals, [1.1, 1, 1.2])
})

tom.test('iterator: maxConcurrency 1', async function () {
  const queue = new Queue({
    maxConcurrency: 1
  })
  queue.add(createJob(30, 1))
  queue.add(createJob(20, 1.1))
  queue.add(createJob(50, 1.2))

  const results = []
  for await (const result of queue) {
    results.push(result)
  }
  a.deepEqual(results, [1, 1.1, 1.2])
})

tom.test('iterator: maxConcurrency 3, results still in job order', async function () {
  const queue = new Queue({
    jobs: [
      createJob(30, 1),
      createJob(20, 1.1),
      createJob(50, 1.2)
    ],
    maxConcurrency: 3
  })

  const results = []
  for await (const result of queue) {
    results.push(result)
  }
  a.deepEqual(results, [1, 1.1, 1.2])
})

tom.test('sync jobs', async function () {
  const queue = new Queue()
  queue.add(new Job({ fn: function () { return 1 } }))
  queue.add(new Job({ fn: function () { return 2 } }))
  const result = await queue.process()
  a.deepEqual(result, [1, 2])
})

tom.test('onFail', async function () {
  const actuals = []
  const queue = new Queue()
  queue.add(new Job({
    fn: () => { throw new Error('broken') }
  }))
  const job = new Job({ fn: () => { actuals.push(1) } })
  queue.onFail = job
  await queue.process()
  a.deepEqual(actuals, [1])
})

tom.test('onFail cancels processing of queue', async function () {
  const actuals = []
  const queue = new Queue({
    jobs: [
      new Job({
        fn: () => { throw new Error('broken') }
      }),
      new Job({ fn: () => { actuals.push('Never reaches here') } })
    ],
    onFail: new Job({ fn: err => actuals.push(1) })
  })
  await queue.process()
  a.deepEqual(actuals, [1])
})

tom.test('job.onFail job completes before queue moves on', async function () {
  const actuals = []
  const queue = new Queue({
    jobs: [
      new Job({
        fn: () => { throw new Error('broken') },
        onFail: new Job({
          fn: async err => {
            await sleep(10)
            actuals.push(err.message)
          }
        })
      }),
      new Job({ fn: () => { actuals.push(3) } })
    ]
  })
  await queue.process()
  a.deepEqual(actuals, ['broken', 3])
})

tom.test('job.onFail queue completes before queue moves on', async function () {
  const actuals = []
  const queue = new Queue({
    jobs: [
      new Job({
        fn: () => { throw new Error('broken') },
        onFail: new Queue({
          jobs: [
            new Job({
              fn: async () => {
                await sleep(10)
                actuals.push('onFail')
              }
            }),
            new Job({
              fn: async () => {
                await sleep(10)
                actuals.push('onFail2')
              }
            })
          ]
        })
      }),
      new Job({ fn: () => { actuals.push(3) } })
    ]
  })
  await queue.process()
  a.deepEqual(actuals, ['onFail', 'onFail2', 3])
})

tom.test('onSuccess', async function () {
  const actuals = []
  const queue = new Queue()
  queue.add(new Job({
    fn: () => { actuals.push(1) }
  }))
  queue.onSuccess = new Job({ fn: () => { actuals.push(2) } })
  await queue.process()
  a.deepEqual(actuals, [1, 2])
})

tom.todo('break', async function () {
  /* queued item can set `.break` to cancel further processing of queue */
})

tom.todo('queue jobs are called with queue.args', async function () {
  /* an onFail queue is called with err in the args, this must be passed to child jobs */
})

export default tom
