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
  /**
   * @param {string} - Initial state, e.g. 'pending'.
   * @param {object[]} - Array of valid move rules.
   */
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

  /**
   * Reset to initial state.
   * @emits "reset"
   */
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

class Node extends createMixin(Composite)(StateMachine) {
  constructor (options = {}) {
    super('pending', [
      { from: 'pending', to: 'in-progress' },
      { from: 'in-progress', to: 'failed' },
      { from: 'in-progress', to: 'successful' },
      { from: 'failed', to: 'complete' },
      { from: 'successful', to: 'complete' },
      { from: 'pending', to: 'cancelled' },
      { from: 'in-progress', to: 'cancelled' }
    ]);
    this.name = options.name;
    if (options.args) this.args = options.args;
    if (options.argsFn) this.argsFn = options.argsFn;
    this.scope = new Scope(null, this);
    for (const prop in options.scope) {
      this.scope.set(prop, options.scope[prop]);
    }
  }

  process () {
    throw new Error('not implemented')
  }

  toString () {
    return `${this.name || this.invoke || this.fn.name}: ${this.state}`.replace(/^bound /, '')
  }

  tree () {
    return Array.from(this).reduce((prev, curr) => {
      const indent = '  '.repeat(curr.level());
      const line = `${indent}- ${curr}\n`;
      return (prev += line)
    }, '')
  }

  _getArgs (fnArgs, argsFnArg) {
    return fnArgs.length
      ? fnArgs
      : this.argsFn
        ? arrayify(this.argsFn(argsFnArg))
        : arrayify(this.args)
  }
}

class Scope extends Map {
  constructor (iterable, node) {
    super(iterable);
    this.node = node;
  }

  get (key) {
    if (this.has(key)) {
      return super.get(key)
    } else if (this.node && this.node.parent) {
      return this.node.parent.scope.get(key)
    }
  }
}

const _maxConcurrency = new WeakMap();

class Queue extends Node {
  /**
   * @param {object} options
   * @param {function[]} options.jobs - An array of functions, each of which must return a Promise.
   * @param {number} options.maxConcurrency
   * @emits job-start
   * @emits job-end
   */
  constructor (options) {
    super(options);
    options = Object.assign({
      jobs: [],
      maxConcurrency: 1
    }, options);
    this.jobStats = {
      total: 0,
      complete: 0,
      active: 0
    };
    this.id = (Math.random() * 10e18).toString(16);
    this.maxConcurrency = options.maxConcurrency;
    this.type = 'queue';
    for (const job of options.jobs) {
      this.add(job);
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
    this.emit('add', job);
  }

  /**
   * Iterate over `jobs` invoking no more than `maxConcurrency` at once. Yield results on receipt.
   */
  async * [Symbol.asyncIterator] () {
    this.state = 'in-progress';
    const jobs = this.children.slice();
    while (jobs.length) {
      const slotsAvailable = this.maxConcurrency - this.jobStats.active;
      if (slotsAvailable > 0) {
        const toRun = [];
        for (let i = 0; i < slotsAvailable; i++) {
          const job = jobs.shift();
          if (job) {
            this.jobStats.active++;
            const jobPromise = job.process()
              .then(result => {
                this.jobStats.active -= 1;
                this.jobStats.complete += 1;
                return result
              });
            toRun.push(jobPromise);
          }
        }
        const completedJobs = await Promise.all(toRun);
        for (const job of completedJobs) {
          yield job;
        }
      }
    }
    this.state = 'successful';
  }

  async process () {
    const output = [];
    for await (const result of this) {
      output.push(result);
    }
    return output
  }
}

class Planner {
  constructor (ctx) {
    this.services = { default: {} };
    this.ctx = ctx;
  }

  addService (...args) {
    const [name, service] = args.length === 1
      ? ['default', args[0]]
      : args;
    const existingService = this.services[name];
    if (existingService) {
      Object.assign(existingService, service);
    } else {
      this.services[name] = service;
    }
  }

  _getServiceFunction (plan) {
    const service = this.services[plan.service || 'default'];
    const fn = service[plan.invoke];
    if (fn) {
      return fn.bind(service)
    } else {
      throw new Error('Could not find function: ' + plan.invoke)
    }
  }

  toNodeClass (plan) {
    const planner = this;
    if (plan.type === 'job' && plan.invoke) {
      const fn = this._getServiceFunction(plan);
      return class LoopJob extends Job {
        constructor (options) {
          super(options);
          if (plan.onFail) {
            this.onFail = planner.toModel(plan.onFail);
          }
        }

        fn (...args) {
          return fn(...args)
        }
      }
    } else if (plan.type === 'job' && plan.fn) ; else if (plan.type === 'queue' && plan.queue) {
      return class LoopQueue extends Queue {
        constructor (options) {
          super(options);
          for (const item of plan.queue) {
            this.add(planner.toModel(item));
          }
        }
      }
    } else if (plan.type === 'template' && plan.template) ; else if (plan.type === 'loop') ; else {
      const err = new Error('invalid plan item type: ' + plan.type);
      err.plan = plan;
      throw err
    }
  }

