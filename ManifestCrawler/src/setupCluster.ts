// Custom imports
import clusterTask from './clusterTask.js'

// Built-in imports
import fs from 'fs'
import path from 'path'
import readline from 'readline'

// Dependencies import
import { Cluster } from 'puppeteer-cluster'
import vanillaPuppeteer from 'puppeteer'
import { addExtra, PuppeteerExtraPlugin, VanillaPuppeteer } from 'puppeteer-extra'
import AdblockerPkg from 'puppeteer-extra-plugin-adblocker'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Adblocker = AdblockerPkg as unknown as (options: any) => PuppeteerExtraPlugin

export default async function setupCluster(
  inputDir: string,
  outputDir: string,
  numberOfWorkers: number
) {
  const puppeteer = addExtra(vanillaPuppeteer as unknown as VanillaPuppeteer)
  puppeteer.use(Adblocker({ blockTrackers: true }))

  const cluster = await Cluster.launch({
    puppeteer,
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: numberOfWorkers,
    puppeteerOptions: {
      args: ['--lang="en-US"', '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/bin/chromium',
    },
    monitor: !(process.env.DEBUG || process.env.NODE_ENV === 'test'),
    skipDuplicateUrls: true,
    timeout: 30000
  })

  await cluster.task(clusterTask)

  const files = await fs.promises.readdir(inputDir)
  for (const file of files) {
    const filePath = path.join(inputDir, file)
    const stat = await fs.promises.stat(filePath)

    if (stat.isFile()) {
      const fileStream = fs.createReadStream(filePath)
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      for await (const line of rl) {
        cluster.execute({ url: line, outputDir }).then(async () => 
          await fs.promises.appendFile(outputDir + '/processed.txt', line + '\n')
        ).catch(async (err) => {
          await fs.promises.appendFile(outputDir + '/processed.txt', line + '\n')
          console.error(`Error crawling ${line}: ${err.message}`)
        })
      }

      rl.close()
      fileStream.close()
    }
  }

  // Wait until idle
  await cluster.idle()
  await cluster.close()
}
