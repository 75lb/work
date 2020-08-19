import TestRunner from 'test-runner'
import { Placeholder, Job } from '../index.mjs'
import assert from 'assert'

const a = assert.strict
const tom = new TestRunner.Tom()

tom.test('placeholder: simple job', async function () {
  const actuals = []
  const placeholder = new Placeholder({
    factory: function (n) {
      return new Job({ fn: () => { actuals.push(n) } })
    }
  })
  await placeholder.process('a')
  a.deepEqual(actuals, ['a'])
})

tom.test('placeholder: simple job with onSuccess', async function () {
  const actuals = []
  const placeholder = new Placeholder({
    factory: function (n) {
      return new Job({
        fn: () => {
          actuals.push(n)
          return n
        },
        onSuccess: new Job({
          fn: (a) => {
            actuals.push(a + 'ok')
            return 'b'
          }
        })
      })
    },
    onSuccess: new Job({
      fn: (a) => { actuals.push(a + 'top') }
    })
  })
  await placeholder.process('a')
  a.deepEqual(actuals, ['a', 'aok', 'btop'])
})

export default tom
