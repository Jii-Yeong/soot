import Phaser from 'phaser';
import { RangedEnemy } from '@/game/entities/RangedEnemy';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/gameConfig';
import { gameEvents } from '@/game/events/gameEvents';
import type { GamePhase } from '@/game/state/gamePhase';

const MOVE_SPEED = 300;
const JUMP_SPEED = 560;
const FAST_FALL_SPEED = 720;
const DASH_SPEED = 760;
const DASH_DURATION = 170;
const DASH_COOLDOWN = 800;
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
  'left' | 'right' | 'jump' | 'down' | 'dash' | 'restart' | 'confirm',
  Phaser.Input.Keyboard.Key
>;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemy!: RangedEnemy;
  private movementKeys!: MovementKeys;
  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private enemyRangeGraphics!: Phaser.GameObjects.Graphics;
  private enemyStateText!: Phaser.GameObjects.Text;
  private deathOverlay!: Phaser.GameObjects.Container;
  private playerHealth = PLAYER_MAX_HEALTH;
  private phase: GamePhase = 'boot';
  private nextFireAt = 0;
  private dashReadyAt = 0;
  private dashEndsAt = 0;
  private dashDirection = 1;
  private isDashing = false;
  private isInvulnerable = false;

  constructor() {
    super('game');
  }

  create() {
    this.resetRunState();
    gameEvents.emit('scene-changed', 'game');
    this.setPhase('playing');

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
      dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      confirm: Phaser.Input.Keyboard.KeyCodes.ENTER,
    }) as MovementKeys;
    this.cursorKeys = this.input.keyboard!.createCursorKeys();
    this.input.mouse?.disableContextMenu();

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
    this.createDeathOverlay();
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.keyboard?.on('keydown-R', this.handleRestartInput, this);
    this.input.keyboard?.on('keydown-ENTER', this.handleRestartInput, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.keyboard?.off('keydown-R', this.handleRestartInput, this);
      this.input.keyboard?.off('keydown-ENTER', this.handleRestartInput, this);
    });

    this.add
      .text(
        GAME_WIDTH - 32,
        GAME_HEIGHT - 96,
        'A/D  MOVE    SPACE/W  JUMP    SHIFT/RMB  DASH    LMB  FIRE',
        {
          color: '#879197',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
        },
      )
      .setOrigin(1, 0.5);
  }

  update(time: number) {
    if (this.phase === 'dead') {
      if (
        Phaser.Input.Keyboard.JustDown(this.movementKeys.restart) ||
        Phaser.Input.Keyboard.JustDown(this.movementKeys.confirm)
      ) {
        this.scene.restart();
      }
      return;
    }

    const movingLeft =
      this.movementKeys.left.isDown || this.cursorKeys.left.isDown;
    const movingRight =
      this.movementKeys.right.isDown || this.cursorKeys.right.isDown;

    if (
      Phaser.Input.Keyboard.JustDown(this.movementKeys.dash) &&
      time >= this.dashReadyAt
    ) {
      this.startDash(time, movingLeft, movingRight);
    }

    if (this.isDashing && time >= this.dashEndsAt) {
      this.finishDash();
    }

    if (this.isDashing) {
      this.player.setVelocity(DASH_SPEED * this.dashDirection, 0);
    } else {
      if (movingLeft === movingRight) {
        this.player.setVelocityX(0);
      } else {
        this.player.setVelocityX(movingLeft ? -MOVE_SPEED : MOVE_SPEED);
        this.player.setFlipX(movingLeft);
      }

      const jumpPressed =
        Phaser.Input.Keyboard.JustDown(this.movementKeys.jump) ||
        Phaser.Input.Keyboard.JustDown(this.cursorKeys.up) ||
        Phaser.Input.Keyboard.JustDown(this.cursorKeys.space);

      if (jumpPressed && this.player.body?.blocked.down) {
        this.player.setVelocityY(-JUMP_SPEED);
      }

      if (
        (this.movementKeys.down.isDown || this.cursorKeys.down.isDown) &&
        !this.player.body?.blocked.down &&
        this.player.body!.velocity.y < FAST_FALL_SPEED
      ) {
        this.player.setVelocityY(FAST_FALL_SPEED);
      }
    }

    const pointer = this.input.activePointer;
    const aimPoint = pointer.positionToCamera(
      this.cameras.main,
    ) as Phaser.Math.Vector2;
    this.drawAimGuide(aimPoint);

    if (pointer.leftButtonDown() && time >= this.nextFireAt) {
      this.fireBullet(aimPoint, time);
    }

    this.updateEnemyCombat(time);
  }

  private resetRunState() {
    this.playerHealth = PLAYER_MAX_HEALTH;
    this.nextFireAt = 0;
    this.dashReadyAt = 0;
    this.dashEndsAt = 0;
    this.dashDirection = 1;
    this.isDashing = false;
    this.isInvulnerable = false;
    gameEvents.emit('health-changed', this.playerHealth, PLAYER_MAX_HEALTH);
  }

  private setPhase(phase: GamePhase) {
    this.phase = phase;
    gameEvents.emit('phase-changed', phase);
  }

  private handleRestartInput() {
    if (this.phase === 'dead') {
      this.scene.restart();
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.phase !== 'playing') {
      return;
    }

    if (pointer.button === 2) {
      this.startDash(
        this.time.now,
        this.movementKeys.left.isDown || this.cursorKeys.left.isDown,
        this.movementKeys.right.isDown || this.cursorKeys.right.isDown,
      );
      return;
    }

    if (pointer.button !== 0 || this.time.now < this.nextFireAt) {
      return;
    }

    const aimPoint = pointer.positionToCamera(
      this.cameras.main,
    ) as Phaser.Math.Vector2;
    this.fireBullet(aimPoint, this.time.now);
  }

  private startDash(time: number, movingLeft: boolean, movingRight: boolean) {
    if (this.phase !== 'playing' || this.isDashing || time < this.dashReadyAt) {
      return;
    }

    this.dashDirection =
      movingLeft === movingRight
        ? this.player.flipX
          ? -1
          : 1
        : movingLeft
          ? -1
          : 1;
    this.isDashing = true;
    this.isInvulnerable = true;
    this.dashEndsAt = time + DASH_DURATION;
    this.dashReadyAt = time + DASH_COOLDOWN;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.player
      .setVelocity(DASH_SPEED * this.dashDirection, 0)
      .setTint(0xb6ffe4);
  }

  private finishDash() {
    if (!this.isDashing) {
      return;
    }

    this.isDashing = false;
    this.isInvulnerable = false;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    this.player.setVelocityX(0).clearTint();
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
    this.physics.velocityFromRotation(
      angle,
      BULLET_SPEED,
      bullet.body!.velocity,
    );
    this.scheduleProjectileExpiry(bullet, BULLET_LIFETIME);

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
    const angle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      target.x,
      target.y,
    );
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
    this.scheduleProjectileExpiry(bullet, ENEMY_BULLET_LIFETIME);
  }

  private scheduleProjectileExpiry(
    bullet: Phaser.Physics.Arcade.Image,
    lifetime: number,
  ) {
    const launchId = (bullet.getData('launchId') ?? 0) + 1;
    bullet.setData('launchId', launchId);

    this.time.delayedCall(lifetime, () => {
      if (bullet.active && bullet.getData('launchId') === launchId) {
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

    if (!bullet.active) {
      return;
    }

    bullet.disableBody(true, true);

    if (this.phase !== 'playing' || this.isInvulnerable) {
      return;
    }

    this.playerHealth = Math.max(0, this.playerHealth - ENEMY_BULLET_DAMAGE);
    gameEvents.emit('health-changed', this.playerHealth, PLAYER_MAX_HEALTH);

    player.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.cameras.main.shake(90, 0.004);
    this.time.delayedCall(80, () => {
      if (this.phase === 'playing') {
        player.clearTint();
      }
    });

    if (this.playerHealth === 0) {
      this.handlePlayerDeath();
    }
  };

  private handlePlayerDeath() {
    this.finishDash();
    this.setPhase('dead');
    this.player.setVelocity(0).setTint(0xe45d68).setAlpha(0.6);
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.clearProjectiles(this.playerBullets);
    this.clearProjectiles(this.enemyBullets);
    this.aimGraphics.clear();
    this.enemyRangeGraphics.clear();
    this.enemyStateText.setText('STANDBY').setColor('#6c777b');
    this.deathOverlay.setVisible(true);
    this.cameras.main.shake(180, 0.008);
  }

  private clearProjectiles(group: Phaser.Physics.Arcade.Group) {
    for (const child of group.getChildren()) {
      (child as Phaser.Physics.Arcade.Image).disableBody(true, true);
    }
  }

  private createDeathOverlay() {
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 470, 150, 0x070a0b, 0.92)
      .setStrokeStyle(2, 0xe45d68);
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 28, 'SYSTEM FAILURE', {
        color: '#ff7180',
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 34,
        'PRESS R OR ENTER TO RESTART',
        {
          color: '#e8ece9',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
        },
      )
      .setOrigin(0.5);

    this.deathOverlay = this.add
      .container(0, 0, [panel, title, prompt])
      .setDepth(100)
      .setVisible(false);
  }

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
    this.aimGraphics.lineBetween(
      aimPoint.x - 12,
      aimPoint.y,
      aimPoint.x + 12,
      aimPoint.y,
    );
    this.aimGraphics.lineBetween(
      aimPoint.x,
      aimPoint.y - 12,
      aimPoint.x,
      aimPoint.y + 12,
    );
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
