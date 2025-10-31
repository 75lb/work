import { Queue } from 'work'
import { strict as a } from 'assert'
import sleep from 'sleep-anywhere'

const [test, only, skip] = [new Map(), new Map(), new Map()]

class Command {
  async execute (ms, result) {
    return sleep(ms, result)
  }
}

test.set('.process(): maxConcurrency 1', async function () {
  const queue = new Queue({ maxConcurrency: 1 })
  queue.add(new Command(), 30, 1)
  queue.add(new Command(), 20, 1.1)
  queue.add(new Command(), 50, 1.2)

  const results = await queue.process()
  a.deepEqual(results, [1, 1.1, 1.2])
})

test.set('.process(): maxConcurrency 3, results still in job order', async function () {
  const queue = new Queue({ maxConcurrency: 3 })
  queue.add(new Command(), 50, 1)
  queue.add(new Command(), 20, 1.1)
  queue.add(new Command(), 100, 1.2)

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
  const queue = new Queue({ maxConcurrency: 3 })
  queue.add(new Command(), 30, 1)
  queue.add(new Command(), 20, 1.1)
  queue.add(new Command(), 50, 1.2)

  const results = []
  for await (const result of queue) {
    results.push(result)
  }
  a.deepEqual(results, [1, 1.1, 1.2])
})

test.set('Accept a single async function', async function () {
  const queue = new Queue({ maxConcurrency: 3 })

  queue.add(async function execute () {
    return sleep(30, 1)
  })
  queue.add(async function execute () {
    return sleep(20, 1.1)
  })
  queue.add(async function execute () {
    return sleep(50, 1.2)
  })

  const results = []
  for await (const result of queue) {
    results.push(result)
  }
  a.deepEqual(results, [1, 1.1, 1.2])
})

test.set('Accept a single async function with args', async function () {
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

/* looks similar to the test above! */
test.set('add command: function', async function () {
  const queue = new Queue()
  queue.add(async () => 1)
  queue.add(async () => 1.1)
  queue.add(async () => 1.2)
  const results = await queue.process()
  this.data = results
  a.deepEqual(results, [1, 1.1, 1.2])
})

test.set('add command: function, maxConcurrency > number of commands', async function () {
  const queue = new Queue({ maxConcurrency: 5 })
  queue.add(async () => 1)
  queue.add(async () => 1.1)
  queue.add(async () => 1.2)
  const results = await queue.process()
  this.data = results
  a.deepEqual(results, [1, 1.1, 1.2])
})

skip.set('TODO: some tests with onFail and onSuccess decision trees')

export { test, only, skip }

