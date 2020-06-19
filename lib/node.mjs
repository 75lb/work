import StateMachine from 'fsm-base/index.mjs'
import CompositeClass from 'composite-class/index.mjs'
import mixInto from 'create-mixin/index.mjs'
import arrayify from 'array-back/index.mjs'
import lodash_get from 'lodash.get'

const _name = new WeakMap()
const _args = new WeakMap()

class Node extends mixInto(CompositeClass)(StateMachine) {
  constructor (options = {}) {
    super('pending', [
      { from: 'pending', to: 'in-progress' },
      { from: 'pending', to: 'skipped' },
      { from: 'in-progress', to: 'failed' },
      { from: 'in-progress', to: 'successful' },
      // { from: 'failed', to: 'complete' },
      // { from: 'successful', to: 'complete' },
      { from: 'pending', to: 'cancelled' },
      { from: 'in-progress', to: 'cancelled' }
    ])
    this.name = options.name
    this.args = options.args
    if (options.argsFn) this.argsFn = options.argsFn
    if (options.onFail) this.onFail = options.onFail
    if (options.onSuccess) this.onSuccess = options.onSuccess
    if (options.skipIf) this.skipIf = options.skipIf

    this.scope = new Proxy({}, {
      get: (target, prop) => {
        if (prop in target) {
          return Reflect.get(target, prop)
        } else if (this.parent) {
          return Reflect.get(this.parent.scope, prop)
        }
      },
      set: function (target, prop, value) {
        return Reflect.set(target, prop, value)
      }
    })
    Object.assign(this.scope, options.scope)
  }

  get name () {
    return this._replaceScopeToken(_name.get(this))
  }
  set name (val) {
    _name.set(this, val)
  }

  get args () {
    const args = _args.get(this)
    return Array.isArray(args) && args.length
      ? args.map(arg => this._replaceScopeToken(arg))
      : args
  }
  set args (val) {
    _args.set(this, val)
  }

  async process (...args) {
    if (this.skipIf) {
      for (const node of this) {
        node.setState('skipped', node)
      }
    } else {
      return this._process(...args)
    }
  }

  _process () {
    throw new Error('not implemented')
  }

  toString () {
    return `${this.name || this.invoke || this.fn.name}: ${this.state}`.replace(/^bound /, '')
  }

  tree () {
    return Array.from(this).reduce((prev, curr) => {
      const indent = '  '.repeat(curr.level())
      const line = `${indent}- ${curr}\n`
      return (prev += line)
    }, '')
  }

  /**
   * Return process, argsFn or args.
   */
  _getArgs (processArgs, argsFnArg) {
    return processArgs.length
      ? processArgs
      : this.argsFn
        ? arrayify(this.argsFn(argsFnArg))
        : arrayify(this.args)
  }

  _replaceScopeToken (str) {
    if (typeof str === 'string' && str) {
      if (/^•[a-zA-Z]/.test(str)) {
        return lodash_get(this.scope, str.replace('•',''))
      } else if (/•{.*}/.test(str)) {
        str = str.replace('•{', '${scope.')
        const fn = new Function('scope', `return \`${str}\``)
        return fn(this.scope)
      } else if (/\${.*}/.test(str)) {
        const fn = new Function('scope', `return \`${str}\``)
        return fn(this.scope)
      } else {
        return str
      }
    } else {
      return str
    }
  }
}

function mapToObject(map) {
  const obj = Object.create(null)
  for (const [k,v] of map) {
    obj[k] = v
  }
  return obj
}

export default Node
