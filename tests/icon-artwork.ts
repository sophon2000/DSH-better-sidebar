/** Resolve the native theme sprite before checking a button's default artwork. */
import { ICON_SYMBOLS } from '@deepseek-ai/dsh-client-ui-primitives'

export function iconArtwork(svg: SVGElement): string {
  const reference = svg.querySelector('use')?.getAttribute('href')
  if (reference === undefined || reference === null) return svg.innerHTML
  const artwork = reference.startsWith('#')
    ? ICON_SYMBOLS[reference.slice(1) as keyof typeof ICON_SYMBOLS]
    : undefined
  if (artwork === undefined) throw new Error(`unknown Host icon symbol: ${reference}`)
  return artwork
}

export function iconPaths(svg: SVGElement): (string | null)[] {
  const artwork = document.createElement('div')
  artwork.innerHTML = iconArtwork(svg)
  return [...artwork.querySelectorAll('path')].map(path => path.getAttribute('d'))
}
