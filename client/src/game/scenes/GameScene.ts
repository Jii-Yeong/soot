import Phaser from 'phaser';
import {
  FLYING_ENEMY_COMBAT_CONFIG,
  MELEE_ENEMY_COMBAT_CONFIG,
  PLAYER_COMBAT_CONFIG,
  RANGED_ENEMY_COMBAT_CONFIG,
} from '@/game/config/combatConfig';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import {
  PLAYER_ANIMATIONS,
  PLAYER_ATLAS_KEY,
  PLAYER_INITIAL_FRAME,
} from '@/game/config/playerAnimationConfig';
import {
  MovementMode,
  PLAYER_FLIGHT_BOUNDS,
} from '@/game/config/playerMovementConfig';
import type { RoomConfig } from '@/game/config/roomConfig';
import {
  placeRoomInStage,
  stageWorldWidth,
} from '@/game/config/roomPlacement';
import {
  STARTING_STAGE_INDEX,
  STAGES,
  type StageEndEvent,
} from '@/game/config/stageConfig';
import { getStageExitPlan } from '@/game/config/stageProgression';
import { PLAYER_STACK_DEPTH } from '@/game/config/renderDepth';
import { ROOM_CAMERA_FOLLOW_LERP_X } from '@/game/config/worldConfig';
import {
  STARTING_WEAPON_ID,
  WEAPON_CONFIGS,
  type WeaponConfig,
} from '@/game/config/weaponConfig';
import { PlayerController } from '@/game/controllers/PlayerController';
import { BossEnemy } from '@/game/entities/BossEnemy';
import { Enemy, type EnemyProjectileKind } from '@/game/entities/Enemy';
import { gameEvents } from '@/game/events/gameEvents';
import {
  canPlayerFireInPhase,
  canPlayerFireInRoom,
  type GamePhase,
} from '@/game/state/gamePhase';
import { PlayerHealthState } from '@/game/state/playerHealthState';
import type { RoomState } from '@/game/state/roomState';
import { BackdropDirector } from '@/game/systems/BackdropDirector';
import { EnemyFactory } from '@/game/systems/EnemyFactory';
import {
  FLOOR_SURFACE_Y,
  FLOOR_TILE,
  FloorBuilder,
} from '@/game/systems/FloorBuilder';
import { patrolSpan } from '@/game/systems/patrolSpan';
import { ProjectilePool } from '@/game/systems/ProjectilePool';
import { RoomDirector } from '@/game/systems/RoomDirector';
import { StageEndEventDirector } from '@/game/systems/StageEndEventDirector';
import {
  isProjectileBlocker,
  TerrainBuilder,
} from '@/game/systems/TerrainBuilder';
import { WeaponDropDirector } from '@/game/systems/WeaponDropDirector';
import { WeaponSystem } from '@/game/systems/WeaponSystem';
import { useGameSettingsStore } from '@/stores/gameSettingsStore';

const PLAYER_DAMAGE_FLASH_DURATION = 80;

