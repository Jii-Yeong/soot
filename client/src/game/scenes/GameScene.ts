import Phaser from 'phaser';
import {
  FLYING_ENEMY_COMBAT_CONFIG,
  PLAYER_COMBAT_CONFIG,
  RANGED_ENEMY_COMBAT_CONFIG,
} from '@/game/config/combatConfig';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import type { RoomConfig } from '@/game/config/roomConfig';
import { STAGES } from '@/game/config/stageConfig';
import { WEAPON_CONFIGS, type WeaponConfig } from '@/game/config/weaponConfig';
import { PlayerController } from '@/game/controllers/PlayerController';
import { Enemy, type EnemyProjectileKind } from '@/game/entities/Enemy';
import { gameEvents } from '@/game/events/gameEvents';
import type { GamePhase } from '@/game/state/gamePhase';
import type { RoomState } from '@/game/state/roomState';
import { EnemyFactory } from '@/game/systems/EnemyFactory';
import { ProjectilePool } from '@/game/systems/ProjectilePool';
import { RoomDirector } from '@/game/systems/RoomDirector';

type WeaponRuntime = {
  config: WeaponConfig;
  pool: ProjectilePool;
  nextFireAt: number;
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies: Enemy[] = [];
  private floorGroup!: Phaser.Physics.Arcade.StaticGroup;
  private currentStageIndex = 0;
  private currentRoomIndex = 0;
  private roomDirector!: RoomDirector;
  private playerController!: PlayerController;
  private weapons: WeaponRuntime[] = [];
  private activeWeaponIndex = 0;
  private enemyProjectiles!: ProjectilePool;
  private flyingEnemyProjectiles!: ProjectilePool;
  private enemyProjectilePools!: Record<EnemyProjectileKind, ProjectilePool>;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private enemyRangeGraphics!: Phaser.GameObjects.Graphics;
  private backdropGraphics!: Phaser.GameObjects.Graphics;
  private neonAccent?: Phaser.GameObjects.Rectangle;
  private neonFlickerTimer?: Phaser.Time.TimerEvent;
  private deathOverlay!: Phaser.GameObjects.Container;
  private stageClearOverlay!: Phaser.GameObjects.Container;
  private weaponLabelText!: Phaser.GameObjects.Text;
  private stageLabelText!: Phaser.GameObjects.Text;
  private playerHealth: number = PLAYER_COMBAT_CONFIG.maxHealth;
  private phase: GamePhase = 'boot';

  constructor() {
    super('game');
  }

  private get activeWeapon(): WeaponRuntime {
    return this.weapons[this.activeWeaponIndex];
  }

  private get stage() {
    return STAGES[this.currentStageIndex];
  }

  private get currentRoomConfig() {
    return this.stage.rooms[this.currentRoomIndex];
  }

  create() {
    this.resetRunState();
    gameEvents.emit('scene-changed', 'game');
    this.setPhase('playing');

    this.drawBackdrop();
    const floor = this.createFloor();
    this.createPlayer(floor);
    this.createRoom(floor);
    this.createCombatSystems();
    this.createCombatUi();
    this.bindInputHandlers();
    this.startRoomEncounter();
  }

  update(time: number) {
    if (this.phase === 'dead' || this.phase === 'ending') {
      return;
    }

    if (
      this.phase === 'room-cleared' &&
      this.player.x > this.currentRoomConfig.exitX + 20
    ) {
      this.advanceToNextRoom();
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
      time >= this.activeWeapon.nextFireAt
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
    this.floorGroup = floor;
    this.buildRoom(this.currentRoomConfig);
  }

  private buildRoom(roomConfig: RoomConfig) {
    this.roomDirector?.destroy();
    this.roomDirector = new RoomDirector(this, this.player, roomConfig, (state) =>
      this.handleRoomStateChanged(state),
    );

    for (const enemy of this.enemies) {
      enemy.destroy();
    }

    const enemyFactory = new EnemyFactory(
      this,
      this.floorGroup,
      roomConfig.intensity,
    );
    const spawned = roomConfig.enemySpawns.map((spawn) =>
      enemyFactory.create(spawn),
    );
    this.replaceEnemies(spawned);
    this.emitEnemyHealth();
    this.updateStageLabel();
  }

  /**
   * Mutates `this.enemies` in place instead of reassigning it: the physics
   * overlaps set up in createCombatSystems() were registered against this
   * exact array reference, so reassigning it here would silently stop
   * player bullets and contact damage from hitting the next room's enemies.
   */
  private replaceEnemies(spawned: Enemy[]) {
    this.enemies.splice(0, this.enemies.length, ...spawned);
  }

  private startRoomEncounter() {
    this.roomDirector.beginEncounter(this.enemies);
  }

  private advanceToNextRoom() {
    if (this.currentRoomIndex + 1 < this.stage.rooms.length) {
      this.currentRoomIndex += 1;
      this.enterCurrentRoom();
      return;
    }

    this.advanceToNextStage();
  }

  private advanceToNextStage() {
    if (this.currentStageIndex + 1 >= STAGES.length) {
      // No stage 3+ yet — the run ends here rather than the run failing to progress.
      this.handleRunCleared();
      return;
    }

    this.currentStageIndex += 1;
    this.currentRoomIndex = 0;
    this.drawBackdrop();
    this.enterCurrentRoom();
  }

  private enterCurrentRoom() {
    this.buildRoom(this.currentRoomConfig);
    this.startRoomEncounter();
    this.setPhase('playing');
    this.player.setPosition(this.currentRoomConfig.entranceX + 90, this.player.y);
  }

  private handleRunCleared() {
    this.setPhase('ending');
    this.enemyRangeGraphics.clear();
    this.stageClearOverlay.setVisible(true);
  }

  private updateStageLabel() {
    if (!this.stageLabelText) {
      return;
    }

    this.stageLabelText.setText(
      `${this.stage.label}  //  ROOM ${this.currentRoomIndex + 1}/${this.stage.rooms.length}`,
    );
  }

  private createCombatSystems() {
    this.playerController = new PlayerController(
      this,
      this.player,
      PLAYER_COMBAT_CONFIG,
    );
    this.weapons = WEAPON_CONFIGS.map((config) => {
      const weapon: WeaponRuntime = {
        config,
        pool: new ProjectilePool(this, {
          texture: config.texture,
          speed: config.projectileSpeed,
          lifetime: config.projectileLifetime,
          maxSize: config.maxPoolSize,
        }),
        nextFireAt: 0,
      };

      this.physics.add.overlap(
        weapon.pool.group,
        this.enemies,
        this.createEnemyHitHandler(weapon),
        undefined,
        this,
      );

      return weapon;
    });
    this.enemyProjectiles = new ProjectilePool(
      this,
      RANGED_ENEMY_COMBAT_CONFIG.projectile,
    );
    this.flyingEnemyProjectiles = new ProjectilePool(
      this,
      FLYING_ENEMY_COMBAT_CONFIG.projectile,
    );
    this.enemyProjectilePools = {
      ranged: this.enemyProjectiles,
      flying: this.flyingEnemyProjectiles,
    };
    this.physics.add.overlap(
      this.enemyProjectiles.group,
      this.player,
      this.createPlayerHitHandler(RANGED_ENEMY_COMBAT_CONFIG.projectile.damage),
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.flyingEnemyProjectiles.group,
      this.player,
      this.createPlayerHitHandler(FLYING_ENEMY_COMBAT_CONFIG.projectile.damage),
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyContact,
      undefined,
      this,
    );
  }

  private createCombatUi() {
    this.aimGraphics = this.add.graphics().setDepth(10);
    this.enemyRangeGraphics = this.add.graphics().setDepth(2);
    this.deathOverlay = this.createOverlay(
      0xe45d68,
      '#ff7180',
      'SYSTEM FAILURE',
      'PRESS R OR ENTER TO RESTART',
    );
    this.stageClearOverlay = this.createOverlay(
      0xb6ffe4,
      '#b6ffe4',
      'STAGE CLEAR',
      'TO BE CONTINUED  //  PRESS R OR ENTER TO REPLAY',
    );

    this.stageLabelText = this.add
      .text(GAME_WIDTH / 2, 96, '', {
        color: '#879197',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.updateStageLabel();

    this.weaponLabelText = this.add
      .text(32, GAME_HEIGHT - 96, '', {
        color: '#b6ffe4',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.updateWeaponLabel();

    this.add
      .text(
        GAME_WIDTH - 32,
        GAME_HEIGHT - 96,
        'A/D  MOVE    SPACE/W  JUMP    SHIFT/RMB  DASH    LMB  FIRE    1/2  WEAPON',
        {
          color: '#879197',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
        },
      )
      .setOrigin(1, 0.5);
  }

  private bindInputHandlers() {
    const switchToSmg = () => this.switchWeapon(0);
    const switchToShotgun = () => this.switchWeapon(1);

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.keyboard?.on('keydown-R', this.handleRestartInput, this);
    this.input.keyboard?.on('keydown-ENTER', this.handleRestartInput, this);
    this.input.keyboard?.on('keydown-ONE', switchToSmg);
    this.input.keyboard?.on('keydown-TWO', switchToShotgun);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.keyboard?.off('keydown-R', this.handleRestartInput, this);
      this.input.keyboard?.off('keydown-ENTER', this.handleRestartInput, this);
      this.input.keyboard?.off('keydown-ONE', switchToSmg);
      this.input.keyboard?.off('keydown-TWO', switchToShotgun);
    });
  }

  private switchWeapon(index: number) {
    if (
      this.phase !== 'playing' ||
      index < 0 ||
      index >= this.weapons.length ||
      index === this.activeWeaponIndex
    ) {
      return;
    }

    this.activeWeaponIndex = index;
    this.updateWeaponLabel();
  }

  private updateWeaponLabel() {
    this.weaponLabelText.setText(`WEAPON // ${this.activeWeapon.config.label}`);
  }

  private resetRunState() {
    this.playerHealth = PLAYER_COMBAT_CONFIG.maxHealth;
    this.activeWeaponIndex = 0;
    this.currentStageIndex = 0;
    this.currentRoomIndex = 0;
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
      this.flyingEnemyProjectiles.clear();
      this.enemyRangeGraphics.clear();
    }
  }

  private handleRestartInput() {
    if (this.phase === 'dead' || this.phase === 'ending') {
      this.scene.restart();
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.phase === 'dead' || this.phase === 'ending') {
      return;
    }

    if (pointer.button === 2) {
      this.playerController.tryDash(this.time.now);
      return;
    }

    if (
      this.phase !== 'playing' ||
      pointer.button !== 0 ||
      this.time.now < this.activeWeapon.nextFireAt
    ) {
      return;
    }

    const aimPoint = pointer.positionToCamera(
      this.cameras.main,
    ) as Phaser.Math.Vector2;
    this.fireBullet(aimPoint, this.time.now);
  }

  private fireBullet(aimPoint: Phaser.Math.Vector2, time: number) {
    const weapon = this.activeWeapon;
    const { config } = weapon;
    const baseAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      aimPoint.x,
      aimPoint.y,
    );

    for (const angle of this.computePelletAngles(
      baseAngle,
      config.pelletCount,
      config.spreadDegrees,
    )) {
      const { x, y } = this.muzzlePosition(
        this.player.x,
        this.player.y,
        angle,
        config.muzzleOffset,
      );
      weapon.pool.fire(x, y, angle, { pierce: config.pierce });
    }

    weapon.nextFireAt = time + config.fireInterval;
  }

  private computePelletAngles(
    baseAngle: number,
    pelletCount: number,
    spreadDegrees: number,
  ) {
    if (pelletCount <= 1) {
      return [baseAngle];
    }

    const spreadRad = Phaser.Math.DegToRad(spreadDegrees);
    const angles: number[] = [];

    for (let i = 0; i < pelletCount; i++) {
      const t = i / (pelletCount - 1) - 0.5;
      angles.push(baseAngle + t * spreadRad);
    }

    return angles;
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
        this.fireEnemyProjectile,
      );

      this.enemyRangeGraphics.lineStyle(
        targetInRange ? 2 : 1,
        targetInRange ? enemy.aggroIndicatorColor : 0x6d7b80,
        targetInRange ? 0.28 : 0.12,
      );
      this.enemyRangeGraphics.strokeCircle(enemy.x, enemy.y, enemy.aggroRadius);
    }
  }

  private fireEnemyProjectile = (
    enemy: Enemy,
    target: Phaser.Physics.Arcade.Sprite,
  ) => {
    if (!enemy.projectile) {
      return;
    }

    const pool = this.enemyProjectilePools[enemy.projectile.kind];
    const angle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      target.x,
      target.y,
    );
    const { x, y } = this.muzzlePosition(
      enemy.x,
      enemy.y,
      angle,
      enemy.projectile.muzzleOffset,
    );
    pool.fire(x, y, angle);
  };

  private muzzlePosition(
    originX: number,
    originY: number,
    angle: number,
    offset: number,
  ) {
    return {
      x: originX + Math.cos(angle) * offset,
      y: originY + Math.sin(angle) * offset,
    };
  }

  private createEnemyHitHandler(
    weapon: WeaponRuntime,
  ): Phaser.Types.Physics.Arcade.ArcadePhysicsCallback {
    return (firstObject, secondObject) => {
      const enemy = this.findEnemy(firstObject, secondObject);
      const bullet =
        firstObject instanceof Enemy
          ? (secondObject as Phaser.Physics.Arcade.Image)
          : (firstObject as Phaser.Physics.Arcade.Image);

      if (!enemy || !bullet.active || !enemy.active) {
        return;
      }

      weapon.pool.registerHit(bullet);
      const defeated = enemy.takeDamage(weapon.config.damage);
      this.emitEnemyHealth();

      enemy.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.time.delayedCall(70, () => {
        if (enemy.active) {
          enemy.clearTint();
        }
      });

      if (defeated) {
        enemy.disableBody(true, true);
        this.roomDirector.notifyEnemyDefeated(enemy);
      }
    };
  }

  private handleEnemyContact: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (firstObject, secondObject) => {
      const enemy = this.findEnemy(firstObject, secondObject);

      if (
        !enemy ||
        this.phase !== 'playing' ||
        this.playerController.isInvulnerable
      ) {
        return;
      }

      const damage = enemy.tryContactAttack(this.time.now);

      if (damage !== null) {
        this.applyPlayerDamage(damage);
      }
    };

  private findEnemy(firstObject: unknown, secondObject: unknown) {
    if (firstObject instanceof Enemy) {
      return firstObject;
    }

    return secondObject instanceof Enemy ? secondObject : null;
  }

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

  private createPlayerHitHandler(
    damage: number,
  ): Phaser.Types.Physics.Arcade.ArcadePhysicsCallback {
    return (firstObject, secondObject) => {
      const bullet =
        firstObject === this.player
          ? (secondObject as Phaser.Physics.Arcade.Image)
          : (firstObject as Phaser.Physics.Arcade.Image);

      if (!bullet.active) {
        return;
      }

      bullet.disableBody(true, true);
      this.applyPlayerDamage(damage);
    };
  }

  private applyPlayerDamage(damage: number) {
    if (this.phase !== 'playing' || this.playerController.isInvulnerable) {
      return;
    }

    this.playerHealth = Math.max(0, this.playerHealth - damage);
    gameEvents.emit(
      'health-changed',
      this.playerHealth,
      PLAYER_COMBAT_CONFIG.maxHealth,
    );

    this.player.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.cameras.main.shake(90, 0.004);
    this.time.delayedCall(80, () => {
      if (this.phase === 'playing') {
        this.player.clearTint();
      }
    });

    if (this.playerHealth === 0) {
      this.handlePlayerDeath();
    }
  }

  private handlePlayerDeath() {
    this.playerController.stop();
    for (const enemy of this.enemies) {
      enemy.setVelocity(0);
    }
    this.setPhase('dead');
    this.player.setVelocity(0).setTint(0xe45d68).setAlpha(0.6);
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    for (const weapon of this.weapons) {
      weapon.pool.clear();
    }
    this.enemyProjectiles.clear();
    this.flyingEnemyProjectiles.clear();
    this.aimGraphics.clear();
    this.enemyRangeGraphics.clear();
    this.deathOverlay.setVisible(true);
    this.cameras.main.shake(180, 0.008);
  }

  private createOverlay(
    strokeColor: number,
    titleColor: string,
    titleText: string,
    promptText: string,
  ) {
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 470, 150, 0x070a0b, 0.92)
      .setStrokeStyle(2, strokeColor);
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 28, titleText, {
        color: titleColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 34, promptText, {
        color: '#e8ece9',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
      })
      .setOrigin(0.5);

    return this.add
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

  private drawBackdrop() {
    const { palette } = this.stage;

    this.backdropGraphics ??= this.add.graphics();
    const graphics = this.backdropGraphics.clear();

    graphics.fillGradientStyle(
      palette.backgroundTop,
      palette.backgroundTop,
      palette.backgroundBottom,
      palette.backgroundBottom,
    );
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.lineStyle(1, palette.gridLine, 0.55);
    for (let x = 64; x < GAME_WIDTH; x += 64) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT - 64);
    }
    for (let y = 80; y < GAME_HEIGHT - 64; y += 64) {
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }

    graphics.fillStyle(palette.accentPrimary, 0.8);
    graphics.fillRect(0, 110, GAME_WIDTH, 3);

    this.neonAccent?.destroy();
    this.neonAccent = this.add
      .rectangle(0, 116, GAME_WIDTH * 0.36, 1, palette.accentSecondary, 0.7)
      .setOrigin(0, 0.5);

    this.neonFlickerTimer?.remove();
    this.neonFlickerTimer = palette.neonFlicker
      ? this.time.addEvent({
          delay: 90,
          loop: true,
          callback: () => {
            this.neonAccent?.setAlpha(Math.random() < 0.15 ? 0.15 : 0.7);
          },
        })
      : undefined;
  }
}
