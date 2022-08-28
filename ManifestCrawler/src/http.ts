import { ManifestObj } from './types.js'
import * as env from './env.js'

import * as axiosPkg from 'axios'
const axios = (axiosPkg.default || axiosPkg) as unknown as axiosPkg.AxiosStatic
import * as robotsParserPkg from 'robots-parser'
const robotsParser = robotsParserPkg.default as unknown as (
  url: string,
  robotstxt: string
) => robotsParserPkg.Robot

export function statusOK(status: number): boolean {
  return status >= 200 && status < 300
}

function fetchWithUserAgent(url: string) {
  const userAgent = env.userAgent

  return axios.get(url, {
    headers: {
      'User-Agent': userAgent,
    },
    validateStatus: statusOK,
  })
}

// predicate that returns true if the given object is a manifest object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isManifestObj(obj: any) {  
  return (
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.start_url === 'string' &&
    typeof obj.display === 'string' &&
    Array.isArray(obj.icons) &&
    obj.icons.every(
      (icon) =>
        typeof icon === 'object' &&
        typeof icon.src === 'string'
    )
  )
}

export async function getManifestObj(manifestURL: string): Promise<ManifestObj> | null {
  try {
    const res: axiosPkg.AxiosResponse<ManifestObj> = await fetchWithUserAgent(manifestURL)
    if (typeof res.data !== 'object') throw new Error('Error: Invalid JSON')
    else if (!isManifestObj(res.data)) throw new Error('Error: Invalid manifest object')
    else return res.data
  } catch (e: unknown) {
    throw new Error(`${(e as Error).message.replace('Error: ', '')} | ${manifestURL}`)
  }
}

export async function getRobotsTxt(
  robotsTxtURL: string
): Promise<robotsParserPkg.Robot> | null {
  try {
    const res: axiosPkg.AxiosResponse<string> = await fetchWithUserAgent(robotsTxtURL)
    if (typeof res.data !== 'string') throw new Error('Error: Invalid robots.txt')
    else return robotsParser(robotsTxtURL, res.data)
  } catch (e) {
    return null
  }
}

export default {
  getManifestObj,
  getRobotsTxt,
  statusOK,
}
