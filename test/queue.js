import { Queue } from 'work'
import { strict as a } from 'assert'
import { setTimeout as sleep } from 'node:timers/promises'

const [test, only, skip] = [new Map(), new Map(), new Map()]

function createJob (ms, result, name) {
  class Command {
      async execute () {
        return sleep(ms, result)
      }
    }
  return new Command()
}

test.set('.process(): maxConcurrency 1', async function () {
  const queue = new Queue({
    commands: [
      createJob(30, 1),
      createJob(20, 1.1),
      createJob(50, 1.2)
    ],
    maxConcurrency: 1
  })

  const results = await queue.process()
  a.deepEqual(results, [1, 1.1, 1.2])
})

test.set('.process(): maxConcurrency 3, results still in job order', async function () {
  const queue = new Queue({
    commands: [
      createJob(50, 1),
      createJob(20, 1.1),
      createJob(100, 1.2)
    ],
    maxConcurrency: 3
  })

  const results = await queue.process()
  a.deepEqual(results, [1, 1.1, 1.2])
})

test.set('.process(): maxConcurrency 3, job finish order correct', async function () {
  const actuals = []
  const queue = new Queue({
    maxConcurrency: 3
  })
  queue.add(new class Command {
    async execute () {
      await sleep(50)
      actuals.push(1)
    }
  })
  queue.add(new class Command {
    async execute () {
      await sleep(20)
      actuals.push(1.1)
    }
  })
  queue.add(new class Command {
    async execute () {
      await sleep(100)
      actuals.push(1.2)
    }
  })
  await queue.process()
  a.deepEqual(actuals, [1.1, 1, 1.2])
})

test.set('iterator: maxConcurrency 1', async function () {
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

test.set('iterator: maxConcurrency 3, results still in job order', async function () {
  const queue = new Queue({
    commands: [
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

test.set('Accept a single async function', async function () {
  const queue = new Queue({
    commands: [
      async function execute () {
        return sleep(30, 1)
      },
      async function execute () {
        return sleep(20, 1.1)
      },
      async function execute () {
        return sleep(50, 1.2)
      },
    ],
    maxConcurrency: 3
  })

  const results = []
  for await (const result of queue) {
    results.push(result)
  }
  a.deepEqual(results, [1, 1.1, 1.2])
})

only.set('Accept a single async function with args', async function () {
  async function command (ms, result) {
    return sleep(ms, result)
  }

  const queue = new Queue({ maxConcurrency: 3 })
  queue.add(command, 30, 1)
  queue.add(command, 20, 1.1)
  queue.add(command, 50, 1.2)

  const results = []
  for await (const result of queue) {
    results.push(result)
  }
  a.deepEqual(results, [1, 1.1, 1.2])
})

export { test, only, skip }

