/**
 * ECharts 按需引入统一出口。
 *
 * 全项目所有需要 ECharts 的组件均从此处引入 echarts,
 * 取代在各处散落的 `import * as echarts from 'echarts'`,
 * 从而避免首屏打包全量 echarts(~1MB),实现体积下降。
 *
 * 仅注册当前实际用到的图表类型与组件:
 *   - LineChart  : LineAreaChart(折线面积图)
 *   - CustomChart: CubeBarChart(自定义 3D 玻璃柱状图,renderItem)
 *   - GridComponent : xAxis/yAxis + grid
 *   - TooltipComponent : 各图表的 tooltip
 *   - CanvasRenderer : 默认渲染器
 *
 * graphic(LinearGradient / RadialGradient / extendShape / registerShape)
 * 与类型 ECharts / EChartsOption 均由 echarts/core 直接导出,无需额外 use。
 *
 * Pie3D 使用 Three.js 真实挤出环图,不占用 ECharts pie/gl 注册。
 *
 * 未来若新增图表类型(如 BarChart / PieChart / 散点 / 雷达),
 * 只需在下方 use() 数组追加对应模块,组件层无需任何改动。
 */
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'

echarts.use([
  CanvasRenderer,
  LineChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
])

/**
 * 统一类型出口。echarts/core 导出的 EChartsCoreOption 已涵盖通用 option 结构,
 * 这里重命名为 EChartsOption 以保持与 ECharts 生态一致的命名,
 * 组件用具名 import 引用,避免 `echarts.EChartsOption` 这种命名空间访问
 * 在按需引入(core)模式下找不到成员的问题。
 */
export type EChartsOption = echarts.EChartsCoreOption
export type ECharts = echarts.ECharts

export default echarts
