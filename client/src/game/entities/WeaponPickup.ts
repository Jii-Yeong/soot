import Phaser from 'phaser';
import type { WeaponConfig } from '@/game/config/weaponConfig';

export class WeaponPickup extends Phaser.Physics.Arcade.Sprite {
  private readonly label: Phaser.GameObjects.Text;
  private readonly prompt: Phaser.GameObjects.Text;
  private readonly comparison: Phaser.GameObjects.Text;
  private highlighted = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly weapon: WeaponConfig,
  ) {
    super(scene, x, y, weapon.displayTexture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(7).setBounce(0.22).setDragX(220);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(Math.max(22, this.width), Math.max(12, this.height), true);

    this.label = scene.add
      .text(x, y - 27, weapon.label, {
        color: `#${weapon.pickupColor.toString(16).padStart(6, '0')}`,
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.prompt = scene.add
      .text(x, y - 47, '[E] EQUIP', {
        color: '#ffffff',
        backgroundColor: '#070a0bd9',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);
    this.comparison = scene.add
      .text(x, y - 69, '', {
        color: '#d8dfdc',
        backgroundColor: '#070a0bd9',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);
  }

  override preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.label.setPosition(this.x, this.y - 27);
    this.prompt.setPosition(this.x, this.y - 47);
    this.comparison.setPosition(this.x, this.y - 69);
  }

  setHighlighted(highlighted: boolean, currentWeapon?: WeaponConfig) {
    if (currentWeapon) {
      this.updateComparison(currentWeapon);
    }

    if (this.highlighted === highlighted) {
      return;
    }

    this.highlighted = highlighted;
    this.prompt.setVisible(highlighted);
    this.comparison.setVisible(highlighted);
    this.setScale(highlighted ? 1.15 : 1);
    this.setTint(highlighted ? 0xffffff : this.weapon.pickupColor);
  }

  private updateComparison(currentWeapon: WeaponConfig) {
    const damage = this.totalTriggerDamage(this.weapon);
    const currentDamage = this.totalTriggerDamage(currentWeapon);
    const damageArrow = this.arrowFor(damage, currentDamage);
    const fireRateArrow = this.arrowFor(
      currentWeapon.fireInterval,
      this.weapon.fireInterval,
    );
    const pierceDelta = this.weapon.pierce - currentWeapon.pierce;
    const pierceText =
      pierceDelta === 0
        ? '='
        : pierceDelta > 0
          ? `+${pierceDelta}`
          : `${pierceDelta}`;

    this.comparison.setText(
      `DMG ${damageArrow}   RATE ${fireRateArrow}   PIERCE ${pierceText}`,
    );
  }

  private totalTriggerDamage(weapon: WeaponConfig) {
    return weapon.damage * weapon.pelletCount * weapon.burstCount;
  }

  private arrowFor(value: number, currentValue: number) {
    return value === currentValue ? '=' : value > currentValue ? '↑' : '↓';
  }

  override destroy(fromScene?: boolean) {
    this.label.destroy();
    this.prompt.destroy();
    this.comparison.destroy();
    super.destroy(fromScene);
  }
}
