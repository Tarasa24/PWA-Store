import http  from './http.js'
import { userAgent } from './env.js'

import vanillaPuppeteer from 'puppeteer'
import { appendToOutputCsv, sleep } from './helper.js'
import crypto from 'crypto'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { unescape } from 'querystring'

export default async function ({
  page,
  data: { url: pageURL, outputDir },
  worker: { id: workerId },
}: {
  page: vanillaPuppeteer.Page
  data: {
    url: string,
    outputDir: string,
  },
  worker: {
    id: number
  }
}) {
  // Parse url for later use
  const { host } = new URL(pageURL)
  const baseURL = `https://${host}`
  const shasum = crypto.createHash('sha1')
  const hashedPageURL = shasum.update(pageURL).digest('hex')

  // Get robots.txt and save crawl delay if available
  const robots = await http.getRobotsTxt(baseURL + '/robots.txt')
  const crawlDelay = robots?.getCrawlDelay(userAgent) ?? 0

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en',
  })
  await page.setUserAgent(userAgent)

  // Prepare puppeteer request to count number of recieved bytes
  page.setRequestInterception(true)
  page.on('request', (request) => {
    request.continue()
  })
  let totalBytes = 0
  page.on('response', (response) => {
    const headers = response.headers()
    if (typeof headers['content-length'] !== 'undefined') {
      const length = parseInt(headers['content-length'])
      totalBytes += length
    }
  })

  // Start of puppeteer routine

  // Check if scope url is allowed by robots.txt
  if (robots && !robots.isAllowed(pageURL, userAgent)) 
    throw new Error(`${pageURL} is not allowed by robots.txt`)

  await page.setViewport({ width: 1724, height: 926 }) // Prepare viewport to be desktop sized
  await sleep(crawlDelay * 1000) // Obey by the crawl delay
  const res = await page.goto(pageURL, { waitUntil: 'networkidle2' })
  if (!res.ok()) throw new Error(`Page ${pageURL} could not be loaded`) // Check if page is loaded successfully

  // Check if page has registered a service worker, if not, throw error
  const hasServiceWorker = await page.evaluate(async () => (
    navigator && navigator.serviceWorker && (await navigator.serviceWorker.getRegistrations()).length) > 0)
  if (!hasServiceWorker) throw new Error(`Page ${pageURL} has no service worker`)

  // From html get path to manifest
  let manifestURL = await page.evaluate(() => {
    if (!document) return null
    const link = document.querySelector('link[rel="manifest"]')
    if (link) return link.getAttribute('href')
    else return null
  })
  if (!manifestURL) throw new Error(`No manifest found | ${pageURL}`)

  // Obtain manifest object
  if (!manifestURL.startsWith('http')) {
    if (manifestURL.charAt(0) === '/')
      // is absolute path
      manifestURL = new URL(manifestURL, baseURL).href
    // is relative path
    else manifestURL = manifestURL = new URL(manifestURL, pageURL).href
  }
  const manifest = await http.getManifestObj(manifestURL)

  // Create page directory
  if (!existsSync(`${outputDir}/${hashedPageURL}`)) await mkdir(`${outputDir}/${hashedPageURL}`)

  // Finally take a screenshot of the page
  await page.screenshot({ path: `${outputDir}/${hashedPageURL}/desktop.webp`, type: 'webp' })

  // Resize viewport to mobile size, reload page (obey by the crawl delay), and take a screenshot
  await page.setViewport({ width: 393, height: 851 })
  await sleep(crawlDelay * 1000)
  await page.reload({ waitUntil: 'networkidle2' })
  await page.screenshot({ path: `${outputDir}/${hashedPageURL}/mobile.webp`, type: 'webp' })

  // End of puppeteer routine

  // Obtain rest of the data and commit to database
  const description = await page.evaluate(() => {
    if (!document) return null
    const meta = document.querySelector('meta[name="description"]')
    if (meta) return meta.getAttribute('content')
    else return null
  })
  const author = await page.evaluate(() => {
    if (!document) return null
    const meta = document.querySelector('meta[name="author"]')
    if (meta) return meta.getAttribute('content')
    else return null
  })
  const lang = await page.evaluate(() => {
    if (!document) return null
    const meta = document.querySelector('meta[http-equiv="content-language"]')
    if (meta) return meta.getAttribute('content')
    const htmlLang = document.querySelector('html').getAttribute('lang')
    if (htmlLang) return htmlLang
    else return null
  })

  let iconURL = unescape(manifest.icons[0].src)
  if (!iconURL.startsWith('http')) {
    if (iconURL.charAt(0) === '/')
      // is absolute path
      iconURL = new URL(iconURL, baseURL).href
    // is relative path
    else iconURL = new URL(iconURL, manifestURL).href
  }

  appendToOutputCsv(`${outputDir}/output-${workerId}.tsv`, [
    manifest.short_name ?? manifest.name,
    (manifest.description ?? description).replace(new RegExp('\r?\n','g'), ' ') ?? 'null',
    lang ?? 'null',
    author ?? 'null',
    pageURL,
    totalBytes,
    iconURL,
    manifest.background_color ?? 'null',
    manifest.theme_color ?? 'null',
    manifest.screenshots ?? 'null'
  ].join('\t'))
}
