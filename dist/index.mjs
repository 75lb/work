/**
 * @module obso
 */
const _listeners = new WeakMap();

/**
 * @alias module:obso
 */
class Emitter {
  constructor () {
    _listeners.set(this, []);
  }

  /**
   * Emit an event.
   * @param {string} eventName - the event name to emit.
   * @param ...args {*} - args to pass to the event handler
   */
  emit (eventName, ...args) {
    const listeners = _listeners.get(this);
    if (listeners && listeners.length > 0) {
      const toRemove = [];

      /* invoke each relevant listener */
      for (const listener of listeners) {
        const handlerArgs = args.slice();
        if (listener.eventName === '__ALL__') {
          handlerArgs.unshift(eventName);
        }

        if (listener.eventName === '__ALL__' || listener.eventName === eventName) {
          listener.handler.call(this, ...handlerArgs);

          /* remove once handler */
          if (listener.once) toRemove.push(listener);
        }
      }

      toRemove.forEach(listener => {
        listeners.splice(listeners.indexOf(listener), 1);
      });
    }

    /* bubble event up */
    if (this.parent) this.parent._emitTarget(eventName, this, ...args);
  }

  _emitTarget (eventName, target, ...args) {
    const listeners = _listeners.get(this);
    if (listeners && listeners.length > 0) {
      const toRemove = [];

      /* invoke each relevant listener */
      for (const listener of listeners) {
        const handlerArgs = args.slice();
        if (listener.eventName === '__ALL__') {
          handlerArgs.unshift(eventName);
        }

        if (listener.eventName === '__ALL__' || listener.eventName === eventName) {
          listener.handler.call(target, ...handlerArgs);

          /* remove once handler */
          if (listener.once) toRemove.push(listener);
        }
      }

      toRemove.forEach(listener => {
        listeners.splice(listeners.indexOf(listener), 1);
      });
    }

    /* bubble event up */
    if (this.parent) this.parent._emitTarget(eventName, target || this, ...args);
  }

   /**
    * Register an event listener.
    * @param {string} [eventName] - The event name to watch. Omitting the name will catch all events.
    * @param {function} handler - The function to be called when `eventName` is emitted. Invocated with `this` set to `emitter`.
    * @param {object} [options]
    * @param {boolean} [options.once] - If `true`, the handler will be invoked once then removed.
    */
  on (eventName, handler, options) {
    const listeners = _listeners.get(this);
    options = options || {};
    if (arguments.length === 1 && typeof eventName === 'function') {
      handler = eventName;
      eventName = '__ALL__';
    }
    if (!handler) {
      throw new Error('handler function required')
    } else if (handler && typeof handler !== 'function') {
      throw new Error('handler arg must be a function')
    } else {
      listeners.push({ eventName, handler: handler, once: options.once });
    }
  }

  /**
   * Remove an event listener.
   * @param eventName {string} - the event name
   * @param handler {function} - the event handler
   */
  removeEventListener (eventName, handler) {
    const listeners = _listeners.get(this);
    if (!listeners || listeners.length === 0) return
    const index = listeners.findIndex(function (listener) {
      return listener.eventName === eventName && listener.handler === handler
    });
    if (index > -1) listeners.splice(index, 1);
  }

  /**
   * Once.
   * @param {string} eventName - the event name to watch
   * @param {function} handler - the event handler
   */
  once (eventName, handler) {
    /* TODO: the once option is browser-only */
    this.on(eventName, handler, { once: true });
  }
}

/**
 * Alias for `on`.
 */
Emitter.prototype.addEventListener = Emitter.prototype.on;

const _maxConcurrency = new WeakMap();

class Queue extends Emitter {
  /**
   * @param {object} options
   * @param {function[]} options.jobs - An array of functions, each of which must return a Promise.
   * @param {number} options.maxConcurrency
   * @emits job-start
   * @emits job-end
   */
  constructor (options) {
    super();
    options = Object.assign({
      jobs: [],
      maxConcurrency: 10,
      skipAfter: false
    }, options);
    this.jobs = [];
    this.jobStats = {
      total: 0,
      complete: 0,
      active: 0
    };
    this.maxConcurrency = options.maxConcurrency;
    /**
     * Store arbitrary data here.
     */
    this.data = null;
    this.result = null;
    for (const job of options.jobs) {
      this.add(job);
    }

    //TODO .addAfter method which incrememts jobStats.total
    if (!options.skipAfter) {
      this.after = new Queue({ maxConcurrency: options.maxConcurrency, skipAfter: true });
    }
  }

  get maxConcurrency () {
    return _maxConcurrency.get(this)
  }
  set maxConcurrency (val) {
    if (!Number.isInteger(val)) {
      throw 'You must supply an integer to queue.maxConcurrency'
    }
    _maxConcurrency.set(this, val);
  }

  add (job) {
    this.jobs.push(job);
    this.jobStats.total++;
  }

  /**
   * Iterate over `jobs` invoking no more than `maxConcurrency` at once. Yield results on receipt.
   */
  async * [Symbol.asyncIterator] () {
    this.emit('start');
    while (this.jobs.length) {
      const slotsAvailable = this.maxConcurrency - this.jobStats.active;
      if (slotsAvailable > 0) {
        const toRun = [];
        for (let i = 0; i < slotsAvailable; i++) {
          const job = this.jobs.shift();
          if (job) {
            this.jobStats.active++;
            this.emit('job-start');
            const jobResult = job();
            const jobPromise = jobResult.then && jobResult.catch
              ? jobResult
              : Promise.resolve(jobResult);
            jobPromise.then(result => {
              this.jobStats.active -= 1;
              this.jobStats.complete += 1;
              this.emit('job-end');
              return result
            });
            toRun.push(jobPromise);
          }
        }
        const results = await Promise.all(toRun);
        for (const result of results) {
          yield result;
        }
      }
    }
    if (this.after) {
      yield * this.after;
    }
    this.emit('end');
  }

  async process () {
    const output = [];
    for await (const result of this) {
      output.push(result);
    }
    return output
  }
}

export default Queue;
