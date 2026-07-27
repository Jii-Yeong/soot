import Phaser from 'phaser';
import { RangedEnemy } from '@/game/entities/RangedEnemy';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/gameConfig';
import { gameEvents } from '@/game/events/gameEvents';

const MOVE_SPEED = 300;
const JUMP_SPEED = 560;
const FAST_FALL_SPEED = 720;
const BULLET_SPEED = 950;
const FIRE_INTERVAL = 110;
const BULLET_LIFETIME = 900;
const PLAYER_BULLET_DAMAGE = 10;
const PLAYER_MAX_HEALTH = 100;
const ENEMY_AGGRO_RADIUS = 520;
const ENEMY_FIRE_INTERVAL = 900;
const ENEMY_BULLET_SPEED = 430;
const ENEMY_BULLET_LIFETIME = 1800;
const ENEMY_BULLET_DAMAGE = 10;
const ENEMY_MAX_HEALTH = 100;

type MovementKeys = Record<
  'left' | 'right' | 'jump' | 'down',
  Phaser.Input.Keyboard.Key
>;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemy!: RangedEnemy;
  private movementKeys!: MovementKeys;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private enemyRangeGraphics!: Phaser.GameObjects.Graphics;
  private enemyStateText!: Phaser.GameObjects.Text;
  private playerHealth = PLAYER_MAX_HEALTH;
  private nextFireAt = 0;

  constructor() {
    super('game');
  }

  create() {
    gameEvents.emit('scene-changed', 'game');
    gameEvents.emit('health-changed', this.playerHealth, PLAYER_MAX_HEALTH);

    this.createBackdrop();
    const floor = this.physics.add.staticGroup();

    for (let x = 32; x < GAME_WIDTH; x += 64) {
      floor.create(x, GAME_HEIGHT - 32, 'floor-placeholder');
    }

    this.player = this.physics.add.sprite(
      180,
      GAME_HEIGHT - 120,
      'player',
      'shoot-posture 0.aseprite',
    );
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(36, 76, true);
    this.player.play('player-idle');
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, floor);

    this.enemy = new RangedEnemy(
      this,
      900,
      GAME_HEIGHT - 120,
      'enemy-placeholder',
      {
        health: ENEMY_MAX_HEALTH,
        aggroRadius: ENEMY_AGGRO_RADIUS,
        fireInterval: ENEMY_FIRE_INTERVAL,
      },
    );
    this.physics.add.collider(this.enemy, floor);
    gameEvents.emit(
      'enemy-health-changed',
      this.enemy.currentHealth,
      this.enemy.maxHealth,
    );

    this.movementKeys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
    }) as MovementKeys;

    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 80,
      allowGravity: false,
    });
    this.enemyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 40,
      allowGravity: false,
    });
    this.physics.add.overlap(
      this.playerBullets,
      this.enemy,
      this.handleEnemyHit,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.enemyBullets,
      this.player,
      this.handlePlayerHit,
      undefined,
      this,
    );

    this.aimGraphics = this.add.graphics().setDepth(10);
    this.enemyRangeGraphics = this.add.graphics().setDepth(2);
    this.enemyStateText = this.add
      .text(this.enemy.x, this.enemy.y - 52, 'SCANNING', {
        color: '#9aafb5',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const aimPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      if (this.time.now >= this.nextFireAt) {
        this.fireBullet(aimPoint, this.time.now);
      }
    });

    this.add
      .text(
        GAME_WIDTH - 32,
        GAME_HEIGHT - 96,
        'WASD  MOVE    MOUSE  AIM    CLICK  FIRE',
        {
          color: '#879197',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
        },
      )
      .setOrigin(1, 0.5);
  }

  update(time: number) {
    const movingLeft = this.movementKeys.left.isDown;
    const movingRight = this.movementKeys.right.isDown;

    if (movingLeft === movingRight) {
      this.player.setVelocityX(0);
    } else {
      this.player.setVelocityX(movingLeft ? -MOVE_SPEED : MOVE_SPEED);
      this.player.setFlipX(movingLeft);
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.movementKeys.jump) &&
      this.player.body?.blocked.down
    ) {
      this.player.setVelocityY(-JUMP_SPEED);
    }

    if (
      this.movementKeys.down.isDown &&
      !this.player.body?.blocked.down &&
      this.player.body!.velocity.y < FAST_FALL_SPEED
    ) {
      this.player.setVelocityY(FAST_FALL_SPEED);
    }

    const pointer = this.input.activePointer;
    const aimPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    this.drawAimGuide(aimPoint);

    if (pointer.isDown && time >= this.nextFireAt) {
      this.fireBullet(aimPoint, time);
    }

    this.updateEnemyCombat(time);
  }

  private fireBullet(aimPoint: Phaser.Math.Vector2, time: number) {
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      aimPoint.x,
      aimPoint.y,
    );
    const muzzleOffset = 28;
    const bullet = this.playerBullets.get(
      this.player.x + Math.cos(angle) * muzzleOffset,
      this.player.y + Math.sin(angle) * muzzleOffset,
      'bullet-placeholder',
    ) as Phaser.Physics.Arcade.Image | null;

    if (!bullet) {
      return;
    }

    bullet.enableBody(true, bullet.x, bullet.y, true, true);
    bullet.setActive(true).setVisible(true).setRotation(angle).setDepth(8);
    this.physics.velocityFromRotation(angle, BULLET_SPEED, bullet.body!.velocity);

    this.time.delayedCall(BULLET_LIFETIME, () => {
      if (bullet.active) {
        bullet.disableBody(true, true);
      }
    });

    this.nextFireAt = time + FIRE_INTERVAL;
  }

  private updateEnemyCombat(time: number) {
    if (!this.enemy.active) {
      this.enemyRangeGraphics.clear();
      this.enemyStateText
        .setPosition(this.enemy.x, this.enemy.y - 52)
        .setText('NEUTRALIZED')
        .setColor('#6c777b');
      return;
    }

    const targetInRange = this.enemy.updateCombat(
      time,
      this.player,
      (enemy, target) => this.fireEnemyBullet(enemy, target),
    );

    this.enemyStateText
      .setPosition(this.enemy.x, this.enemy.y - 52)
      .setText(targetInRange ? 'TARGET LOCKED' : 'SCANNING')
      .setColor(targetInRange ? '#ff7180' : '#9aafb5');

    this.enemyRangeGraphics.clear();
    this.enemyRangeGraphics.lineStyle(
      targetInRange ? 2 : 1,
      targetInRange ? 0xff5263 : 0x6d7b80,
      targetInRange ? 0.28 : 0.12,
    );
    this.enemyRangeGraphics.strokeCircle(
      this.enemy.x,
      this.enemy.y,
      this.enemy.aggroRadius,
    );
  }

  private fireEnemyBullet(
    enemy: RangedEnemy,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    const muzzleOffset = 36;
    const bullet = this.enemyBullets.get(
      enemy.x + Math.cos(angle) * muzzleOffset,
      enemy.y + Math.sin(angle) * muzzleOffset,
      'enemy-bullet-placeholder',
    ) as Phaser.Physics.Arcade.Image | null;

    if (!bullet) {
      return;
    }

    bullet.enableBody(true, bullet.x, bullet.y, true, true);
    bullet.setActive(true).setVisible(true).setRotation(angle).setDepth(8);
    this.physics.velocityFromRotation(
      angle,
      ENEMY_BULLET_SPEED,
      bullet.body!.velocity,
    );

    this.time.delayedCall(ENEMY_BULLET_LIFETIME, () => {
      if (bullet.active) {
        bullet.disableBody(true, true);
      }
    });
  }

  private handleEnemyHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    enemyObject,
    bulletObject,
  ) => {
    const bullet = bulletObject as Phaser.Physics.Arcade.Image;
    const enemy = enemyObject as RangedEnemy;

    if (!bullet.active || !enemy.active) {
      return;
    }

    bullet.disableBody(true, true);
    const defeated = enemy.takeDamage(PLAYER_BULLET_DAMAGE);
    gameEvents.emit(
      'enemy-health-changed',
      enemy.currentHealth,
      enemy.maxHealth,
    );

    enemy.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(70, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });

    if (defeated) {
      enemy.disableBody(true, true);
      this.enemyRangeGraphics.clear();
    }
  };

  private handlePlayerHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    playerObject,
    bulletObject,
  ) => {
    const bullet = bulletObject as Phaser.Physics.Arcade.Image;
    const player = playerObject as Phaser.Physics.Arcade.Sprite;

    if (!bullet.active || this.playerHealth === 0) {
      return;
    }

    bullet.disableBody(true, true);
    this.playerHealth = Math.max(0, this.playerHealth - ENEMY_BULLET_DAMAGE);
    gameEvents.emit('health-changed', this.playerHealth, PLAYER_MAX_HEALTH);

    player.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.cameras.main.shake(90, 0.004);
    this.time.delayedCall(80, () => player.clearTint());
  };

  private drawAimGuide(aimPoint: Phaser.Math.Vector2) {
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      aimPoint.x,
      aimPoint.y,
    );
    const guideLength = 58;

    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(2, 0xf0a35b, 0.9);
    this.aimGraphics.lineBetween(
      this.player.x,
      this.player.y,
      this.player.x + Math.cos(angle) * guideLength,
      this.player.y + Math.sin(angle) * guideLength,
    );
    this.aimGraphics.lineStyle(1, 0xb6ffe4, 0.75);
    this.aimGraphics.strokeCircle(aimPoint.x, aimPoint.y, 8);
    this.aimGraphics.lineBetween(aimPoint.x - 12, aimPoint.y, aimPoint.x + 12, aimPoint.y);
    this.aimGraphics.lineBetween(aimPoint.x, aimPoint.y - 12, aimPoint.x, aimPoint.y + 12);
  }

  private createBackdrop() {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x111719, 0x111719, 0x080a0b, 0x080a0b);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.lineStyle(1, 0x243036, 0.55);
    for (let x = 64; x < GAME_WIDTH; x += 64) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT - 64);
    }
    for (let y = 80; y < GAME_HEIGHT - 64; y += 64) {
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }

    graphics.fillStyle(0xf0a35b, 0.8);
    graphics.fillRect(0, 110, GAME_WIDTH, 3);
    graphics.fillStyle(0xb6ffe4, 0.7);
    graphics.fillRect(0, 116, GAME_WIDTH * 0.36, 1);
  }
}
