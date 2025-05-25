export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' ||
    (typeof self !== 'undefined' && typeof (self as any).importScripts === 'function')
  );
}
