export function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

export function dateSeed(date = new Date()) {
  const key = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  return {
    key,
    seed: Number(key.replace(/-/g, '')),
  };
}

export function runSeed(date = new Date()) {
  const daily = dateSeed(date);
  const entropy =
    date.getHours() * 3600000 +
    date.getMinutes() * 60000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds() +
    Math.floor(Math.random() * 100000);

  return {
    key: `${daily.key}-${entropy}`,
    seed: (daily.seed + entropy) >>> 0,
  };
}
