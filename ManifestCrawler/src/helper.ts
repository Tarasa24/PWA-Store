import fs from 'fs'

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function appendToOutputCsv(outputCsv: string, data: string) {
  const outputCsvStream = fs.createWriteStream(outputCsv, { flags: 'a' })
  outputCsvStream.write(data + '\n')
  outputCsvStream.end()
}