'use strict'
var test = require('tape')
var work = require('../')
var Queue = work.Queue
var Task = work.Task

function delay (interval) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, interval)
  })
}

function pass (t, msg) {
  return function () {
    t.pass(msg)
  }
}

function resolveAfterRandomTime (deferred) {
  delay(Math.random() * 10).then(function () {
    deferred.resolve()
  })
}

function createTask (name) {
  return new Task(resolveAfterRandomTime, { name: name })
}

test("'push' event", function (t) {
  t.plan(2)
  var queue = new Queue()
  queue.on('push', pass(t, "'push' fired"))
  queue.push(createTask())
  queue.push(createTask())
})

test("'empty' event", function (t) {
  t.plan(1)
  var queue = new Queue()
  queue.on('empty', pass(t, "'empty' fired"))
  queue.push(createTask())
  queue.shift()
})

test('.maxConcurrent', function (t) {
  t.plan(8 + 8 + 1 + 1)
  var queue = new Queue()

  /* defaults to 1 */
  queue.maxConcurrent = 2

  queue.on('push', pass(t, "'push' fired"))
  queue.on('shift', pass(t, "'shift' fired"))
  queue.on('empty', pass(t, "'empty' fired"))
  queue.on('complete', pass(t, "'complete' fired"))

  queue.push(createTask(1))
  queue.push(createTask(2))
  queue.push(createTask(3))
  queue.push(createTask(4))
  queue.push(createTask(5))
  queue.push(createTask(6))
  queue.push(createTask(7))
  queue.push(createTask(8))

  queue.process()
})

test('.data field', function (t) {
  t.plan(1)

  function resolver () {
    t.strictEqual(this.data.one, 1)
  }

  var task = new Task(resolver, { data: { one: 1 } })
  task.process()
})

test('.data field updated', function (t) {
  t.plan(1)

  function resolver () {
    t.strictEqual(this.data.one, 'one')
  }

  var task = new Task(resolver, { data: { one: 1 } })
  task.data.one = 'one'
  task.process()
})

test('.unshift()', function (t) {
  t.plan(3 + 4)

  var queue = new Queue()
  queue.on('push', pass(t, 'push fired'))
  queue.on('unshift', pass(t, 'unshift fired'))

  queue.push(createTask('one'))
  queue.push(createTask('two'))

  t.strictEqual(queue.length, 2, 'length is 2')

  var names = queue.queued.map(t => t.name)
  t.deepEqual(names, [ 'one', 'two' ], 'queue array order is correct')

  queue.unshift(createTask('three'))
  t.strictEqual(queue.length, 3, 'length is 3')
  names = queue.queued.map(t => t.name)
  t.deepEqual(names, [ 'three', 'one', 'two' ], 'queue array order is correct')
})
