export const REM_BASE = 16

export function pxToRem(value: number, base = REM_BASE): string {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base === 0) {
    return '0rem'
  }

  const rem = Number((value / base).toFixed(5))
  return rem === 0 ? '0' : `${rem}rem`
}

export const rem = pxToRem
