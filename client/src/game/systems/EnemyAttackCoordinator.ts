/** 한 방에서 동시에 공격을 예고하거나 실행할 수 있는 적 수를 제한함. */
export class EnemyAttackCoordinator {
  private readonly owners = new Set<object>();

  constructor(private readonly limit: number) {}

  tryAcquire(owner: object) {
    if (this.owners.has(owner)) {
      return true;
    }
    if (this.owners.size >= this.limit) {
      return false;
    }
    this.owners.add(owner);
    return true;
  }

  release(owner: object) {
    this.owners.delete(owner);
  }

  get activeCount() {
    return this.owners.size;
  }
}
