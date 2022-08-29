import * as helper from '../src/helper.js'
import * as fs from 'fs'

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
  
  describe('appendToOutputCsv', () => {
    const outputCsv = './__tests__/output/test.tsv'
    beforeAll(() => {
      fs.writeFileSync(outputCsv, '')
    }),

    it('should append data to output csv', async () => {
      const data = 'test'
      await helper.appendToOutputCsv(outputCsv, data)
      const outputCsvContent = fs.readFileSync(outputCsv, 'utf8')
      expect(outputCsvContent).toContain(data)
    }), 200
  })
})