/** How far the feet must sink past the floor surface to count as a pit fall. */
const PIT_FALL_TRIGGER_DEPTH = 22;
const PIT_FALL_DAMAGE = 12;
/** Height above the floor the player is placed at after climbing out of a pit. */
const PIT_RESPAWN_LIFT = 60;
const GROUND_ROOM_EXIT_OFFSET = 20;
const FLIGHT_ROOM_EXIT_OFFSET = 0;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private stageWorldWidth = 0;
  private enemies: Enemy[] = [];
  private floorBuilder!: FloorBuilder;
  private terrainBuilder!: TerrainBuilder;
  private currentStageIndex = STARTING_STAGE_INDEX;
  private requestedStartingStageIndex?: number;
  private currentRoomIndex = 0;
  private activeRoomConfig!: RoomConfig;
  private roomDirector!: RoomDirector;
  private playerController!: PlayerController;
  private weaponDropDirector!: WeaponDropDirector;
  private weaponSystem!: WeaponSystem;
  private stageEndEventDirector!: StageEndEventDirector;
  private equipKey!: Phaser.Input.Keyboard.Key;
  private enemyProjectiles!: ProjectilePool;
  private flyingEnemyProjectiles!: ProjectilePool;
  private enemyProjectilePools!: Record<EnemyProjectileKind, ProjectilePool>;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private enemyRangeGraphics!: Phaser.GameObjects.Graphics;
  private backdropDirector!: BackdropDirector;
  private deathOverlay!: Phaser.GameObjects.Container;
  private victoryOverlay!: Phaser.GameObjects.Container;
  private stageEndOverlay!: Phaser.GameObjects.Container;
  private weaponLabelText!: Phaser.GameObjects.Text;
  private weaponEquippedText!: Phaser.GameObjects.Text;
  private stageLabelText!: Phaser.GameObjects.Text;
  private controlHintText?: Phaser.GameObjects.Text;
  private playerDamageFlashTimer?: Phaser.Time.TimerEvent;
  private readonly playerHealth = new PlayerHealthState(
    (currentHealth, maxHealth) =>
      gameEvents.emit('health-changed', currentHealth, maxHealth),
  );
  private phase: GamePhase = 'boot';
  private roomState: RoomState = 'idle';
  /** Enemies past the floor line, dropping out of the level. */
  private readonly fallingEnemies = new Set<Enemy>();
  private paused = false;

  constructor() {
    super('game');
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
    gameEvents.emit('stage-changed', this.stage.id);
    this.setPhase('playing');

    this.configureHorizontalWorld();
    this.backdropDirector = new BackdropDirector(this);
    this.showStageBackdrop();
    this.floorBuilder = new FloorBuilder(this);
    this.rebuildFloorForStage();
    this.createPlayer();
    this.terrainBuilder = new TerrainBuilder(this);
    this.physics.add.collider(this.player, this.terrainBuilder.group);
    this.configureCamera();
    this.createRoom();
    this.createCombatSystems();
    this.stageEndEventDirector = new StageEndEventDirector(this);
    this.createCombatUi();
    this.bindInputHandlers();
  }

  update(time: number) {
    if (
      this.phase === 'dead' ||
      this.phase === 'ending' ||
      this.phase === 'transitioning'
    ) {
      return;
    }

    this.handlePitFall();
    this.handleEnemyPitFalls();

    if (
      this.phase === 'room-cleared' &&
      this.player.x >
        this.activeRoomConfig.exitX +
          (this.playerController.isFlightMode
            ? FLIGHT_ROOM_EXIT_OFFSET
            : GROUND_ROOM_EXIT_OFFSET)
    ) {
      this.advanceToNextRoom();
    }

    this.playerController.update(time);
    this.weaponDropDirector.update(
      this.player,
      this.weaponSystem.activeConfig,
    );

  }

  /**
   * Everything that has to be placed where the player actually is this frame:
   * the weapon, both arms, the aim guide, and the shot that leaves the muzzle.
   *
   * Deliberately not in `update`. Arcade physics steps the bodies on the
   * scene's UPDATE event and only writes the result back to the sprites on
   * POST_UPDATE, which is after `update` has run — so anything reading
   * `player.x` there gets last frame's position while the body renders at this
   * frame's. The gap is one frame of travel: a few pixels while running, and
   * 9.3px vertically off a 560px/s jump, reversing sign at the apex. The arms
   * sagged to the waist on the way up and rode over the face on the way down,
   * which is the "the arm moves at a different speed than the body" this fixes.
   *
   * No anchor could have corrected it. The rig was placing the arm correctly
   * against a position the body had already left.
   */
  private updateAiming(time: number, delta: number) {
    if (
      this.phase === 'dead' ||
      this.phase === 'ending' ||
      this.phase === 'transitioning'
    ) {
      return;
    }

    const pointer = this.input.activePointer;
    const aimPoint = pointer.positionToCamera(
      this.cameras.main,
    ) as Phaser.Math.Vector2;
    this.weaponSystem.update(delta, aimPoint);
    this.drawAimGuide(aimPoint);

    if (
      canPlayerFireInPhase(this.phase) &&
      pointer.leftButtonDown()
    ) {
      this.weaponSystem.tryFire(aimPoint, time);
    }
    if (this.phase === 'playing' && this.roomState === 'locked') {
      this.updateEnemyCombat(time);
    }
  }

  private rebuildFloorForStage() {
    this.floorBuilder.build(this.stage.rooms, Boolean(this.stage.background));
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(
      180,
      GAME_HEIGHT - 120,
      PLAYER_ATLAS_KEY,
      PLAYER_INITIAL_FRAME,
    );
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(36, 76, true);
    this.player.play(PLAYER_ANIMATIONS.idle);
    this.player.setCollideWorldBounds(true);
    // Enemies default to the same depth (0) and are added to the display
    // list after the player, so without this they render on top of the
    // player whenever a melee enemy closes to contact range.
    this.player.setDepth(PLAYER_STACK_DEPTH.body);
    this.physics.add.collider(this.player, this.floorBuilder.group);
  }

  private configureHorizontalWorld() {
    this.stageWorldWidth = stageWorldWidth(this.stage.rooms);
    this.physics.world.setBounds(0, 0, this.stageWorldWidth, GAME_HEIGHT);
    this.cameras.main
      .setBounds(0, 0, this.stageWorldWidth, GAME_HEIGHT)
      .setRoundPixels(true);
  }

  private configureCamera() {
    this.cameras.main.startFollow(
      this.player,
      true,
      ROOM_CAMERA_FOLLOW_LERP_X,
      1,
    );
  }

  private resetCameraToRoomEntrance() {
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    this.configureCamera();
  }

  private createRoom() {
    this.buildRoom(
      placeRoomInStage(this.stage.rooms, this.currentRoomIndex),
    );
  }

  private buildRoom(roomConfig: RoomConfig) {
    this.weaponDropDirector?.clear();
    this.weaponSystem?.clearProjectiles();
    this.roomDirector?.destroy();
    gameEvents.emit('boss-phase-changed', null);
    this.activeRoomConfig = roomConfig;
    this.roomDirector = new RoomDirector({
      scene: this,
      player: this.player,
      config: roomConfig,
      onStateChanged: (state) => this.handleRoomStateChanged(state),
    });

    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.replaceEnemies([]);
    this.roomState = 'idle';
    gameEvents.emit('room-state-changed', this.roomState);
    this.emitEnemyHealth();

    this.terrainBuilder.build(roomConfig.terrain);

    // Every room starts as a live encounter. Enemies are present as the room
    // opens, so entering a stage never has an invisible combat trigger.
    if (roomConfig.kind === 'combat') {
      this.spawnRoomEnemies();
    }
    this.startRoomEncounter();
  }

  private spawnRoomEnemies() {
    const enemyFactory = new EnemyFactory(
      this,
      this.floorBuilder.group,
      this.terrainBuilder.group,
      this.activeRoomConfig.intensity,
      (damage) => this.applyPlayerDamage(damage),
      (bossX, bossHalfWidth) =>
        this.playerController.applyGrab(bossX, bossHalfWidth),
      (bossX, pullSpeed) =>
        this.playerController.applyVacuum(bossX, pullSpeed),
      {
        left: this.activeRoomConfig.entranceX,
        right: this.activeRoomConfig.exitX,
      },
      (phase) => gameEvents.emit('boss-phase-changed', phase),
      (spawnX) =>
        patrolSpan({
          spawnX,
          range: MELEE_ENEMY_COMBAT_CONFIG.patrolRange,
          left: this.activeRoomConfig.entranceX,
          right: this.activeRoomConfig.exitX,
          pits: this.activeRoomConfig.pits,
          edgeMargin: MELEE_ENEMY_COMBAT_CONFIG.patrolEdgeMargin,
          minimumSpan: MELEE_ENEMY_COMBAT_CONFIG.patrolMinimumSpan,
        }),
    );
    const spawned = this.activeRoomConfig.enemySpawns.map((spawn) =>
      enemyFactory.create(spawn),
    );
    this.replaceEnemies(spawned);
  }

  /**
   * Mutates `this.enemies` in place instead of reassigning it: the physics
   * overlaps set up in createCombatSystems() were registered against this
   * exact array reference, so reassigning it here would silently stop
   * player bullets and contact damage from hitting the next room's enemies.
   */
  private replaceEnemies(spawned: Enemy[]) {
    this.fallingEnemies.clear();
    this.enemies.splice(0, this.enemies.length, ...spawned);
  }

  private startRoomEncounter() {
    // Combat rooms are populated by buildRoom; a boss room is still empty here.
    if (this.enemies.length === 0) {
      this.spawnRoomEnemies();
    }

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
    const plan = getStageExitPlan(STAGES, this.currentStageIndex);

    if (plan.event) {
      this.playStageEndEvent(plan.event, plan.nextStageIndex);
      return;
    }

    this.completeStageExit(plan.nextStageIndex);
  }

  private completeStageExit(nextStageIndex: number | null) {
    if (nextStageIndex === null) {
      this.handleRunCleared();
      return;
    }

    this.currentStageIndex = nextStageIndex;
    this.currentRoomIndex = 0;
    gameEvents.emit('stage-changed', this.stage.id);
    this.configureHorizontalWorld();
    this.restorePlayerHealthForStage();
    this.showStageBackdrop();
    this.rebuildFloorForStage();
    this.enterCurrentRoom(true);
  }

  private enterCurrentRoom(resetToStageEntrance = false) {
    if (resetToStageEntrance) {
      this.player.setPosition(
        this.currentRoomConfig.entranceX + 90,
        this.stageEntranceY(),
      );
      this.player.setVelocity(0);
      this.resetCameraToRoomEntrance();
      this.applyStageMovementMode();
    }

    this.buildRoom(
      placeRoomInStage(this.stage.rooms, this.currentRoomIndex),
    );
    this.updateStageLabel();
    this.setPhase('playing');
  }

  private handleRunCleared() {
    this.setPhase('ending');
    this.weaponSystem.hide();
    this.enemyRangeGraphics.clear();
    // Beating the final stage ("The Return") is the true victory — wash the
    // screen to warm light (waking up) before the ending card resolves.
    this.cameras.main.flash(700, 255, 240, 210);
    this.victoryOverlay.setVisible(true);
  }

  private playStageEndEvent(
    event: StageEndEvent,
    nextStageIndex: number | null,
  ) {
    this.setPhase('transitioning');
    this.weaponSystem.cancelHitStop();
    this.playerController.stop();
    this.player.setVelocity(0);
    this.weaponSystem.hide();
    this.weaponDropDirector.clear();
    this.aimGraphics.clear();
    this.enemyRangeGraphics.clear();
    this.stageEndEventDirector.play(event, () => {
      if (nextStageIndex === null) {
        this.setPhase('ending');
        this.stageEndOverlay.setVisible(true);
        return;
      }

      this.completeStageExit(nextStageIndex);
    });
  }

  private updateStageLabel() {
    this.stageLabelText.setText(
      `${this.stage.label}  //  ROOM ${this.currentRoomIndex + 1}/${
        this.stage.rooms.length
      }`,
    );
  }

  private showStageBackdrop() {
    this.backdropDirector.show(
      this.stage,
      this.stageWorldWidth,
      STAGES[this.currentStageIndex + 1],
    );
  }

  private createCombatSystems() {
    this.playerController = new PlayerController(
      this,
      this.player,
      PLAYER_COMBAT_CONFIG,
    );
    this.applyStageMovementMode();
    this.weaponSystem = new WeaponSystem(
      this,
      this.player,
      this.enemies,
      WEAPON_CONFIGS,
      STARTING_WEAPON_ID,
      () => canPlayerFireInPhase(this.phase),
      (enemy, defeated) => this.handleEnemyHit(enemy, defeated),
      () => canPlayerFireInRoom(this.phase, this.roomState),
    );
    this.weaponSystem.blockProjectilesWith(
      this.terrainBuilder.projectileGroup,
      isProjectileBlocker,
    );
    this.weaponDropDirector = new WeaponDropDirector(
      this,
      this.floorBuilder.group,
      WEAPON_CONFIGS,
      (weapon) => gameEvents.emit('nearby-weapon-changed', weapon?.id ?? null),
    );
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
    this.enemyProjectiles.collideWith(
      this.terrainBuilder.projectileGroup,
      isProjectileBlocker,
    );
    this.flyingEnemyProjectiles.collideWith(
      this.terrainBuilder.projectileGroup,
      isProjectileBlocker,
    );
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
    this.victoryOverlay = this.createOverlay(
      0xffe1a8,
      '#ffe9c4',
      'RETURN COMPLETE',
      "YOU'RE AWAKE  //  PRESS R OR ENTER TO REPLAY",
    );
    this.stageEndOverlay = this.createOverlay(
      0xe45d68,
      '#ff7180',
      'SURROUNDED',
      'SIGNAL LOST  //  PRESS R OR ENTER TO REPLAY',
    );

    this.stageLabelText = this.add
      .text(GAME_WIDTH / 2, 96, '', {
        color: '#d8dfdc',
        backgroundColor: '#070a0bbd',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setScrollFactor(0);
    this.updateStageLabel();

    this.weaponLabelText = this.add
      .text(32, GAME_HEIGHT - 96, '', {
        color: '#d8ffec',
        backgroundColor: '#070a0bd9',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setScrollFactor(0);
    this.updateWeaponLabel();

    this.weaponEquippedText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 128, '', {
        color: '#ffffff',
        backgroundColor: '#070a0be8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setScrollFactor(0)
      .setVisible(false);

    this.controlHintText = this.add
      .text(
        GAME_WIDTH - 32,
        GAME_HEIGHT - 96,
        '',
        {
          color: '#d8dfdc',
          backgroundColor: '#070a0bd9',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          padding: { x: 10, y: 6 },
        },
      )
      .setOrigin(1, 0.5)
      .setDepth(20)
      .setScrollFactor(0);
    this.updateControlHint();
  }

  private bindInputHandlers() {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required for weapon pickup');
    }

    this.equipKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.equipKey.on('down', this.tryEquipNearbyWeapon, this);
    this.input.on('pointerdown', this.handlePointerDown, this);
    keyboard.on('keydown-R', this.handleRestartInput, this);
    keyboard.on('keydown-ENTER', this.handleRestartInput, this);
    gameEvents.on('admin-stage-requested', this.handleAdminStageRequested);
    gameEvents.on('admin-weapon-requested', this.handleAdminWeaponRequested);
    gameEvents.on('pause-toggle-requested', this.handlePauseToggleRequested);

    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.updateAiming, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // This one is `on`, and the scene restarts onto the same emitter, so it
      // has to come off or every restart adds another rig update.
      this.events.off(
        Phaser.Scenes.Events.POST_UPDATE,
        this.updateAiming,
        this,
      );
      this.input.off('pointerdown', this.handlePointerDown, this);
      keyboard.off('keydown-R', this.handleRestartInput, this);
      keyboard.off('keydown-ENTER', this.handleRestartInput, this);
      this.equipKey.off('down', this.tryEquipNearbyWeapon, this);
      gameEvents.off('admin-stage-requested', this.handleAdminStageRequested);
      gameEvents.off('admin-weapon-requested', this.handleAdminWeaponRequested);
      gameEvents.off('pause-toggle-requested', this.handlePauseToggleRequested);
      // A scene that shuts down while paused would leave the overlay up over
      // whatever replaces it.
      this.setPaused(false);
    });
  }

  private tryEquipNearbyWeapon() {
    if (this.phase !== 'playing' && this.phase !== 'room-cleared') {
      return;
    }

    const weapon = this.weaponDropDirector.takeNearest(
      this.player,
      this.weaponSystem.activeConfig,
    );
    if (!weapon || !this.weaponSystem.equip(weapon.id)) {
      return;
    }

    this.updateWeaponLabel();
    this.showWeaponEquipped(weapon);
  }

  private updateWeaponLabel() {
    const weapon = this.weaponSystem.activeConfig;
    this.weaponLabelText.setText(`WEAPON // ${weapon.label}`);
    gameEvents.emit('weapon-changed', weapon.id, weapon.label);
  }

  private showWeaponEquipped(weapon: WeaponConfig) {
    this.tweens.killTweensOf(this.weaponEquippedText);
    this.weaponEquippedText
      .setText(`EQUIPPED // ${weapon.label}`)
      .setColor(`#${weapon.pickupColor.toString(16).padStart(6, '0')}`)
      .setAlpha(1)
      .setVisible(true);
    this.tweens.add({
      targets: this.weaponEquippedText,
      alpha: 0,
      delay: 850,
      duration: 260,
      onComplete: () => this.weaponEquippedText.setVisible(false),
    });
    this.weaponSystem.playEquipFeedback();
  }

  private resetRunState() {
    // A scene restart — which is how the admin stage jump works — reuses this
    // instance, so every field still points at the previous run's game objects
    // and those are already destroyed. The control hint is the one create()
    // writes to before createCombatUi() has rebuilt it: applyStageMovementMode
    // runs inside createCombatSystems, and setText on a destroyed Text reaches
    // for a canvas that is gone.
    this.controlHintText = undefined;
    // Phaser reuses the Scene instance on restart, but destroys the previous
    // physics groups. buildRoom runs before createCombatSystems replaces these
    // fields, so leave no stale pools or directors for its optional cleanup.
    this.weaponDropDirector = undefined!;
    this.weaponSystem = undefined!;
    this.roomDirector = undefined!;
    this.currentStageIndex =
      this.requestedStartingStageIndex ?? STARTING_STAGE_INDEX;
    this.requestedStartingStageIndex = undefined;
    this.currentRoomIndex = 0;
    this.restorePlayerHealthForStage();
    this.roomState = 'idle';
    gameEvents.emit('room-state-changed', this.roomState);
  }

  private restorePlayerHealthForStage() {
    this.playerHealth.restore(this.stage.playerMaxHealth);
  }

  /**
   * The height a stage starts the player at.
   *
   * Entering a stage used to keep whatever height the last one ended on, which
   * costs nothing on the ground — gravity puts them on the floor either way.
   * Stage 5 is flown, and the player arrives from stage 4's boss room standing
   * on the floor at y≈618, past the bottom of the flight band. The clamp then
   * pins them to its floor edge instead of the stage entrance.
   */
  private stageEntranceY() {
    return this.stage.movementMode === MovementMode.FLIGHT
      ? (PLAYER_FLIGHT_BOUNDS.minY + PLAYER_FLIGHT_BOUNDS.maxY) / 2
      : GAME_HEIGHT - 120;
  }

  private applyStageMovementMode() {
    this.playerController.setMovementMode(this.stage.movementMode);
    this.updateControlHint();
  }

  private updateControlHint() {
    this.controlHintText?.setText(
      this.playerController.isFlightMode
        ? 'W/SPACE  UP    S  DOWN    A/D  MOVE    SHIFT/RMB  DASH    LMB  FIRE'
        : 'A/D  MOVE    SPACE/W  JUMP    SHIFT/RMB  DASH    LMB  FIRE    E  EQUIP',
    );
  }

  private setPhase(phase: GamePhase) {
    this.phase = phase;
    gameEvents.emit('phase-changed', phase);
  }

  private handleRoomStateChanged(state: RoomState) {
    this.roomState = state;
    gameEvents.emit('room-state-changed', state);

    if (state === 'locked') {
      // Clear shots from the previous room before this encounter begins.
      this.weaponSystem?.clearProjectiles();
      this.emitEnemyHealth();
      return;
    }

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

  private handleAdminStageRequested = (stageIndex: number) => {
    if (!Number.isInteger(stageIndex) || !STAGES[stageIndex]) {
      return;
    }

    this.requestedStartingStageIndex = stageIndex;
    this.setPaused(false);
    this.scene.restart();
  };

  /**
   * Death and the ending already hold the screen with their own prompts, and
   * boot has nothing to pause, so those three are left alone.
   */
  private canPause() {
    return (
      this.phase !== 'boot' && this.phase !== 'dead' && this.phase !== 'ending'
    );
  }

  private handlePauseToggleRequested = () => {
    if (this.paused) {
      this.setPaused(false);
      return;
    }

    if (this.canPause()) {
      this.setPaused(true);
    }
  };

  private setPaused(paused: boolean) {
    if (this.paused === paused) {
      return;
    }

    this.paused = paused;
    // Pausing the scene stops its update loop, timers and physics in one call,
    // which is what keeps a hit-stop or a burst timer from firing behind the
    // overlay and resolving the moment the player looks away.
    if (paused) {
      this.scene.pause();
    } else {
      this.scene.resume();
    }
    gameEvents.emit('pause-changed', paused);
  }

  /**
   * Hands the player a weapon without one having to drop. Every weapon is
   * already instantiated at scene start, so this is the same path `E` takes —
   * it just skips the pickup. Restarting the stage to test the rail rifle was
   * the alternative, and the drop tables do not guarantee it appears at all.
   */
  private handleAdminWeaponRequested = (weaponId: string) => {
    if (!this.weaponSystem.equip(weaponId)) {
      return;
    }

    this.updateWeaponLabel();

    // The equip flourish is a camera flash and two tweens, and neither advances
    // while the scene is paused — asked for from the pause menu they would sit
    // frozen over the overlay until the player resumed. The swap itself still
    // happens, which is the whole point of the button.
    if (!this.paused) {
      this.showWeaponEquipped(this.weaponSystem.activeConfig);
    }
  };

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (
      this.phase === 'dead' ||
      this.phase === 'ending' ||
      this.phase === 'transitioning'
    ) {
      return;
    }

    if (pointer.button === 2) {
      this.playerController.tryDash(this.time.now);
      return;
    }

    if (
      !canPlayerFireInPhase(this.phase) ||
      pointer.button !== 0
    ) {
      return;
    }

    const aimPoint = pointer.positionToCamera(
      this.cameras.main,
    ) as Phaser.Math.Vector2;
    this.weaponSystem.tryFire(aimPoint, this.time.now);
  }

  private updateEnemyCombat(time: number) {
    this.enemyRangeGraphics.clear();

    for (const enemy of this.enemies) {
      // On its way out of the level: it should not still be shooting.
      if (!enemy.active || this.fallingEnemies.has(enemy)) {
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
    pool.fire(x, y, angle, { owner: enemy });
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

  private handleEnemyHit(enemy: Enemy, defeated: boolean) {
    // Damage applies only while this room's encounter is active.
    if (this.phase !== 'playing' || this.roomState !== 'locked') {
      return;
    }

    this.emitEnemyHealth();
    gameEvents.emit('enemy-damaged', enemy.x, enemy.y);

    if (!defeated) {
      return;
    }

    this.defeatEnemy(enemy);
  }

  private defeatEnemy(enemy: Enemy) {
    gameEvents.emit('enemy-defeated', enemy.x, enemy.y);
    if (enemy instanceof BossEnemy) {
      this.weaponDropDirector.dropBossReward(
        enemy.x,
        enemy.y,
        this.weaponSystem.activeConfig.id,
      );
    } else {
      this.spawnDeathPop(enemy);
      // Rounds already in the air outlive the shooter otherwise, and a hit that
      // lands after the enemy is gone reads as the game taking a free swing.
      // Bosses keep theirs: their patterns are the fight, and clearing the
      // screen on the last hit would erase the beat the fight ends on.
      if (enemy.projectile) {
        this.enemyProjectilePools[enemy.projectile.kind].clearFrom(enemy);
      }
    }
    enemy.defeat();
    this.roomDirector.notifyEnemyDefeated(enemy);
  }

  /**
   * Enemies walk off the ledges the player jumps, and the world bounds caught
   * them at the bottom of the screen: out of the fight, out of reach, and still
   * counted, so the room could never lock open again. The player's own fall is
   * a hazard they climb out of (handlePitFall); an enemy has no way back up.
   *
   * It falls out of frame rather than dying where it lands. Killing it on the
   * world floor put a death burst along the bottom edge of the screen, which
   * reads as an explosion at ground level and not as something dropping out of
   * the level. So at the floor line it stops being part of the fight — the room
   * lets go of it, its rounds go with it, and nothing solid is left to catch
   * it — and it is only taken off the display once it is fully out of view.
   */
  private handleEnemyPitFalls() {
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy instanceof BossEnemy) {
        continue;
      }

      const body = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (!body) {
        continue;
      }

      if (this.fallingEnemies.has(enemy)) {
        if (body.top > GAME_HEIGHT) {
          this.fallingEnemies.delete(enemy);
          enemy.defeat();
        }
        continue;
      }

      // Measured at the top edge, so the whole body has to be under the floor:
      // an enemy standing at a pit's edge is never mistaken for one in it.
      if (body.top <= FLOOR_SURFACE_Y) {
        continue;
      }

      this.fallingEnemies.add(enemy);
      body.setCollideWorldBounds(false);
      body.checkCollision.none = true;
      if (enemy.projectile) {
        this.enemyProjectilePools[enemy.projectile.kind].clearFrom(enemy);
      }
      this.roomDirector.notifyEnemyDefeated(enemy);
    }
  }

  /** A fading, expanding ghost of the enemy so a kill has a beat of weight. */
  private spawnDeathPop(enemy: Enemy) {
    const pop = this.add
      .image(enemy.x, enemy.y, enemy.texture.key, enemy.frame.name)
      .setFlipX(enemy.flipX)
      .setScale(enemy.scaleX, enemy.scaleY)
      .setDepth(enemy.depth)
      .setTint(0xffffff)
      .setTintMode(Phaser.TintModes.FILL);
    this.tweens.add({
      targets: pop,
      scaleX: enemy.scaleX * 1.6,
      scaleY: enemy.scaleY * 1.6,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => pop.destroy(),
    });
  }

  private handleEnemyContact: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (firstObject, secondObject) => {
      const enemy = this.findEnemy(firstObject, secondObject);

      if (
        !enemy ||
        this.phase !== 'playing' ||
        this.roomState !== 'locked' ||
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

  /**
   * When the player's feet sink past the floor surface they have dropped into a
   * pit (the floor collider stops them everywhere else). Lift them out onto the
   * far ledge and dock health — the pit is a hazard, not a dead end.
   */
  private handlePitFall() {
    if (this.playerController.isFlightMode) {
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.bottom <= FLOOR_SURFACE_Y + PIT_FALL_TRIGGER_DEPTH) {
      return;
    }

    const pit = this.floorBuilder.findPitAt(this.player.x, FLOOR_TILE);
    const targetX = pit ? pit.end + FLOOR_TILE / 2 : this.player.x;
    this.player.setPosition(targetX, FLOOR_SURFACE_Y - PIT_RESPAWN_LIFT);
    body.setVelocity(0, 0);

    this.applyPlayerDamage(PIT_FALL_DAMAGE);
  }

  private applyPlayerDamage(damage: number) {
    if (
      this.phase !== 'playing' ||
      this.playerController.isInvulnerable ||
      useGameSettingsStore.getState().invincible
    ) {
      return;
    }

    const playerDefeated = this.playerHealth.takeDamage(damage);
    gameEvents.emit('player-damaged', this.player.x, this.player.y);

    this.flashPlayerDamage();
    this.cameras.main.shake(90, 0.004);

    if (playerDefeated) {
      this.handlePlayerDeath();
    }
  }

  private flashPlayerDamage() {
    this.playerDamageFlashTimer?.remove(false);
    this.player.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.playerDamageFlashTimer = this.time.delayedCall(
      PLAYER_DAMAGE_FLASH_DURATION,
      () => {
        this.playerDamageFlashTimer = undefined;
        if (this.phase !== 'dead') {
          this.player.clearTint();
        }
      },
    );
  }

  private cancelPlayerDamageFlash() {
    if (this.playerDamageFlashTimer) {
      this.playerDamageFlashTimer.remove(false);
      this.playerDamageFlashTimer = undefined;
    }
  }

  private handlePlayerDeath() {
    this.cancelPlayerDamageFlash();
    this.weaponSystem.cancelHitStop();
    this.playerController.stop();
    for (const enemy of this.enemies) {
      enemy.setVelocity(0);
    }
    this.setPhase('dead');
    this.player.setVelocity(0).setTint(0xe45d68).setAlpha(0.6);
    this.weaponSystem.hide();
    this.weaponDropDirector.clear();
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.weaponSystem.clearProjectiles();
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
      .setScrollFactor(0)
      .setVisible(false);
  }

  private drawAimGuide(aimPoint: Phaser.Math.Vector2) {
    // Only the crosshair. The 58px stub that used to run from the player is
    // redundant now that the weapon sprite points where the shot goes, and it
    // drew straight over the barrel.
    this.aimGraphics.clear();
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
}
