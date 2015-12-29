'use strict'
const EventEmitter = require('events').EventEmitter
const StateMachine = require('fsm-base')
const defer = require('defer-promise')

class Command extends StateMachine {
  constructor (receiver) {
    super({
      state: Command.eState.PENDING,
      validMoves: [
        { from: Command.eState.PENDING, to: Command.eState.RUNNING },
        { from: Command.eState.RUNNING, to: Command.eState.REJECTED },
        { from: Command.eState.RUNNING, to: Command.eState.FULFILLED },
        { from: [ Command.eState.REJECTED, Command.eState.FULFILLED ], to: Command.eState.RESOLVED },
        { from: [ Command.eState.PENDING, Command.eState.RUNNING ], to: Command.eState.CANCELLED }
      ]
    })

    this.deferred = defer()
    this.context = {}
  }
  /**
   * @returns {Promise}
   */
  execute () {
    this.emit('start')
  }
  _execute () {
    throw new Error('not implemented')
  }
  executeSync () {
    throw new Error('not implemented')
  }
  /**
   * cancels an async task by fulfilling the promise with -1
   */
  cancel () {
    throw new Error('not implemented')
  }
}

/**
 * @enum {string}
 */
Command.eState = {
  PENDING: 'pending',
  RUNNING: 'running',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
}


module.exports = Command

class JsdocCommand extends Command {
  constructor () {
    super()
  }
  _execute (deferred) {
    const jsdoc = require('jsdoc-api')
    const inputFile = path.resolve(folder, '0-src.js')
    const outputFile = path.resolve(folder, '1-jsdoc.json')
    const outputStream = fs.createWriteStream(outputFile)

    return this.deferred.promise
    return new Promise((resolve, reject) => {
      jsdoc
        .createExplainStream({ files: files })
        .on('error', err => {
          reject(`skipping ${this.name} [${err.message}]`)
        })
        .pipe(outputStream)
        .on('close', function () {
          resolve()
        })
    })
  }
}
