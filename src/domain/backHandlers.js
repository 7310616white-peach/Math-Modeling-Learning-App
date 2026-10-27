export class BackHandlers {
  #items = [];
  #observers = new Set();
  add(handler, priority = 0) {
    const entry = { handler, priority };
    this.#items.push(entry);
    this.#emit();
    return () => {
      this.#items = this.#items.filter((item) => item !== entry);
      this.#emit();
    };
  }
  observe(callback) {
    this.#observers.add(callback);
    callback(this.#items.length > 0);
    return () => this.#observers.delete(callback);
  }
  #emit() {
    for (const callback of this.#observers) callback(this.#items.length > 0);
  }
  async run() {
    const sorted = [...this.#items].reverse().sort((a, b) => b.priority - a.priority);
    if (sorted[0]) await sorted[0].handler();
  }
}
