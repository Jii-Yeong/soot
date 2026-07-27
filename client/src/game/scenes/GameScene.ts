import Phaser from 'phaser';
import {
  PLAYER_COMBAT_CONFIG,
  RANGED_ENEMY_COMBAT_CONFIG,
} from '@/game/config/combatConfig';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import { FIRST_ROOM_CONFIG } from '@/game/config/roomConfig';
import { PlayerController } from '@/game/controllers/PlayerController';
import { RangedEnemy } from '@/game/entities/RangedEnemy';
import { gameEvents } from '@/game/events/gameEvents';
import type { GamePhase } from '@/game/state/gamePhase';
import type { RoomState } from '@/game/state/roomState';
import { ProjectilePool } from '@/game/systems/ProjectilePool';
import { RoomDirector } from '@/game/systems/RoomDirector';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies: RangedEnemy[] = [];
  private roomDirector!: RoomDirector;
  private playerController!: PlayerController;
  private playerProjectiles!: ProjectilePool;
  private enemyProjectiles!: ProjectilePool;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private enemyRangeGraphics!: Phaser.GameObjects.Graphics;
  private deathOverlay!: Phaser.GameObjects.Container;
  private playerHealth: number = PLAYER_COMBAT_CONFIG.maxHealth;
  private phase: GamePhase = 'boot';
  private nextFireAt = 0;

  constructor() {
    super('game');
  }

  create() {
    this.resetRunState();
    gameEvents.emit('scene-changed', 'game');
    this.setPhase('playing');

    this.createBackdrop();
    const floor = this.createFloor();
    this.createPlayer(floor);
    this.createRoom(floor);
    this.createCombatSystems();
    this.createCombatUi();
    this.bindInputHandlers();
  }

  update(time: number) {
    if (this.phase === 'dead') {
      return;
    }

    this.playerController.update(time);

    const pointer = this.input.activePointer;
    const aimPoint = pointer.positionToCamera(
      this.cameras.main,
    ) as Phaser.Math.Vector2;
    this.drawAimGuide(aimPoint);

    if (
      this.phase === 'playing' &&
      pointer.leftButtonDown() &&
      time >= this.nextFireAt
    ) {
      this.fireBullet(aimPoint, time);
    }

    if (this.phase === 'playing') {
      this.updateEnemyCombat(time);
    }
  }

  private createFloor() {
    const floor = this.physics.add.staticGroup();

    for (let x = 32; x < GAME_WIDTH; x += 64) {
      floor.create(x, GAME_HEIGHT - 32, 'floor-placeholder');
    }

    return floor;
  }

  private createPlayer(floor: Phaser.Physics.Arcade.StaticGroup) {
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
  }

  private createRoom(floor: Phaser.Physics.Arcade.StaticGroup) {
    this.roomDirector = new RoomDirector(
      this,
      this.player,
      FIRST_ROOM_CONFIG,
      (state) => this.handleRoomStateChanged(state),
    );
    this.enemies = FIRST_ROOM_CONFIG.rangedEnemySpawns.map((spawn) => {
      const enemy = new RangedEnemy(
        this,
        spawn.x,
        spawn.y,
        'enemy-placeholder',
        {
          health: RANGED_ENEMY_COMBAT_CONFIG.maxHealth,
          aggroRadius: RANGED_ENEMY_COMBAT_CONFIG.aggroRadius,
          fireInterval: RANGED_ENEMY_COMBAT_CONFIG.fireInterval,
        },
      );
      enemy.setAlpha(0);
      this.physics.add.collider(enemy, floor);
      this.tweens.add({
        targets: enemy,
        alpha: 1,
        duration: 260,
      });
      return enemy;
    });
    this.roomDirector.start(this.enemies);
    this.emitEnemyHealth();
  }

  private createCombatSystems() {
    this.playerController = new PlayerController(
      this,
      this.player,
      PLAYER_COMBAT_CONFIG,
    );
    this.playerProjectiles = new ProjectilePool(
      this,
      PLAYER_COMBAT_CONFIG.projectile,
    );
    this.enemyProjectiles = new ProjectilePool(
      this,
      RANGED_ENEMY_COMBAT_CONFIG.projectile,
    );
    this.physics.add.overlap(
      this.playerProjectiles.group,
      this.enemies,
      this.handleEnemyHit,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.enemyProjectiles.group,
      this.player,
      this.handlePlayerHit,
      undefined,
      this,
    );
  }

  private createCombatUi() {
    this.aimGraphics = this.add.graphics().setDepth(10);
    this.enemyRangeGraphics = this.add.graphics().setDepth(2);
    this.createDeathOverlay();

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

  private bindInputHandlers() {
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.keyboard?.on('keydown-R', this.handleRestartInput, this);
    this.input.keyboard?.on('keydown-ENTER', this.handleRestartInput, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.keyboard?.off('keydown-R', this.handleRestartInput, this);
      this.input.keyboard?.off('keydown-ENTER', this.handleRestartInput, this);
    });
  }

  private resetRunState() {
    this.playerHealth = PLAYER_COMBAT_CONFIG.maxHealth;
    this.nextFireAt = 0;
    gameEvents.emit(
      'health-changed',
      this.playerHealth,
      PLAYER_COMBAT_CONFIG.maxHealth,
    );
    gameEvents.emit('room-state-changed', 'idle');
  }

  private setPhase(phase: GamePhase) {
    this.phase = phase;
    gameEvents.emit('phase-changed', phase);
  }

  private handleRoomStateChanged(state: RoomState) {
    gameEvents.emit('room-state-changed', state);

    if (state === 'cleared') {
      this.setPhase('room-cleared');
      this.enemyProjectiles.clear();
      this.enemyRangeGraphics.clear();
    }
  }

  private handleRestartInput() {
    if (this.phase === 'dead') {
      this.scene.restart();
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.phase === 'dead') {
      return;
    }

    if (pointer.button === 2) {
      this.playerController.tryDash(this.time.now);
      return;
    }

    if (
      this.phase !== 'playing' ||
      pointer.button !== 0 ||
      this.time.now < this.nextFireAt
    ) {
      return;
    }

    const aimPoint = pointer.positionToCamera(
      this.cameras.main,
    ) as Phaser.Math.Vector2;
    this.fireBullet(aimPoint, this.time.now);
  }

  private fireBullet(aimPoint: Phaser.Math.Vector2, time: number) {
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      aimPoint.x,
      aimPoint.y,
    );
    const { muzzleOffset, fireInterval } = PLAYER_COMBAT_CONFIG.projectile;
    const projectile = this.playerProjectiles.fire(
      this.player.x + Math.cos(angle) * muzzleOffset,
      this.player.y + Math.sin(angle) * muzzleOffset,
      angle,
    );

    if (!projectile) {
      return;
    }

    this.nextFireAt = time + fireInterval;
  }

  private updateEnemyCombat(time: number) {
    this.enemyRangeGraphics.clear();

    for (const enemy of this.enemies) {
      if (!enemy.active) {
        continue;
      }

      const targetInRange = enemy.updateCombat(
        time,
        this.player,
        (attacker, target) => this.fireEnemyBullet(attacker, target),
      );
      this.enemyRangeGraphics.lineStyle(
        targetInRange ? 2 : 1,
        targetInRange ? 0xff5263 : 0x6d7b80,
        targetInRange ? 0.28 : 0.12,
      );
      this.enemyRangeGraphics.strokeCircle(enemy.x, enemy.y, enemy.aggroRadius);
    }
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
    const { muzzleOffset } = RANGED_ENEMY_COMBAT_CONFIG.projectile;
    this.enemyProjectiles.fire(
      enemy.x + Math.cos(angle) * muzzleOffset,
      enemy.y + Math.sin(angle) * muzzleOffset,
      angle,
    );
  }

  private handleEnemyHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    firstObject,
    secondObject,
  ) => {
    const enemy =
      firstObject instanceof RangedEnemy
        ? firstObject
        : (secondObject as RangedEnemy);
    const bullet =
      firstObject instanceof RangedEnemy
        ? (secondObject as Phaser.Physics.Arcade.Image)
        : (firstObject as Phaser.Physics.Arcade.Image);

    if (!bullet.active || !enemy.active) {
      return;
    }

    bullet.disableBody(true, true);
    const defeated = enemy.takeDamage(PLAYER_COMBAT_CONFIG.projectile.damage);
    this.emitEnemyHealth();

    enemy.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(70, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });

    if (defeated) {
      enemy.disableBody(true, true);
      this.roomDirector.markEnemyDefeated(enemy);
    }
  };

  private emitEnemyHealth() {
    const current = this.enemies.reduce(
      (total, enemy) => total + enemy.currentHealth,
      0,
    );
    const max = this.enemies.reduce(
      (total, enemy) => total + enemy.maxHealth,
      0,
    );
    gameEvents.emit('enemy-health-changed', current, max);
  }

  private handlePlayerHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    firstObject,
    secondObject,
  ) => {
    const player =
      firstObject === this.player
        ? this.player
        : (secondObject as Phaser.Physics.Arcade.Sprite);
    const bullet =
      firstObject === this.player
        ? (secondObject as Phaser.Physics.Arcade.Image)
        : (firstObject as Phaser.Physics.Arcade.Image);

    if (!bullet.active) {
      return;
    }

    bullet.disableBody(true, true);

    if (this.phase !== 'playing' || this.playerController.isInvulnerable) {
      return;
    }

    this.playerHealth = Math.max(
      0,
      this.playerHealth - RANGED_ENEMY_COMBAT_CONFIG.projectile.damage,
    );
    gameEvents.emit(
      'health-changed',
      this.playerHealth,
      PLAYER_COMBAT_CONFIG.maxHealth,
    );

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
    this.playerController.stop();
    this.setPhase('dead');
    this.player.setVelocity(0).setTint(0xe45d68).setAlpha(0.6);
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.playerProjectiles.clear();
    this.enemyProjectiles.clear();
    this.aimGraphics.clear();
    this.enemyRangeGraphics.clear();
    this.deathOverlay.setVisible(true);
    this.cameras.main.shake(180, 0.008);
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
