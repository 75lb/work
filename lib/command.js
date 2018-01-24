'use strict'
const EventEmitter = require('events').EventEmitter
const StateMachine = require('fsm-base')
const defer = require('defer-promise')

class Command {
  constructor (receiver) {
    this.context = {}
  }

  execute () {
    throw new Error('not implemented')
  }
  cancel () {
    throw new Error('not implemented')
  }
}

module.exports = Command
