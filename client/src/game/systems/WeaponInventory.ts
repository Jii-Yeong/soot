export type WeaponInventorySnapshot = Readonly<{
  slots: readonly (string | null)[];
  activeSlotIndex: number;
}>;

/** 무기 소유와 슬롯 선택 규칙만 관리하는 Phaser 비의존 상태 객체. */
export class WeaponInventory {
  private readonly slots: Array<string | null>;
  private selectedSlotIndex = 0;

  constructor(startingWeaponId: string, size: number) {
    if (!Number.isInteger(size) || size < 1) {
      throw new Error('Weapon inventory size must be a positive integer');
    }
    this.slots = Array.from({ length: size }, (_, index) =>
      index === 0 ? startingWeaponId : null,
    );
  }

  get snapshot(): WeaponInventorySnapshot {
    return {
      slots: [...this.slots],
      activeSlotIndex: this.selectedSlotIndex,
    };
  }

  get activeWeaponId() {
    const weaponId = this.slots[this.selectedSlotIndex];
    if (!weaponId) {
      throw new Error('Active weapon slot is empty');
    }
    return weaponId;
  }

  get ownedWeaponIds() {
    return this.slots.filter(
      (weaponId): weaponId is string => weaponId !== null,
    );
  }

  /** 새 무기는 첫 빈칸에 넣고, 이미 가진 무기는 원래 칸을 선택함. */
  collect(weaponId: string) {
    const ownedSlotIndex = this.slots.indexOf(weaponId);
    const destinationIndex =
      ownedSlotIndex >= 0 ? ownedSlotIndex : this.slots.indexOf(null);
    if (destinationIndex < 0) {
      return false;
    }

    this.slots[destinationIndex] = weaponId;
    this.selectedSlotIndex = destinationIndex;
    return true;
  }

  /** 비어 있지 않은 유효 슬롯만 선택함. */
  select(slotIndex: number) {
    if (!Number.isInteger(slotIndex) || !this.slots[slotIndex]) {
      return false;
    }
    this.selectedSlotIndex = slotIndex;
    return true;
  }
}
