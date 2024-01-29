export function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return value && typeof (value as any).then === 'function';
}
