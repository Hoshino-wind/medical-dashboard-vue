import type {
  AvailabilityItem,
  BarChartData,
  DeviceDistributionItem,
  LineChartData,
  OverviewData,
} from '@/types/dashboard'

const SECTIONS = {
  lifeSupport: '生命支持设备可用率',
  deviceDistribution: '设备分布台数占比',
  overview: '设备总览',
  maintenanceOrders: '保养工单',
  maintenanceStats: '保养统计',
  inspectionStats: '巡检统计',
  inspectionOrders: '巡检工单',
  repairOrders: '维修工单',
  ultrasound: '超声设备可用率',
  repairStats: '报修统计',
} as const

const SECTION_TITLES = new Set<string>(Object.values(SECTIONS))

type LooseRecord = Record<string, unknown>

export interface ServiceOrderItem {
  department: string
  equipName: string
  remainDays: number | string
  engineerName: string
}

export interface ParsedRepairOrderItem {
  department: string
  equipName: string
  repairCode: string
  repairReportDuration: string
  repairDuration: string
  responder: string
  status: string
}

export interface ParsedBigScreenFakeData {
  overview: OverviewData
  lifeSupport: AvailabilityItem[]
  ultrasound: AvailabilityItem[]
  deviceDistribution: DeviceDistributionItem[]
  maintenanceOrders: ServiceOrderItem[]
  inspectionOrders: ServiceOrderItem[]
  repairOrders: ParsedRepairOrderItem[]
  maintenanceStats: LineChartData
  inspectionStats: LineChartData
  repairStats: BarChartData
}

export function parseBigScreenFakeData(source: string): ParsedBigScreenFakeData {
  const sections = splitSections(source)
  assertRequiredSections(sections)

  return {
    overview: parseOverview(requireSection(sections, SECTIONS.overview)),
    lifeSupport: parseLifeSupport(requireSection(sections, SECTIONS.lifeSupport)),
    ultrasound: parseUltrasound(requireSection(sections, SECTIONS.ultrasound)),
    deviceDistribution: parseDeviceDistribution(
      requireSection(sections, SECTIONS.deviceDistribution),
    ),
    maintenanceOrders: parseServiceOrders(requireSection(sections, SECTIONS.maintenanceOrders)),
    inspectionOrders: parseServiceOrders(requireSection(sections, SECTIONS.inspectionOrders)),
    repairOrders: parseRepairOrders(requireSection(sections, SECTIONS.repairOrders)),
    maintenanceStats: parseLineChart(
      requireSection(sections, SECTIONS.maintenanceStats),
      'UpKeepTotal',
    ),
    inspectionStats: parseLineChart(
      requireSection(sections, SECTIONS.inspectionStats),
      'InspectionTotal',
    ),
    repairStats: parseRepairStats(requireSection(sections, SECTIONS.repairStats)),
  }
}

function assertRequiredSections(sections: Map<string, string>): void {
  for (const title of Object.values(SECTIONS)) {
    requireSection(sections, title)
  }
}

function splitSections(source: string): Map<string, string> {
  const sections = new Map<string, string>()
  let activeTitle: string | null = null
  let activeLines: string[] = []

  const flush = () => {
    if (activeTitle !== null) {
      sections.set(activeTitle, activeLines.join('\n'))
    }
  }

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const title = parseSectionTitle(line)

    if (title !== null) {
      flush()
      activeTitle = title
      activeLines = []
      continue
    }

    if (activeTitle !== null) {
      activeLines.push(line)
    }
  }

  flush()

  return sections
}

function parseSectionTitle(line: string): string | null {
  const match = line.match(/^\s*([^:：]+)\s*[：:]\s*$/)

  if (!match) {
    return null
  }

  const title = match[1].trim()
  return SECTION_TITLES.has(title) ? title : null
}

function requireSection(sections: Map<string, string>, title: string): string {
  const section = sections.get(title)

  if (section === undefined) {
    throw new Error(`缺少数据段: ${title}`)
  }

  return section
}

