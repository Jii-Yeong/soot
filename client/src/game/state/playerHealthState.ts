export type PlayerHealthListener = (
  currentHealth: number,
  maxHealth: number,
) => void;

export class PlayerHealthState {
  private currentHealth = 0;
  private maxHealth = 0;

  constructor(private readonly onChanged: PlayerHealthListener) {}

  restore(maxHealth: number) {
    if (maxHealth <= 0) {
      throw new RangeError('Player max health must be greater than zero');
    }

    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.notifyChanged();
  }

  takeDamage(amount: number) {
    this.currentHealth = Math.max(
      0,
      this.currentHealth - Math.max(0, amount),
    );
    this.notifyChanged();
    return this.currentHealth === 0;
  }

  private notifyChanged() {
    this.onChanged(this.currentHealth, this.maxHealth);
  }
}
