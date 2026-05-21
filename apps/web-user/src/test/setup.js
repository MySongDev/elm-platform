class MemoryStorage {
  constructor() {
    this.store = new Map()
  }

  get length() {
    return this.store.size
  }

  clear() {
    this.store.clear()
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }

  key(index) {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key) {
    this.store.delete(key)
  }

  setItem(key, value) {
    this.store.set(key, String(value))
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
})

Object.defineProperty(window, 'localStorage', {
  value: globalThis.localStorage,
  configurable: true,
})
