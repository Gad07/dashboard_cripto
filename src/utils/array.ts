export function areArraysEqual<T>(a: T[], b: T[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((item, index) => item === b[index]);
}
