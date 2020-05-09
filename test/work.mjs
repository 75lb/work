import TestRunner from 'test-runner'
import { Work } from '../index.mjs'
import assert from 'assert'
import sleep from 'sleep-anywhere'
const a = assert.strict

const tom = new TestRunner.Tom()

tom.only('work strategy', async function () {
  const work = new Work()
  work.name = 'Page builder'
  work.data = {
    githubUser: {},
    npmPackages: [],
    githubRepos: []
  }

  work.strategy = {
    name: 'build-page',
    jobs: [
      {
        name: 'collect-data',
        maxConcurrency: 1,
        jobs: [
          {
            name: 'collect-user',
            jobs: {
              fetchFromCache: { first: true, args: ['user'], fail: 'fetch-user-from-remote' },
              'fetch-user-from-remote': { success: 'update-cache' },
              'update-cache': { args: ['user'] }
            }
          },
          {
            name: 'collect-repos',
            jobs: {
              fetchFromCache: { first: true, args: ['repos'], fail: 'fetch-repos-from-remote' },
              'fetch-repos-from-remote': { success: 'update-cache' },
              'update-cache': { args: ['repos'] }
            }
          },
          {
            name: 'collect-packages',
            jobs: {
              fetchFromCache: { first: true, args: ['packages'], fail: 'fetch-packages-from-remote' },
              'fetch-packages-from-remote': { success: 'update-cache' },
              'update-cache': { args: ['packages'] }
            }
          },
          {
            name: 'template',
            repeatForEach: function () {
              return ['one', 'two']
            },
            template: function (item) {
              return {
                name: item
              }
            }
          }
        ]
      },
      { name: 'displayData' }
    ]
  }

  work.jobs = {
    fetchFromCache: async function (...args) {
      console.log('fetchFromCache', ...args)
      if (args[0] === 'repos') {
        throw new Error('repos not found in cache')
      }
    },
    'fetch-user-from-remote': async function (...args) {
      console.log('fetch-user-from-remote', ...args)
    },
    'fetch-repos-from-remote': async function (...args) {
      console.log('fetch-repos-from-remote', ...args)
    },
    'fetch-packages-from-remote': async function (...args) {
      console.log('fetch-packages-from-remote', ...args)
    },
    'update-cache': async function (...args) {
      console.log('update-cache', ...args)
    },
    displayData: function (...args) {
      console.log('displayData', ...args)
    },
    one: function () {
      console.log('ONE')
    },
    two: function () {
      console.log('TWO')
    }
  }

  await work.process()
})

export default tom
