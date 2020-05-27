(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.Queue = {}));
}(this, (function (exports) { 'use strict';

  /**
   * @module obso
   */

  /**
   * @alias module:obso
   */
  class Emitter {
    /**
     * Emit an event.
     * @param {string} eventName - the event name to emit.
     * @param ...args {*} - args to pass to the event handler
     */
    emit (eventName, ...args) {
      if (this._listeners && this._listeners.length > 0) {
        const toRemove = [];

        /* invoke each relevant listener */
        for (const listener of this._listeners) {
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
          this._listeners.splice(this._listeners.indexOf(listener), 1);
        });
      }

      /* bubble event up */
      if (this.parent) this.parent._emitTarget(eventName, this, ...args);
    }

    _emitTarget (eventName, target, ...args) {
      if (this._listeners && this._listeners.length > 0) {
        const toRemove = [];

        /* invoke each relevant listener */
        for (const listener of this._listeners) {
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
          this._listeners.splice(this._listeners.indexOf(listener), 1);
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
      createListenersArray(this);
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
        this._listeners.push({ eventName, handler: handler, once: options.once });
      }
    }

    /**
     * Remove an event listener.
     * @param eventName {string} - the event name
     * @param handler {function} - the event handler
     */
    removeEventListener (eventName, handler) {
      if (!this._listeners || this._listeners.length === 0) return
      const index = this._listeners.findIndex(function (listener) {
        return listener.eventName === eventName && listener.handler === handler
      });
      if (index > -1) this._listeners.splice(index, 1);
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

    /**
     * Propagate events from the supplied emitter to this emitter.
     * @param {string} eventName - the event name to propagate
     * @param {object} from - the emitter to propagate from
     */
    propagate (eventName, from) {
      from.on(eventName, (...args) => this.emit(eventName, ...args));
    }
  }

  /**
   * Alias for `on`.
   */
  Emitter.prototype.addEventListener = Emitter.prototype.on;

  function createListenersArray (target) {
    if (target._listeners) return
    Object.defineProperty(target, '_listeners', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: []
    });
  }

  /**
   * Takes any input and guarantees an array back.
   *
   * - Converts array-like objects (e.g. `arguments`, `Set`) to a real array.
   * - Converts `undefined` to an empty array.
   * - Converts any another other, singular value (including `null`, objects and iterables other than `Set`) into an array containing that value.
   * - Ignores input which is already an array.
   *
   * @module array-back
   * @example
   * > const arrayify = require('array-back')
   *
   * > arrayify(undefined)
   * []
   *
   * > arrayify(null)
   * [ null ]
   *
   * > arrayify(0)
   * [ 0 ]
   *
   * > arrayify([ 1, 2 ])
   * [ 1, 2 ]
   *
   * > arrayify(new Set([ 1, 2 ]))
   * [ 1, 2 ]
   *
   * > function f(){ return arrayify(arguments); }
   * > f(1,2,3)
   * [ 1, 2, 3 ]
   */

  function isObject (input) {
    return typeof input === 'object' && input !== null
  }

  function isArrayLike (input) {
    return isObject(input) && typeof input.length === 'number'
  }

  /**
   * @param {*} - The input value to convert to an array
   * @returns {Array}
   * @alias module:array-back
   */
  function arrayify (input) {
    if (Array.isArray(input)) {
      return input
    }

    if (input === undefined) {
      return []
    }

    if (isArrayLike(input) || input instanceof Set) {
      return Array.from(input)
    }

    return [input]
  }

  /**
   * Isomorphic map-reduce function to flatten an array into the supplied array.
   *
   * @module reduce-flatten
   * @example
   * const flatten = require('reduce-flatten')
   */

  /**
   * @alias module:reduce-flatten
   * @example
   * > numbers = [ 1, 2, [ 3, 4 ], 5 ]
   * > numbers.reduce(flatten, [])
   * [ 1, 2, 3, 4, 5 ]
   */
  function flatten (arr, curr) {
    if (Array.isArray(curr)) {
      arr.push(...curr);
    } else {
      arr.push(curr);
    }
    return arr
  }

  /**
   * @module fsm-base
   * @typicalname stateMachine
   */

  const _initialState = new WeakMap();
  const _state = new WeakMap();
  const _validMoves = new WeakMap();

  /**
   * @alias module:fsm-base
   * @extends {Emitter}
   */
  class StateMachine extends Emitter {
    constructor (initialState, validMoves) {
      super();
      _validMoves.set(this, arrayify(validMoves).map(move => {
        move.from = arrayify(move.from);
        move.to = arrayify(move.to);
        return move
      }));
      _state.set(this, initialState);
      _initialState.set(this, initialState);
    }

    /**
     * The current state
     * @type {string} state
     * @throws `INVALID_MOVE` if an invalid move made
     */
    get state () {
      return _state.get(this)
    }

    set state (state) {
      this.setState(state);
    }

    /**
     * Set the current state. The second arg onward will be sent as event args.
     * @param {string} state
     */
    setState (state, ...args) {
      /* nothing to do */
      if (this.state === state) return

      const validTo = _validMoves.get(this).some(move => move.to.indexOf(state) > -1);
      if (!validTo) {
        const msg = `Invalid state: ${state}`;
        const err = new Error(msg);
        err.name = 'INVALID_MOVE';
        throw err
      }

      let moved = false;
      const prevState = this.state;
      _validMoves.get(this).forEach(move => {
        if (move.from.indexOf(this.state) > -1 && move.to.indexOf(state) > -1) {
          _state.set(this, state);
          moved = true;
          /**
           * fired on every state change
           * @event module:fsm-base#state
           * @param state {string} - the new state
           * @param prev {string} - the previous state
           */
          this.emit('state', state, prevState);

          /**
           * fired on every state change
           * @event module:fsm-base#&lt;state value&gt;
           */
          this.emit(state, ...args);
        }
      });
      if (!moved) {
        const froms = _validMoves.get(this)
          .filter(move => move.to.indexOf(state) > -1)
          .map(move => move.from.map(from => `'${from}'`))
          .reduce(flatten);
        const msg = `Can only move to '${state}' from ${froms.join(' or ') || '<unspecified>'} (not '${prevState}')`;
        const err = new Error(msg);
        err.name = 'INVALID_MOVE';
        throw err
      }
    }

    resetState () {
      const prevState = this.state;
      const initialState = _initialState.get(this);
      _state.set(this, initialState);
      this.emit('reset', prevState);
    }
  }

  /**
   * An isomorphic, load-anywhere JavaScript class for building [composite structures](https://en.wikipedia.org/wiki/Composite_pattern). Suitable for use as a super class or mixin.
   * @module composite-class
   * @example
   * const Composite = require('composite-class')
   */

  const _children = new WeakMap();
  const _parent = new WeakMap();

  /**
   * @alias module:composite-class
   */
  class Composite {
    /**
     * Children
     * @type {Array}
     */
    get children () {
      if (_children.has(this)) {
        return _children.get(this)
      } else {
        _children.set(this, []);
        return _children.get(this)
      }
    }

    set children (val) {
      _children.set(this, val);
    }

    /**
     * Parent
     * @type {Composite}
     */
    get parent () {
      return _parent.get(this)
    }

    set parent (val) {
      _parent.set(this, val);
    }

    /**
     * Add a child
     * @returns {Composite}
     */
    add (child) {
      if (!(isComposite(child))) throw new Error('can only add a Composite instance')
      child.parent = this;
      this.children.push(child);
      return child
    }

    /**
     * @param {Composite} child - the child node to append
     * @returns {Composite}
     */
    append (child) {
      if (!(child instanceof Composite)) throw new Error('can only add a Composite instance')
      child.parent = this;
      this.children.push(child);
      return child
    }

    /**
     * @param {Composite} child - the child node to prepend
     * @returns {Composite}
     */
    prepend (child) {
      if (!(child instanceof Composite)) throw new Error('can only add a Composite instance')
      child.parent = this;
      this.children.unshift(child);
      return child
    }

    /**
     * @param {Composite} child - the child node to remove
     * @returns {Composite}
     */
    remove (child) {
      return this.children.splice(this.children.indexOf(child), 1)
    }

    /**
     * depth level in the tree, 0 being root.
     * @returns {number}
     */
    level () {
      let count = 0;
      function countParent (composite) {
        if (composite.parent) {
          count++;
          countParent(composite.parent);
        }
      }
      countParent(this);
      return count
    }

    /**
     * @returns {number}
     */
    getDescendentCount () {
      return Array.from(this).length
    }

    /**
     * prints a tree using the .toString() representation of each node in the tree
     * @returns {string}
     */
    tree () {
      return Array.from(this).reduce((prev, curr) => {
        return (prev += `${'  '.repeat(curr.level())}- ${curr}\n`)
      }, '')
    }

    /**
     * Returns the root instance of this tree.
     * @returns {Composite}
     */
    root () {
      function getRoot (composite) {
        return composite.parent ? getRoot(composite.parent) : composite
      }
      return getRoot(this)
    }

    /**
     * default iteration strategy
     */
    * [Symbol.iterator] () {
      yield this;
      for (const child of this.children) {
        yield * child;
      }
    }

    /**
     * Used by node's `util.inspect`.
     */
    inspect (depth) {
      const clone = Object.assign({}, this);
      delete clone.parent;
      return clone
    }

    /**
     * Returns an array of ancestors
     * @return {Composite[]}
     */
    parents () {
      const output = [];
      function addParent (node) {
        if (node.parent) {
          output.push(node.parent);
          addParent(node.parent);
        }
      }
      addParent(this);
      return output
    }
  }

  function isComposite (item) {
    return item && item.children && item.add && item.level && item.root
  }

  /**
   * Creates a mixin for use in a class extends expression.
   * @module create-mixin
   */

  /**
   * @alias module:create-mixin
   * @param {class} Src - The class containing the behaviour you wish to mix into another class.
   * @returns {function}
   */
  function createMixin (Src) {
    return function (Base) {
      class Mixed extends Base {}
      for (const propName of Object.getOwnPropertyNames(Src.prototype)) {
        if (propName === 'constructor') continue
        Object.defineProperty(Mixed.prototype, propName, Object.getOwnPropertyDescriptor(Src.prototype, propName));
      }
      if (Src.prototype[Symbol.iterator]) {
        Object.defineProperty(Mixed.prototype, Symbol.iterator, Object.getOwnPropertyDescriptor(Src.prototype, Symbol.iterator));
      }
      return Mixed
    }
  }

  const _maxConcurrency = new WeakMap();

  class Queue extends createMixin(Composite)(StateMachine) {
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

      // TODO .addAfter method which incrememts jobStats.total
      if (!options.skipAfter) {
        this.after = new Queue({ maxConcurrency: options.maxConcurrency, skipAfter: true });
      }
    }

    get maxConcurrency () {
      return _maxConcurrency.get(this)
    }

    set maxConcurrency (val) {
      if (!Number.isInteger(val)) {
        throw new Error('You must supply an integer to queue.maxConcurrency')
      }
      _maxConcurrency.set(this, val);
    }

    add (job) {
      super.add(job);
      this.jobStats.total++;
    }

    /**
     * Iterate over `jobs` invoking no more than `maxConcurrency` at once. Yield results on receipt.
     */
    async * [Symbol.asyncIterator] () {
      this.emit('start');
      const jobs = this.children.slice();
      while (jobs.length) {
        const slotsAvailable = this.maxConcurrency - this.jobStats.active;
        if (slotsAvailable > 0) {
          const toRun = [];
          for (let i = 0; i < slotsAvailable; i++) {
            const job = jobs.shift();
            if (job) {
              this.jobStats.active++;
              this.emit('job-start');
              const jobResult = job.process();
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

  /**
   * @module obso
   */
  const _listeners = new WeakMap();

  /**
   * @alias module:obso
   */
  class Emitter$1 {
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
  Emitter$1.prototype.addEventListener = Emitter$1.prototype.on;

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
  function isArrayLike$1 (input) {
    return isObject$1(input) && typeof input.length === 'number'
  }

  /**
   * Returns true if the typeof input is `'object'` but not null.
   * @param {*} - the input to test
   * @returns {boolean}
   * @static
   */
  function isObject$1 (input) {
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
    isArrayLike: isArrayLike$1,
    isObject: isObject$1,
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

  class Work extends Emitter$1 {
    /**
     * @param {object} options
     * @param {number} options.maxConcurrency - Defaults to 1.
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

    async process2 (tree) {
      await tree.process();
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
      if (node.template) {
        for (const item of node.repeatForEach()) {
          node.parentJobs.push(node.template(item));
          // console.log(node.parentJobs)
        }
      } else if (node.jobs) {
        if (node.maxConcurrency === 1) {
          if (Array.isArray(node.jobs)) {
            for (const job of node.jobs) {
              job.parentJobs = node.jobs;
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
            job.parentJobs = node.jobs;
            queue.add(async () => {
              await this.process(job);
            });
          }
          await queue.process();
        }
      } else {
        const jobFn = this.jobs[node.name];
        try {
          console.log('TRY', node.name, ...node.args);
          await jobFn(...node.args);
          if (node.parentJobs && node.success) {
            const job = node.parentJobs[node.success];
            job.name = node.success;
            job.parentJobs = node.parentJobs;
            await this.process(job);
          }
        } catch (err) {
          console.log('ERR', node.name, ...node.args, err.message);
          if (node.parentJobs && node.fail) {
            const job = node.parentJobs[node.fail];
            job.name = node.fail;
            job.parentJobs = node.parentJobs;
            await this.process(job);
          } else {
            throw err
          }
        } finally {
          console.log('FIN', node.name, ...node.args);
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

  class Job extends createMixin(Composite)(StateMachine) {
    constructor (jobFn, options = {}) {
      super();
      this.fn = jobFn;
      this.name = options.name;
      this.args = options.args || [];
      this.onFailQueue = options.onFailQueue;
      this.onSuccessQueue = options.onSuccessQueue;
    }

    async process () {
      return this.fn(...this.args)
    }
  }

  class Planner {
    constructor () {
      this.services = {};
      this.root;
    }

    addService (service, name) {
      this.services[name || 'default'] = service;
    }

    toModel (plan) {
      if (plan.type === 'job') {
        if (plan.invoke) {
          const fn = this.service.default[plan.invoke];
          const node = new Job(fn);
          return node
        }
      }
    }
  }

  exports.Job = Job;
  exports.Planner = Planner;
  exports.Queue = Queue;
  exports.Work = Work;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
