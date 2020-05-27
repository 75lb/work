import { Work, Job, Queue } from '../index.mjs'

class Planner {
  constructor () {
    this.services = {}
    this.root
  }

  addService (service, name) {
    this.services[name || 'default'] = service
  }

  toModel (plan) {
    if (plan.type === 'job') {
      if (plan.invoke) {
        const job = this.services.default[plan.invoke]
        const node = new Job()
        Object.assign(node, job)
        return node
      }
    }
  }
}

export default Planner
