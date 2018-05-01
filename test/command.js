'use strict'
const TestRunner = require('test-runner')
const Counter = require('test-runner-counter')
const Command = require('../').Command
const a = require('assert')

const runner = new TestRunner()

runner.test('.context field', function () {
  function executor (resolve, reject) {
    a.strictEqual(this.context.one, 1)
    resolve()
  }

  const task = new Command(executor, { context: { one: 1 } })
  return task.execute()
})

runner.test('reject', function () {
  function executor (resolve, reject) {
    reject('no')
  }

  const task = new Command(executor)
  return task.execute()
    .then(() => {
      throw new Error('should not reach here')
    })
    .catch(reason => a.strictEqual(reason, 'no'))
})

runner.test('executor throws', function () {
  function executor (resolve, reject) {
    throw 'broke'
  }

  const task = new Command(executor)
  return task.execute()
    .then(() => {
      throw new Error('should not reach here')
    })
    .catch(reason => a.strictEqual(reason, 'broke'))
})

runner.test('async executor', function () {
  function executor (resolve, reject) {
    process.nextTick(() => {
      resolve()
    })
  }

  const task = new Command(executor)
  return task.execute()
})



runner.test('cancel')
runner.test('cancel before execute')
runner.test('both .execute() and .promise return the same promise')
runner.test('if return value of executor is a promise, use it to resolve the deferred instead of the (resolve, reject) passed to executor')