  toModel (plan) {
    plan = Object.assign({}, plan);
    if (plan.type === 'job' && plan.invoke) {
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail);
      }
      plan.fn = this._getServiceFunction(plan);
      if (plan.args) {
        plan.argsFn = function () {
          return arrayify(plan.args).map(arg => {
            if (/^•[a-z]/.test(arg)) {
              return this.scope.get(arg.replace('•',''))
            } else if (/\${.*}/.test(arg)) {
              // arg = "contributionsPerOrg:${scope.get('org').id}"
              const fn = new Function('scope', `return \`${arg}\``);
              return fn(this.scope)
            } else {
              return arg
            }
          })
        };
      }
      return new Job(plan)
    } else if (plan.type === 'job' && plan.fn) {
      if (plan.onFail) {
        plan.onFail = this.toModel(plan.onFail);
      }
      return new Job(plan)
    } else if (plan.type === 'queue' && plan.queue) {
      const queue = new Queue(plan);
      for (const item of plan.queue) {
        queue.add(this.toModel(item));
      }
      return queue
    } else if (plan.type === 'template' && plan.template) {
      const queue = new Queue(plan);
      const items = Array.isArray(plan.repeatForEach)
        ? plan.repeatForEach
        : plan.repeatForEach();
      for (const i of items) {
        // TODO: insert in place, rather than appending to end of queue
        const node = this.toModel(plan.template(i));
        queue.add(node);
      }
      return queue
    } else if (plan.type === 'loop') {
      const loop = new Loop();
      if (plan.forEach) {
        loop.forEach = () => this.ctx[plan.forEach];
      } else if (plan.for) {
        loop.for = () => ({ var: plan.for.var, of: this.ctx[plan.for.of]() });
      }
      loop.Node = this.toNodeClass(plan.node);
      if (plan.args) loop.args = this.ctx[plan.args];
      if (plan.argsFn) loop.argsFn = this.ctx[plan.argsFn];
      return loop
    } else {
      const err = new Error('invalid plan item type: ' + plan.type);
      err.plan = plan;
      throw err
    }
  }
}

class Work extends Emitter {
  /**
   * @param {object} options
   */
  constructor (options) {
    super();
    this.name = 'Work';
    this.ctx = undefined; // proxy, monitor read and writes via traps
    this.plan = {};
    this.planner = new Planner();
  }

  addService (...args) {
    this.planner.addService(...args);
  }

  setPlan (plan) {
    this.model = this.planner.toModel(plan);
  }

  async process () {
    return this.model.process()
  }

  createContext () {
    const work = this;
    return new Proxy({}, {
      get: function (target, prop, receiver) {
        work.emit('ctx-read', prop, target[prop]);
        return Reflect.get(...arguments)
      },
      set: function (target, prop, value, receiver) {
        work.emit('ctx-write', prop, value);
        return Reflect.set(...arguments)
      }
    })
  }
}

class Job extends Node {
  constructor (options = {}) {
    super(options);
    if (options.fn) {
      this.fn = options.fn;
    }
    if (options.onFail) {
      this.onFail = options.onFail;
    }
    if (options.onSuccess) {
      this.onSuccess = options.onSuccess;
    }
    if (options.result) {
      /**
       * Write result to this scope key.
       */
      this.result = options.result;
    }
    this.id = (Math.random() * 10e18).toString(16);
    this.type = 'job';
  }

  async process (...fnArgs) {
    try {
      this.setState('in-progress', this);
      const args = this._getArgs(fnArgs);
      const result = await this.fn(...args);
      if (this.result) {
        this.scope.set(this.result, result);
      }
      this.setState('successful', this);
      if (this.onSuccess) {
        if (!(this.onSuccess.args && this.onSuccess.args.length)) {
          this.onSuccess.args = [result, this];
        }
        this.add(this.onSuccess);
        await this.onSuccess.process();
      }
      return result
    } catch (err) {
      this.setState('failed', this);
      if (this.onFail) {
        if (!(this.onFail.args && this.onFail.args.length)) {
          this.onFail.args = [err, this];
        }
        this.add(this.onFail);
        await this.onFail.process();
      } else {
        throw err
      }
    }
  }

  add (node) {
    super.add(node);
    this.emit('add', node);
  }
}

class Loop extends Queue {
  constructor (options = {}) {
    super(options);
    this.type = 'loop';
    this.forEach = options.forEach;
    this.for = options.for;
    /**
     * A new instance will be created on each iteration.
     */
    this.Node = options.Node;
  }

  async process (...fnArgs) {
    /* build queue children */
    if (this.for) {
      const { var: varName, of: iterable } = this.for();
      for (const i of iterable) {
        const node = new this.Node();
        node.scope.set(varName, i);
        const args = this._getArgs(fnArgs, i);
        node.args = node.args || args;
        this.add(node);
      }
    } else if (this.forEach) {
      const iterable = this.forEach();
      for (const i of iterable) {
        const node = new this.Node();
        const args = this._getArgs(fnArgs, i);
        node.args = node.args || args;
        this.add(node);
      }
    }
    /* process queue */
    return super.process()
  }
}

export { Job, Loop, Node, Planner, Queue, Work };
