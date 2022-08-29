import { jest } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

import { Cluster } from 'puppeteer-cluster'
import setupCluster from '../src/setupCluster.js'

describe('setupCluster.ts', () => {
  describe('setupCluster', () => {
    let cluster
    beforeAll(async () => {
      Cluster.launch = jest.fn(() => {
        return {
          task: jest.fn(),
          idle: jest.fn(),
          close: jest.fn(),
          execute: jest.fn().mockResolvedValue(undefined as never),
        }
      }) as unknown as jest.Mocked<typeof Cluster.launch>
      await fs.promises.writeFile('./__tests__/output/processed.txt', '')

      setupCluster('./__tests__/input/', './__tests__/output', 1)

      cluster = (Cluster.launch as jest.Mock).mock.results[0].value
    })

    afterAll(async () => {
      await fs.promises.writeFile('./__tests__/output/processed.txt', '')
    }),

    it('should be a function', () => {
      expect(setupCluster).toBeInstanceOf(Function)
    })

    it('should create cluster instance by calling Cluster.launch once', () => {
      expect(Cluster.launch).toHaveBeenCalledTimes(1)
    })
    it('should set Cluster.launch option monitor to false when debugging or testing', () => {
      (Cluster.launch as jest.Mock).mock.calls[0][0].monitor = false
    })
    it('should set cluster task by calling cluster.task(function)', () => {
      expect(cluster.task).toHaveBeenCalledTimes(1)
      expect(cluster.task).toHaveBeenCalledWith(expect.any(Function))
    })
    it('should call cluster.execute(line) on each line of input files', async () => {
      const files = await fs.promises.readdir('./__tests__/input')
      let linesCounter = 0

      for (const file of files) {
        const filePath = path.join('./__tests__/input', file)
        const stat = await fs.promises.stat(filePath)
        if (!stat.isFile()) continue
        const fileStream = fs.createReadStream(filePath)
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity,
        })
        for await (const line of rl) {
          expect(cluster.execute.mock.calls[linesCounter][0].url).toBe(line)
          linesCounter++
        }
        rl.close()
        fileStream.close()
      }

      expect(cluster.execute).toHaveBeenCalledTimes(linesCounter)
    })

    it('should call cluster.idle()', () => {
      expect(cluster.idle).toHaveBeenCalledTimes(1)
    })
    it('should call cluster.close()', () => {
      expect(cluster.close).toHaveBeenCalledTimes(1)
    })

    afterAll(() => {
      cluster.task.mockClear()
    })
  })
})
