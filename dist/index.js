(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.Queue = {}));
}(this, (function (exports) { 'use strict';

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

  /**
   * Isomorphic, functional type-checking for Javascript.
   * @module typical
   * @typicalname t
   * @example
   * const t = require('typical')
   * const allDefined = array.every(t.isDefined)
   */

  /**
   * Returns true if input is a number. It is a more reasonable alternative to `typeof n` which returns `number` for `NaN` and `Infinity`.
   *
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   * @example
   * > t.isNumber(0)
   * true
   * > t.isNumber(1)
   * true
   * > t.isNumber(1.1)
   * true
   * > t.isNumber(0xff)
   * true
   * > t.isNumber(0644)
   * true
   * > t.isNumber(6.2e5)
   * true
   * > t.isNumber(NaN)
   * false
   * > t.isNumber(Infinity)
   * false
   */
  function isNumber (n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
  }

  /**
   * A plain object is a simple object literal, it is not an instance of a class. Returns true if the input `typeof` is `object` and directly decends from `Object`.
   *
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   * @example
   * > t.isPlainObject({ something: 'one' })
   * true
   * > t.isPlainObject(new Date())
   * false
   * > t.isPlainObject([ 0, 1 ])
   * false
   * > t.isPlainObject(/test/)
   * false
   * > t.isPlainObject(1)
   * false
   * > t.isPlainObject('one')
   * false
   * > t.isPlainObject(null)
   * false
   * > t.isPlainObject((function * () {})())
   * false
   * > t.isPlainObject(function * () {})
   * false
   */
  function isPlainObject (input) {
    return input !== null && typeof input === 'object' && input.constructor === Object
  }

  /**
   * An array-like value has all the properties of an array yet is not an array instance. An example is the `arguments` object. Returns `true`` if the input value is an object, not `null`` and has a `length` property set with a numeric value.
   *
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   * @example
   * function sum(x, y){
   *   console.log(t.isArrayLike(arguments))
   *   // prints `true`
   * }
   */
  function isArrayLike (input) {
    return isObject(input) && typeof input.length === 'number'
  }

  /**
   * Returns true if the typeof input is `'object'` but not null.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isObject (input) {
    return typeof input === 'object' && input !== null
  }

  /**
   * Returns true if the input value is defined.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isDefined (input) {
    return typeof input !== 'undefined'
  }

  /**
   * Returns true if the input value is undefined.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isUndefined (input) {
    return !isDefined(input)
  }

  /**
   * Returns true if the input value is null.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isNull (input) {
   return input === null
  }

  /**
   * Returns true if the input value is not one of `undefined`, `null`, or `NaN`.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isDefinedValue (input) {
   return isDefined(input) && !isNull(input) && !Number.isNaN(input)
  }

  /**
   * Returns true if the input value is an ES2015 `class`.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isClass (input) {
    if (typeof input === 'function') {
      return /^class /.test(Function.prototype.toString.call(input))
    } else {
      return false
    }
  }

  /**
   * Returns true if the input is a string, number, symbol, boolean, null or undefined value.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isPrimitive (input) {
    if (input === null) return true
    switch (typeof input) {
      case 'string':
      case 'number':
      case 'symbol':
      case 'undefined':
      case 'boolean':
        return true
      default:
        return false
    }
  }

  /**
   * Returns true if the input is a Promise.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isPromise (input) {
    if (input) {
      const isPromise = isDefined(Promise) && input instanceof Promise;
      const isThenable = input.then && typeof input.then === 'function';
      return !!(isPromise || isThenable)
    } else {
      return false
    }
  }

  /**
   * Returns true if the input is an iterable (`Map`, `Set`, `Array`, Generator etc.).
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   * @example
   * > t.isIterable('string')
   * true
   * > t.isIterable(new Map())
   * true
   * > t.isIterable([])
   * true
   * > t.isIterable((function * () {})())
   * true
   * > t.isIterable(Promise.resolve())
   * false
   * > t.isIterable(Promise)
   * false
   * > t.isIterable(true)
   * false
   * > t.isIterable({})
   * false
   * > t.isIterable(0)
   * false
   * > t.isIterable(1.1)
   * false
   * > t.isIterable(NaN)
   * false
   * > t.isIterable(Infinity)
   * false
   * > t.isIterable(function () {})
   * false
   * > t.isIterable(Date)
   * false
   * > t.isIterable()
   * false
   * > t.isIterable({ then: function () {} })
   * false
   */
  function isIterable (input) {
    if (input === null || !isDefined(input)) {
      return false
    } else {
      return (
        typeof input[Symbol.iterator] === 'function' ||
        typeof input[Symbol.asyncIterator] === 'function'
      )
    }
  }

  /**
   * Returns true if the input value is a string. The equivalent of `typeof input === 'string'` for use in funcitonal contexts.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isString (input) {
    return typeof input === 'string'
  }

  /**
   * Returns true if the input value is a function. The equivalent of `typeof input === 'function'` for use in funcitonal contexts.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isFunction (input) {
    return typeof input === 'function'
  }

  var t = {
    isNumber,
    isPlainObject,
    isArrayLike,
    isObject,
    isDefined,
    isUndefined,
    isNull,
    isDefinedValue,
    isClass,
    isPrimitive,
    isPromise,
    isIterable,
    isString,
    isFunction
  };

  class Work extends Emitter {
    /**
     * @param {object} options
     * @param {function[]} options.jobs - An array of functions, each of which must return a Promise.
     * @param {number} options.maxConcurrency
     * @emits job-start
     * @emits job-end
     */
    constructor (options) {
      super();
      this.name = 'Work';
      this.data = undefined;
      this.strategy = {};
      this.jobs = {};
    }

    async process (node) {
      node = node || this.strategy;
      if ('condition' in node && !node.condition) {
        return
      }
      node = Object.assign({
        maxConcurrency: 1,
        args: []
      }, node);
      if (node.jobs) {
        if (node.maxConcurrency === 1) {
          if (Array.isArray(node.jobs)) {
            for (const job of node.jobs) {
              await this.process(job);
            }
          } else if (t.isPlainObject(node.jobs)) {
            let firstJob;
            for (const name of Object.keys(node.jobs)) {
              if (node.jobs[name].first) {
                firstJob = node.jobs[name];
                firstJob.name = name;
                break
              }
            }
            firstJob.parentJobs = node.jobs;
            await this.process(firstJob);
          } else {
            throw new Error('invalid jobs type')
          }
        } else {
          const queue = new Queue({ maxConcurrency: node.maxConcurrency });
          for (const job of node.jobs) {
            queue.add(async () => {
              await this.process(job);
            });
          }
          await queue.process();
        }
      } else {
        const jobFn = this.jobs[node.name];
        try {
          // console.log('TRY', node.name, ...node.args)
          await jobFn(...node.args);
          if (node.parentJobs && node.success) {
            const job = node.parentJobs[node.success];
            job.name = node.success;
            job.parentJobs = node.parentJobs;
            await this.process(job);
          }
        } catch (err) {
          // console.log('ERR', node.name, ...node.args, err.message)
          if (node.parentJobs && node.fail) {
            const job = node.parentJobs[node.fail];
            job.name = node.fail;
            job.parentJobs = node.parentJobs;
            await this.process(job);
          } else {
            throw err
          }
        } finally {
          // console.log('FIN', node.name, ...node.args)
          if (node.parentJobs && node.next) {
            const job = node.parentJobs[node.next];
            job.name = node.next;
            job.parentJobs = node.parentJobs;
            await this.process(job);
          }
        }
      }
    }
  }

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

  exports.Queue = Queue;
  exports.Work = Work;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
