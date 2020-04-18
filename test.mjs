import TestRunner from 'test-runner'
import Queue from './index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere'
const a = assert.strict

const tom = new TestRunner.Tom()

function createJob (ms, result) {
  return async function () {
    return sleep(ms, result)
  }
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
    jobs: [
      async function () {
        await sleep(50)
        actuals.push(1)
      },
      async function () {
        await sleep(20)
        actuals.push(1.1)
      },
      async function () {
        await sleep(100)
        actuals.push(1.2)
      }
    ],
    maxConcurrency: 3
  })

  const results = await queue.process()
  a.deepEqual(actuals, [1.1, 1, 1.2])
})

tom.test('iterator: maxConcurrency 1', async function () {
  const queue = new Queue({
    jobs: [
      createJob(30, 1),
      createJob(20, 1.1),
      createJob(50, 1.2)
    ],
    maxConcurrency: 1
  })

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

export default tom