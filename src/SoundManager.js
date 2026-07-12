import Phaser from 'phaser';

const CHOP_COUNT = 11;
const GRASS_COUNT = 37;
const LEAVES_COUNT = 13;

export function preloadSounds(scene) {
  for (let i = 1; i <= CHOP_COUNT; i++) {
    const n = String(i).padStart(2, '0');
    scene.load.audio(`sfx-chop-${i}`, `assets/survival-sounds/chop/chop_${n}.ogg`);
  }
  for (let i = 1; i <= GRASS_COUNT; i++) {
    const n = String(i).padStart(2, '0');
    scene.load.audio(`sfx-grass-${i}`, `assets/survival-sounds/footsteps_grass/grass_${n}.ogg`);
  }
  for (let i = 1; i <= LEAVES_COUNT; i++) {
    const n = String(i).padStart(2, '0');
    scene.load.audio(`sfx-leaves-${i}`, `assets/survival-sounds/footsteps_leaves/leaves_${n}.ogg`);
  }

  scene.load.audio('sfx-arrow-shoot', 'assets/survival-sounds/arrows/arrowshoot.ogg');
  scene.load.audio('sfx-arrow-hit', 'assets/survival-sounds/arrows/arrowhit.ogg');
  scene.load.audio('sfx-arrow-hit-near', 'assets/survival-sounds/arrows/arrowhitnear.ogg');
  scene.load.audio('sfx-arrow-hit-far', 'assets/survival-sounds/arrows/arrowhitfar.ogg');
}

function playRandom(scene, prefix, count, volume) {
  const i = Phaser.Math.Between(1, count);
  scene.sound.play(`${prefix}-${i}`, { volume });
}

export function playChopSound(scene) {
  playRandom(scene, 'sfx-chop', CHOP_COUNT, 0.5);
}

export function playFootstepSound(scene, surface) {
  if (surface === 'leaves') {
    playRandom(scene, 'sfx-leaves', LEAVES_COUNT, 0.3);
  } else {
    playRandom(scene, 'sfx-grass', GRASS_COUNT, 0.3);
  }
}

export function playArrowShootSound(scene) {
  scene.sound.play('sfx-arrow-shoot', { volume: 0.4 });
}

export function playArrowHitSound(scene, distanceFromPlayer) {
  if (distanceFromPlayer < 120) {
    scene.sound.play('sfx-arrow-hit-near', { volume: 0.5 });
  } else if (distanceFromPlayer > 500) {
    scene.sound.play('sfx-arrow-hit-far', { volume: 0.35 });
  } else {
    scene.sound.play('sfx-arrow-hit', { volume: 0.45 });
  }
}
