const Queue = require('../').Queue
const defer = require('defer-promise')

const queue = new Queue({ maxConcurrent: 2 })

/* get the football results - it will take between 0 and 2000ms */
function resultResolver (deferred) {
  setTimeout(function () {
    deferred.resolve('West Ham 1 - Tottenham Hotspur 3')
  }, Math.random() * 2000)
}

/* but the timeout is 1000ms */
function timeoutResolver (deferred) {
  setTimeout(function () {
    deferred.reject(Error('timeout'))
  }, 1000)
}

const deferred = defer()

queue.push({ name: 'get result', deferred: deferred, resolver: [ resultResolver, timeoutResolver ] })

deferred.promise
  .then(function (result) {
    console.log(result)
  })
  .catch(function (err) {
    console.log('It failed: ' + err.message)
  })

queue.process()