function parseLifeSupport(section: string): AvailabilityItem[] {
  return parseConstArray(section, 'fakeList').map((item) => ({
    name: stringField(item, 'deviceName'),
    count: numberField(item, 'total'),
    value: numberField(item, 'percent'),
  }))
}

function parseUltrasound(section: string): AvailabilityItem[] {
  return parseConstArray(section, 'fakeList').map((item) => ({
    name: stringField(item, 'departmentName'),
    count: numberField(item, 'totalCount'),
    value: numberField(item, 'availabilityRate'),
  }))
}

function parseDeviceDistribution(section: string): DeviceDistributionItem[] {
  return parseConstArray(section, 'fakedeviceDataRaw').map((item) => ({
    name: stringField(item, 'departmentName'),
    count: numberField(item, 'targetCount'),
    rate: numberField(item, 'rate'),
  }))
}

function parseOverview(section: string): OverviewData {
  return {
    total: refNumber(section, 'deviceTotal'),
    available: refNumber(section, 'availableDevice'),
    availability: refNumber(section, 'usageRate'),
    repairing: refNumber(section, 'repairing'),
    maintenanceDue: refNumber(section, 'toMaintain'),
    inspectionDue: refNumber(section, 'toInspect'),
  }
}

function parseServiceOrders(section: string): ServiceOrderItem[] {
  return parseConstArray(section, 'fakeTableData').map((item) => ({
    department: stringField(item, 'department'),
    equipName: stringField(item, 'equipName'),
    remainDays: remainDaysField(item),
    engineerName: stringField(item, 'engineerName'),
  }))
}

function parseRepairOrders(section: string): ParsedRepairOrderItem[] {
  return parseConstArray(section, 'fakeTableData').map((item) => ({
    department: stringField(item, 'department'),
    equipName: stringField(item, 'equipName'),
    repairCode: stringField(item, 'repairCode'),
    repairReportDuration: stringField(item, 'repairReportDuration'),
    repairDuration: stringField(item, 'repairDuration'),
    responder: stringField(item, 'responder'),
    status: stringField(item, 'status'),
  }))
}

function parseLineChart(section: string, dataKey: string): LineChartData {
  const data = parseConstObject(section, 'fakechartData')

  return {
    labels: stringArrayField(data, 'subBusiness'),
    data: numberArrayField(data, dataKey),
  }
}

function parseRepairStats(section: string): BarChartData {
  const data = parseConstObject(section, 'fakechartData')

  return {
    labels: stringArrayField(data, 'subBusiness'),
    series: [
      { name: '全保', data: numberArrayField(data, 'FullyInsuredDeviceTotal') },
      { name: '技保', data: numberArrayField(data, 'TechnicalInsuredDeviceTotal') },
      { name: '厂保', data: numberArrayField(data, 'FactoryInsureDeviceTotal') },
    ],
  }
}

function parseConstArray(section: string, constName: string): LooseRecord[] {
  const value = parseConstLiteral(section, constName)

  if (!Array.isArray(value)) {
    throw new Error(`变量 ${constName} 应为数组`)
  }

  return value.map((item, index) => recordValue(item, `${constName}[${index}]`))
}

function parseConstObject(section: string, constName: string): LooseRecord {
  return recordValue(parseConstLiteral(section, constName), constName)
}

function parseConstLiteral(section: string, constName: string): unknown {
  const code = stripLineComments(section)
  const constPattern = new RegExp(`\\bconst\\s+${escapeRegExp(constName)}\\s*=\\s*`)
  const match = constPattern.exec(code)

  if (!match) {
    throw new Error(`缺少变量: ${constName}`)
  }

  const rest = code.slice(match.index + match[0].length).trimStart()
  return parseLooseLiteral(extractBalancedLiteral(rest))
}

function refNumber(section: string, refName: string): number {
  const code = stripLineComments(section)
  const refPattern = new RegExp(`\\bconst\\s+${escapeRegExp(refName)}\\s*=\\s*ref\\(([^)]*)\\)`)
  const match = refPattern.exec(code)

  if (!match) {
    throw new Error(`缺少 ref 变量: ${refName}`)
  }

  return coerceNumber(parseScalarLiteral(match[1].trim()), refName)
}

