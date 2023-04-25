export function promisify(fn: Function, duration: number) {
    return new Promise(resolve => setTimeout(() => resolve(fn), duration * 1000))
}
