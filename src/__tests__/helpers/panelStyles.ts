import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** panel.css 拆分后的分片,按 main.ts 中的导入(层叠)顺序排列。 */
const PANEL_STYLE_PARTS = [
  'panel-core.css',
  'panel-title.css',
  'panel-borderless.css',
  'panel-chamfered.css',
]

/**
 * 读取拆分后的 panel 样式并按导入顺序拼接为单一字符串。
 *
 * panel.css 已按小节拆成多个文件(core/title/borderless/chamfered),
 * 但仍有测试需要对"全部 panel 样式"做整体断言,故在此还原为等价整串,
 * 保持这些测试的匹配语义不变(顺序与原文件一致)。
 */
export function readPanelStyles(): string {
  return PANEL_STYLE_PARTS.map((name) =>
    readFileSync(resolve(process.cwd(), 'src/styles', name), 'utf8'),
  ).join('\n')
}