function parseLooseLiteral(literal: string): unknown {
  const json = normalizeLooseJson(literal)

  try {
    return JSON.parse(json)
  } catch (error) {
    throw new Error(`无法解析数据字面量: ${(error as Error).message}`)
  }
}

function parseScalarLiteral(literal: string): unknown {
  const json = normalizeSingleQuotedStrings(literal)

  try {
    return JSON.parse(json)
  } catch {
    return literal
  }
}

function normalizeLooseJson(literal: string): string {
  return normalizeSingleQuotedStrings(literal)
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1')
}

function extractBalancedLiteral(source: string): string {
  const opener = source[0]

  if (opener !== '[' && opener !== '{') {
    throw new Error('数据字面量必须以数组或对象开始')
  }

  const stack: string[] = []
  let quote: '"' | "'" | null = null
  let escaped = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (quote !== null) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (char === '[' || char === '{') {
      stack.push(char)
      continue
    }

    if (char === ']' || char === '}') {
      const expectedOpener = char === ']' ? '[' : '{'

      if (stack.pop() !== expectedOpener) {
        throw new Error('数据字面量括号不匹配')
      }

      if (stack.length === 0) {
        return source.slice(0, index + 1)
      }
    }
  }

  throw new Error('数据字面量括号未闭合')
}

function stripLineComments(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const commentIndex = findLineCommentIndex(line)
      return commentIndex === -1 ? line : line.slice(0, commentIndex)
    })
    .join('\n')
}

function findLineCommentIndex(line: string): number {
  let quote: '"' | "'" | null = null
  let escaped = false

  for (let index = 0; index < line.length - 1; index += 1) {
    const char = line[index]

    if (quote !== null) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (char === '/' && line[index + 1] === '/') {
      return index
    }
  }

  return -1
}

function normalizeSingleQuotedStrings(source: string): string {
  let output = ''
  let inDoubleQuotedString = false
  let escaped = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (inDoubleQuotedString) {
      output += char

      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inDoubleQuotedString = false
      }
      continue
    }

    if (char === '"') {
      inDoubleQuotedString = true
      output += char
      continue
    }

    if (char === "'") {
      const parsed = readSingleQuotedString(source, index)
      output += JSON.stringify(parsed.value)
      index = parsed.endIndex
      continue
    }

    output += char
  }

  return output
}

function readSingleQuotedString(
  source: string,
  startIndex: number,
): { value: string; endIndex: number } {
  let value = ''
  let escaped = false

  for (let index = startIndex + 1; index < source.length; index += 1) {
    const char = source[index]

    if (escaped) {
      value += char
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === "'") {
      return { value, endIndex: index }
    }

    value += char
  }

  throw new Error('单引号字符串未闭合')
}

function recordValue(value: unknown, label: string): LooseRecord {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as LooseRecord
  }

  throw new Error(`${label} 应为对象`)
}

function stringField(record: LooseRecord, key: string): string {
  const value = record[key]

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  throw new Error(`字段 ${key} 应为字符串`)
}

function numberField(record: LooseRecord, key: string): number {
  return coerceNumber(record[key], key)
}

function remainDaysField(record: LooseRecord): number | string {
  const value = record.remainDays

  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  throw new Error('字段 remainDays 应为数字或字符串')
}

function stringArrayField(record: LooseRecord, key: string): string[] {
  const value = record[key]

  if (!Array.isArray(value)) {
    throw new Error(`字段 ${key} 应为字符串数组`)
  }

  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`字段 ${key}[${index}] 应为字符串`)
    }

    return item
  })
}

function numberArrayField(record: LooseRecord, key: string): number[] {
  const value = record[key]

  if (!Array.isArray(value)) {
    throw new Error(`字段 ${key} 应为数字数组`)
  }

  return value.map((item, index) => coerceNumber(item, `${key}[${index}]`))
}

function coerceNumber(value: unknown, label: string): number {
  const numberValue =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${label} 应为数字`)
  }

  return numberValue
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
