'use strict'
var test = require('tape')
var Queue = require('../lib/command-queue')
var Command = require('../lib/command')

test('add', function (t) {
  t.plan(4)

  var queue = new Queue()
  var command = new Command()

  queue.on('add', function () {
    t.pass('add fired')
  })
  queue.add(command)
  t.strictEqual(queue.todo.length, 1)
  t.strictEqual(queue.active.length, 0)
  t.strictEqual(queue.done.length, 0)
})

test('executeNext', function (t) {
  t.plan(4)

  var queue = new Queue()
  var command = new Command()

  queue.on('start', function (command) {
    t.pass('start fired')
  })
  queue.add(command)
  queue.executeNext()
  t.strictEqual(queue.todo.length, 1)
  t.strictEqual(queue.active.length, 0)
  t.strictEqual(queue.done.length, 0)
})

test('executeAll', function (t) {
  t.plan(7)

  var queue = new Queue()

  queue.on('begin', function (command) {
    t.pass('begin fired')
  })
  queue.on('start', function (command) {
    t.pass('start fired')
  })
  queue.on('end', function (command) {
    t.pass('end fired')
  })
  queue.on('complete', function (command) {
    t.pass('complete fired')
  })
  queue.add(new Command(function () {
    return 1
  }))
  queue.add(new Command(function () {
    return 2
  }))
  t.strictEqual(queue.todo.length, 2)
  t.strictEqual(queue.active.length, 0)
  t.strictEqual(queue.done.length, 0)
  queue.executeAll()
})
