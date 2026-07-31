export type Cleanup = () => void;

export class CleanupRegistry {
  private readonly cleanups = new Set<Cleanup>();

  add(cleanup: Cleanup) {
    this.cleanups.add(cleanup);
  }

  delete(cleanup: Cleanup) {
    this.cleanups.delete(cleanup);
  }

  clear() {
    const pending = Array.from(this.cleanups);
    this.cleanups.clear();

    for (const cleanup of pending) {
      cleanup();
    }
  }
}
