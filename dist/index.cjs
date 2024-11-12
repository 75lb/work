'use strict';

class Command {
  state
  result

  /**
   * Must be async - sync commands don't support concurrency.
   */
  async execute () {}
}

class Queue {
  commands = []
  stats = {
    total: 0,
    complete: 0,
    active: 0
  }

  constructor (options = {}) {
    this.maxConcurrency = options.maxConcurrency || 1;
  }

  add (command, ...args) {
    this.commands.push({ command, args });
    this.stats.total++;
  }

  /**
   * Iterate over `commands` invoking no more than `maxConcurrency` at once. Yield results on receipt.
   */
  /* TODO: yield { command, event: 'start' } or similar, rather than only yielding on completion or emitting a "start" event  */
  /* TODO: Real-life updating of slotsAvailable if new commands are added while processing is in progress */
  async * [Symbol.asyncIterator] () {
    while (this.commands.length) {
      const slotsAvailable = this.maxConcurrency - this.stats.active;
      if (slotsAvailable > 0) {
        const toRun = [];
        for (let i = 0; i < slotsAvailable; i++) {
          const { command, args } = this.commands.shift();
          let executable;
          if (typeof command === 'function') {
            executable = command;
          } else if (typeof command === 'object' && typeof command.execute === 'function') {
            executable = command.execute.bind(command);
          } else {
            throw new Error('Command structure not recognised')
          }
          this.stats.active++;
          const commandPromise = executable(...args).then(result => {
            this.stats.active -= 1;
            this.stats.complete += 1;
            return result
          });
          toRun.push(commandPromise);
        }
        const completedCommands = await Promise.all(toRun);
        // console.dir(toRun, { showHidden: true, depth: null, colors: true })
        // console.dir(completedCommands, { showHidden: true, depth: null, colors: true })
        for (const command of completedCommands) {
          yield command;
        }
      }
    }
  }

  /**
  Returns an array containing the results of each node in the queue.
  */
  async process () {
    const output = [];
    for await (const result of this) {
      output.push(result);
    }
    return output
  }
}

exports.Command = Command;
exports.Queue = Queue;
