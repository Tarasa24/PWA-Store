import * as helper from '../src/helper.js'

describe('helper.ts', () => {
  // test sleep function that should resolve after x ms given as an argument
  describe('sleep', () => {
    it('should return a promise', () => {
      expect(helper.sleep(1)).toBeInstanceOf(Promise)
    })
    it('should resolve afer x given ms', async () => {
      const ms = 100
      const start = Date.now()
      await helper.sleep(ms)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(ms-1)
    }, 200)
  })
})
