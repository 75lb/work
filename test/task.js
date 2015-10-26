'use strict'
var test = require('tape')
var work = require('../')
var Task = work.Task

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
