'use strict'
const TestRunner = require('test-runner')
const Counter = require('test-runner-counter')
const work = require('../')
const Task = work.Task
const a = require('assert')

const runner = new TestRunner()

runner.test('.data field', function () {
  const counter = Counter.create(1)

  function resolver () {
    a.strictEqual(this.data.one, 1)
    counter.pass()
  }

  const task = new Task(resolver, { data: { one: 1 } })
  task.process()
})

runner.test('.data field updated', function () {
  const counter = Counter.create(1)

  function resolver () {
    a.strictEqual(this.data.one, 'one')
    counter.pass()
  }

  const task = new Task(resolver, { data: { one: 1 } })
  task.data.one = 'one'
  task.process()
})
