import { jest } from '@jest/globals'

import * as axiosPkg from 'axios'
const axios = axiosPkg.default || (axiosPkg as unknown as axiosPkg.AxiosStatic)
import * as MockAdapterPkg from 'axios-mock-adapter'
const MockAdapter = (MockAdapterPkg.default ||
  MockAdapterPkg) as unknown as Class<MockAdapterPkg.default>
import http from '../src/http.js'
import { Class } from '../src/types.js'

jest.mock('axios')

describe('http.ts', () => {
  describe('statusOK', () => {
    it('should return true for status >= 200 and status < 300', () => {
      expect(http.statusOK(200)).toBe(true)
      expect(http.statusOK(299)).toBe(true)
      expect(http.statusOK(300)).toBe(false)
      expect(http.statusOK(399)).toBe(false)
      expect(http.statusOK(400)).toBe(false)
      expect(http.statusOK(499)).toBe(false)
      expect(http.statusOK(500)).toBe(false)
      expect(http.statusOK(599)).toBe(false)
    })
  })
  describe('getManifestObj', () => {
    let mock
    beforeAll(() => {
      mock = new MockAdapter(axios)
    })

    it('should throw an error if the response is not ok', async () => {
      mock.onGet('https://example.com/manifest.json').reply(404)

      await expect(
        http.getManifestObj('https://example.com/manifest.json')
      ).rejects.toThrow(
        'Request failed with status code 404 | https://example.com/manifest.json'
      )
    })
    it('should throw an error if the response is not json', async () => {
      mock.onGet('https://example.com/manifest.json').reply(200, '<html>')

      await expect(
        http.getManifestObj('https://example.com/manifest.json')
      ).rejects.toThrow('Invalid JSON | https://example.com/manifest.json')
    })
    it('should throw an error if the response is not a manifest object', async () => {
      mock.onGet('https://example.com/manifest.json').reply(200, '{}')

      await expect(
        http.getManifestObj('https://example.com/manifest.json')
      ).rejects.toThrow(
        'Invalid manifest object | https://example.com/manifest.json'
      )
    })
    it('should return the manifest object if the response is ok', async () => {
      mock.onGet('https://example.com/manifest.json').reply(200, {
        name: 'Example',
        short_name: 'Example',
        description: 'Example',
        start_url: 'https://example.com/',
        scope: 'https://example.com/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'https://example.com/icon.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
        screenshots: [
          {
            src: 'https://example.com/screenshot.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
      })

      const manifestObj = await http.getManifestObj('https://example.com/manifest.json')
      expect(manifestObj).toEqual({
        name: 'Example',
        short_name: 'Example',
        description: 'Example',
        start_url: 'https://example.com/',
        scope: 'https://example.com/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'https://example.com/icon.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
        screenshots: [
          {
            src: 'https://example.com/screenshot.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
      })
    })
  })
  describe('getRobotsTxt', () => {
    let mock
    beforeAll(() => {
      mock = new MockAdapter(axios)
    })
    it('should return null if the response is not ok', async () => {
      mock.onGet('https://example.com/robots.txt').reply(404)

      await expect(http.getRobotsTxt('https://example.com/robots.txt')).resolves.toBe(
        null
      )
    })
    it('should return null if the response is not text', async () => {
      mock
        .onGet('https://example.com/robots.txt')
        .reply(200, {}, { 'content-type': 'application/json' })

      await expect(http.getRobotsTxt('https://example.com/robots.txt')).resolves.toBe(
        null
      )
    })
    it('should return robots-parser instance if the response is ok', async () => {
      mock
        .onGet('https://example.com/robots.txt')
        .reply(200, 'User-agent: *\nDisallow: /')

      await expect(
        http.getRobotsTxt('https://example.com/robots.txt')
      ).resolves.toBeDefined()
    })
  })
})
