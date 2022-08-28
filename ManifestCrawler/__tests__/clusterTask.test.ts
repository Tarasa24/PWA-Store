import { jest } from '@jest/globals'

import http from '../src/http.js'
import clusterTask from '../src/clusterTask.js'

describe('clusterTask.ts', () => {
  beforeAll(async () => {
    jest.spyOn(http, 'getRobotsTxt')
  })

  it('should be a function', () => {
    expect(typeof clusterTask).toBe('function')
  })
})
