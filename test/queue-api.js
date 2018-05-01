const TestRunner = require('test-runner')
const work = require('../')
const Queue = work.Queue
const Command = work.Command

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

function createCommand (name) {
  return new Command(resolveAfterRandomTime, { name: name })
}

const runner = new TestRunner()

runner.test("'push' event", function () {
  t.plan(2)
  const queue = new Queue()
  queue.on('push', pass(t, "'push' fired"))
  queue.push(createCommand())
  queue.push(createCommand())
})

runner.test("'empty' event", function () {
  t.plan(1)
  const queue = new Queue()
  queue.on('empty', pass(t, "'empty' fired"))
  queue.push(createCommand())
  queue.shift()
})

runner.test('.maxConcurrent', function () {
  t.plan(8 + 8 + 1 + 1)
  const queue = new Queue()

  /* defaults to 1 */
  queue.maxConcurrent = 2

  queue.on('push', pass(t, "'push' fired"))
  queue.on('shift', pass(t, "'shift' fired"))
  queue.on('empty', pass(t, "'empty' fired"))
  queue.on('complete', pass(t, "'complete' fired"))

  queue.push(createCommand(1))
  queue.push(createCommand(2))
  queue.push(createCommand(3))
  queue.push(createCommand(4))
  queue.push(createCommand(5))
  queue.push(createCommand(6))
  queue.push(createCommand(7))
  queue.push(createCommand(8))

  queue.process()
})

runner.test('.data field', function () {
  t.plan(1)

  function resolver () {
    t.strictEqual(this.data.one, 1)
  }

  const task = new Command(resolver, { data: { one: 1 } })
  task.process()
})

runner.test('.data field updated', function () {
  t.plan(1)

  function resolver () {
    t.strictEqual(this.data.one, 'one')
  }

  const task = new Command(resolver, { data: { one: 1 } })
  task.data.one = 'one'
  task.process()
})

runner.test('.unshift()', function () {
  t.plan(3 + 4)

  const queue = new Queue()
  queue.on('push', pass(t, 'push fired'))
  queue.on('unshift', pass(t, 'unshift fired'))

  queue.push(createCommand('one'))
  queue.push(createCommand('two'))

  t.strictEqual(queue.length, 2, 'length is 2')

  const names = queue.queued.map(t => t.name)
  t.deepEqual(names, [ 'one', 'two' ], 'queue array order is correct')

  queue.unshift(createCommand('three'))
  t.strictEqual(queue.length, 3, 'length is 3')
  names = queue.queued.map(t => t.name)
  t.deepEqual(names, [ 'three', 'one', 'two' ], 'queue array order is correct')
})
