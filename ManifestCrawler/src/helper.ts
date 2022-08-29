import fs from 'fs'

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function appendToOutputCsv(outputCsv: string, data: string) {
  return fs.appendFileSync(outputCsv, data + '\n')
}