import { gzipSync } from 'node:zlib'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const assetsDirectory = new URL('../dist/assets/', import.meta.url)
const limits = {
  largestJavaScriptBytes: 550 * 1024,
  largestJavaScriptGzipBytes: 185 * 1024,
  totalAssetsBytes: 2 * 1024 * 1024,
}

const assetNames = await readdir(assetsDirectory)
const assetPaths = assetNames.map((name) => join(assetsDirectory.pathname, name))
const assetStats = await Promise.all(assetPaths.map((path) => stat(path)))
const totalAssetsBytes = assetStats.reduce((total, item) => total + item.size, 0)

const javascriptAssets = assetNames.filter((name) => name.endsWith('.js'))
const javascriptMeasurements = await Promise.all(
  javascriptAssets.map(async (name) => {
    const content = await readFile(join(assetsDirectory.pathname, name))
    return { name, bytes: content.length, gzipBytes: gzipSync(content).length }
  }),
)
const largestJavaScript = javascriptMeasurements.sort((a, b) => b.bytes - a.bytes)[0]

const failures = []
if (largestJavaScript.bytes > limits.largestJavaScriptBytes) {
  failures.push(
    `${largestJavaScript.name} 原始体积 ${largestJavaScript.bytes} 超过 ${limits.largestJavaScriptBytes}`,
  )
}
if (largestJavaScript.gzipBytes > limits.largestJavaScriptGzipBytes) {
  failures.push(
    `${largestJavaScript.name} gzip 体积 ${largestJavaScript.gzipBytes} 超过 ${limits.largestJavaScriptGzipBytes}`,
  )
}
if (totalAssetsBytes > limits.totalAssetsBytes) {
  failures.push(`assets 总体积 ${totalAssetsBytes} 超过 ${limits.totalAssetsBytes}`)
}

console.log(
  `包体检查：最大 JS ${largestJavaScript.name} ${largestJavaScript.bytes} B / gzip ${largestJavaScript.gzipBytes} B；assets 总计 ${totalAssetsBytes} B`,
)

if (failures.length > 0) {
  throw new Error(`包体预算超限：\n${failures.join('\n')}`)
}
