import { jest } from '@jest/globals'
import { Page } from 'puppeteer'
import fs from 'fs'

import * as env from '../src/env.js'
import http from '../src/http.js'

import clusterTask from '../src/clusterTask.js'

describe('clusterTask.ts', () => {
  const evaluateResults = [
    true,
    'https://www.google.com/manifest.json',
    'description',
    'author',
    'lang'
  ]

  const page = {
    setExtraHTTPHeaders: jest.fn(),
    setUserAgent: jest.fn(),
    setRequestInterception: jest.fn(),
    on: jest.fn(),
    setViewport: jest.fn(),
    goto: jest.fn().mockResolvedValue({ok: jest.fn().mockResolvedValue(true as never)} as never),
    evaluate: jest.fn(async () => {
      const temp = evaluateResults[0]
      evaluateResults.shift()
      return temp
    }),
    screenshot: jest.fn(),
    reload: jest.fn(),
  } as unknown as jest.Mocked<Page>

  beforeAll(async () => {
    fs.writeFileSync('./__tests__/output/output-1.tsv', '')
    http.getManifestObj = jest.fn().mockResolvedValue({
      name: 'name',
      short_name: undefined,
      description: 'description',
      start_url: 'https://www.google.com/',
      scope: undefined,
      display: 'standalone',
      background_color: undefined,
      theme_color: undefined,
      icons: [{
        src: 'https://www.google.com/icon.png',
        type: 'image/png',
        sizes: '512x512'
      }],
      screenshots: undefined
    } as never) as unknown as jest.Mocked<typeof http.getManifestObj>

    jest.mock('puppeteer')

    await clusterTask({
      page,
      data: { url: 'https://www.google.com', outputDir: './__tests__/output' },
      worker: { id: 1 },
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  it('should be a function', () => {
    expect(clusterTask).toBeInstanceOf(Function)
  })
  it('should call page.setExtraHTTPHeaders with correct headers', () => {
    expect(page.setExtraHTTPHeaders).toHaveBeenCalledTimes(1)
    expect(page.setExtraHTTPHeaders).toHaveBeenCalledWith({
      'Accept-Language': 'en',
    })
  })
  it('should call page.setUserAgent with correct user agent', () => {
    expect(page.setUserAgent).toHaveBeenCalledTimes(1)
    expect(page.setUserAgent).toHaveBeenCalledWith(env.userAgent)
  })
  it('should call page.setRequestInterception with correct value', () => {
    expect(page.setRequestInterception).toHaveBeenCalledTimes(1)
    expect(page.setRequestInterception).toHaveBeenCalledWith(true)
  })
  it('should call page.on with correct event and callback', () => {
    expect(page.on).toHaveBeenCalledTimes(2)
    expect(page.on).toHaveBeenCalledWith('request', expect.any(Function))
  }),

  it('should call page.setViewport twice', () => {
    expect(page.setViewport).toHaveBeenCalledTimes(2)
  })
  it('should call page.screenshot twice', () => {
    expect(page.screenshot).toHaveBeenCalledTimes(2)
  })
  it('should call page.goto with correct value', () => {
    expect(page.goto).toHaveBeenCalledTimes(1)
    expect(page.goto).toHaveBeenCalledWith('https://www.google.com', {'waitUntil': 'networkidle2'})
  })
})
