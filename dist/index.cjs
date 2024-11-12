'use strict';

class Command {
  state
  result

  async execute () {}
}

class Queue {
  /**
   * @emits start
   * @emits end
   */
  constructor (options = {}) {
    this.commands = options.commands || [];
    this.maxConcurrency = options.maxConcurrency || 1;
    this.stats = {
      total: this.commands.length,
      complete: 0,
      active: 0
    };
  }

  add (command) {
    this.commands.push(command);
    this.stats.total++;
  }

  /**
   * Iterate over `commands` invoking no more than `maxConcurrency` at once. Yield results on receipt.
   */
  async * [Symbol.asyncIterator] () {
    while (this.commands.length) {
      const slotsAvailable = this.maxConcurrency - this.stats.active;
      if (slotsAvailable > 0) {
        const toRun = [];
        for (let i = 0; i < slotsAvailable; i++) {
          const command = this.commands.shift();
          if (command) {
            this.stats.active++;
            /* TODO: yield { command, event: 'start' } or similar  */
            const commandPromise = command.execute().then(result => {
              this.stats.active -= 1;
              this.stats.complete += 1;
              return result
            });
            toRun.push(commandPromise);
          }
        }
        const completedCommands = await Promise.all(toRun);
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
