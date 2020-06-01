import TestRunner from 'test-runner'
import { Queue, Job } from '../index.mjs'
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
      createJob(1, null, 'job1'),
      createJob(1, null, 'job2'),
      createJob(1, null, 'job3')
    ],
    maxConcurrency: 1,
    name: 'queue1'
  })

  queue.on('state', function (value, prev) {
    actuals.push([this.name, value, prev, Object.assign({}, queue.jobStats)])
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
     [
       'queue1',
       'successful',
       'in-progress',
       { total: 3, complete: 3, active: 0 }
     ]
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
  const results = await queue.process()
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

tom.todo('onFail', async function () {
  const actuals = []
  const queue = new Queue()
  queue.add(new Job(() => {
    throw new Error('broken')
  }))
  queue.onFail = new Job({ fn: () => { actuals.push(1) } })
  await queue.process()
  console.log(actuals)
})

tom.todo('break', async function () {
  /* queued item can set `.break` to cancel further processing of queue */
})

tom.todo('condition', async function () {
  /* only process queue if `.condition` is truthy, e.g. `condition: user.npm` */
})

export default tom
