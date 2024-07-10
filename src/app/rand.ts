function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

let getRand: () => number = Math.random

export function setSeeds(a: number, b: number, c: number, d: number) {
  getRand = sfc32(a, b, c, d)
}

export function shuffle<T>(arr: Readonly<T[]>): T[] {
  const copy = [...arr]
  for (let i = 0; i < copy.length; i++) {
    const idx = i + Math.floor(getRand() * (copy.length - i))
    const tmp = copy[idx]
    copy[idx] = copy[i]
    copy[i] = tmp
  }
  return copy
}