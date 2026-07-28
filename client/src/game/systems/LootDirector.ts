import Phaser from 'phaser';
import { WEAPON_DROP_CONFIG } from '@/game/config/lootTableConfig';
import type { WeaponConfig } from '@/game/config/weaponConfig';
import { WeaponPickup } from '@/game/entities/WeaponPickup';

type RandomSource = () => number;

export class LootDirector {
  private readonly pickups = new Set<WeaponPickup>();
  private killsSinceDrop = 0;
  private droppedThisRoom = false;
  private lastDroppedId: string | null = null;
  private highlightedPickup: WeaponPickup | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly floor: Phaser.Physics.Arcade.StaticGroup,
    private readonly weapons: readonly WeaponConfig[],
    private readonly onNearbyWeaponChanged: (
      weapon: WeaponConfig | null,
    ) => void,
    private readonly random: RandomSource = Math.random,
  ) {}

  /** Resets the per-room "at least one swap" guarantee. Call on room entry. */
  beginRoom() {
    this.droppedThisRoom = false;
  }

  tryDrop(x: number, y: number, activeWeaponId: string): WeaponPickup | null {
    this.killsSinceDrop += 1;

    // The first kill of every room always drops (an early weapon choice each
    // room), as does the pity timer; other kills roll the base chance.
    const guaranteed =
      !this.droppedThisRoom ||
      this.killsSinceDrop >= WEAPON_DROP_CONFIG.guaranteedAfterKills;
    if (!guaranteed && this.random() >= WEAPON_DROP_CONFIG.baseChance) {
      return null;
    }

    return this.dropWeapon(x, y, activeWeaponId);
  }

  /**
   * Guarantees at least one swap opportunity per room: if nothing dropped
   * while clearing it, force a drop (called when the room is cleared).
   */
  ensureRoomDrop(
    x: number,
    y: number,
    activeWeaponId: string,
  ): WeaponPickup | null {
    if (this.droppedThisRoom) {
      return null;
    }

    return this.dropWeapon(x, y, activeWeaponId);
  }

  private dropWeapon(x: number, y: number, activeWeaponId: string) {
    const weapon = this.selectDropWeapon(activeWeaponId);
    if (!weapon) {
      return null;
    }

    const pickup = this.spawnPickup(weapon, x, y);
    this.killsSinceDrop = 0;
    this.droppedThisRoom = true;
    this.lastDroppedId = weapon.id;
    return pickup;
  }

  /**
   * Excludes the equipped gun (never a swap) and the gun dropped last (so the
   * same weapon doesn't appear twice in a row), keeping runs varied. Falls
   * back to allowing a repeat only if that would otherwise leave no options.
   */
  private selectDropWeapon(activeWeaponId: string) {
    let candidates = this.weapons.filter(
      (weapon) =>
        weapon.id !== activeWeaponId && weapon.id !== this.lastDroppedId,
    );
    if (candidates.length === 0) {
      candidates = this.weapons.filter((weapon) => weapon.id !== activeWeaponId);
    }
    if (candidates.length === 0) {
      return null;
    }

    return this.selectWeightedWeapon(candidates);
  }

  update(player: Phaser.Physics.Arcade.Sprite, activeWeapon: WeaponConfig) {
    const nearest = this.findNearestPickup(player.x, player.y);

    if (this.highlightedPickup !== nearest) {
      this.highlightedPickup?.setHighlighted(false);
      nearest?.setHighlighted(true, activeWeapon);
      this.highlightedPickup = nearest;
      this.onNearbyWeaponChanged(nearest?.weapon ?? null);
      return;
    }

    nearest?.setHighlighted(true, activeWeapon);
  }

  takeNearest(
    player: Phaser.Physics.Arcade.Sprite,
    previousWeapon: WeaponConfig,
  ): WeaponConfig | null {
    const pickup = this.findNearestPickup(player.x, player.y);
    if (!pickup) {
      return null;
    }

    const { weapon, x, y } = pickup;
    this.removePickup(pickup);
    this.spawnPickup(previousWeapon, x, y - 6);
    return weapon;
  }

  clear() {
    for (const pickup of this.pickups) {
      pickup.destroy();
    }
    this.pickups.clear();
    this.highlightedPickup = null;
    this.onNearbyWeaponChanged(null);
  }

  private spawnPickup(weapon: WeaponConfig, x: number, y: number) {
    const pickup = new WeaponPickup(this.scene, x, y, weapon);
    pickup.setTint(weapon.pickupColor);
    this.scene.physics.add.collider(pickup, this.floor);
    this.pickups.add(pickup);
    return pickup;
  }

  private removePickup(pickup: WeaponPickup) {
    if (this.highlightedPickup === pickup) {
      this.highlightedPickup = null;
      this.onNearbyWeaponChanged(null);
    }
    this.pickups.delete(pickup);
    pickup.destroy();
  }

  private findNearestPickup(x: number, y: number) {
    let nearest: WeaponPickup | null = null;
    let nearestDistance: number = WEAPON_DROP_CONFIG.pickupRadius;

    for (const pickup of this.pickups) {
      if (!pickup.active) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(x, y, pickup.x, pickup.y);
      if (distance <= nearestDistance) {
        nearest = pickup;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private selectWeightedWeapon(candidates: readonly WeaponConfig[]) {
    const totalWeight = candidates.reduce(
      (total, weapon) => total + weapon.dropWeight,
      0,
    );
    let roll = this.random() * totalWeight;

    for (const weapon of candidates) {
      roll -= weapon.dropWeight;
      if (roll <= 0) {
        return weapon;
      }
    }

    return candidates[candidates.length - 1];
  }
}
