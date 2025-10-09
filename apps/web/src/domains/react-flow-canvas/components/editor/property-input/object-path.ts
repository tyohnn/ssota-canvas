export function getValue(obj: any, path: string[]) {
  return path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function setValue(
  obj: Record<string, any>,
  path: string[],
  value: any
): Record<string, any> {
  if (!obj || path.length === 0) return obj;

  // Deep clone the object to avoid mutating the original
  const newObj = JSON.parse(JSON.stringify(obj));
  let cur: Record<string, any> = newObj;

  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i] as string;
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, any>;
  }

  const lastKey = path[path.length - 1] as string;
  cur[lastKey] = value;

  return newObj;
}
