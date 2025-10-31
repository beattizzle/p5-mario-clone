// Player object
let player;
// Camera
let gameCamera;
// Terrain
let terrain;
// Level objects
let levelObjects = [];
// Enemies
let enemies = [];
let enemySpawnPositions = []; // Store spawn positions for night respawns
// Keys pressed
let keys = {};

// Audio context for sound effects
let audioContext;

// Sound effects system
class SoundFX {
  constructor() {
    // Initialize audio context on first user interaction
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playSwordSwing() {
    const ctx = audioContext;
    const now = ctx.currentTime;

    // Create whoosh sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Descending whoosh
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    // Swoosh envelope
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.type = "sawtooth";
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  playSwordHit() {
    const ctx = audioContext;
    const now = ctx.currentTime;

    // Create metallic clang sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sharp metallic frequency
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);

    // Quick attack and decay
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.type = "square";
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  playLanding() {
    const ctx = audioContext;
    const now = ctx.currentTime;

    // Create thud sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Low frequency thud
    oscillator.frequency.setValueAtTime(100, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    // Quick thud envelope
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    oscillator.type = "sine";
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }

  playEnemyDeath() {
    const ctx = audioContext;
    const now = ctx.currentTime;

    // Create descending explosion sound
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Descending pitch
    oscillator1.frequency.setValueAtTime(400, now);
    oscillator1.frequency.exponentialRampToValueAtTime(50, now + 0.4);

    oscillator2.frequency.setValueAtTime(200, now);
    oscillator2.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    // Explosion-like envelope
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    oscillator1.type = "sawtooth";
    oscillator2.type = "square";

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 0.4);
    oscillator2.stop(now + 0.4);
  }
}

// Background Music System
class BackgroundMusic {
  constructor() {
    this.isPlaying = false;
    this.musicGain = null;
    this.currentMode = null; // 'day' or 'night'
    this.loopTimeout = null;
  }

  start() {
    if (!this.isPlaying) {
      this.isPlaying = true;

      const ctx = audioContext;
      // Create master gain for music
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.08; // Quiet background music
      this.musicGain.connect(ctx.destination);
    }

    // Start with appropriate music based on time
    this.switchMusic(isNightTime(timeOfDay) ? 'night' : 'day');
  }

  switchMusic(mode) {
    if (this.currentMode === mode) return; // Already playing this mode

    this.currentMode = mode;

    // Clear any existing loop
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
    }

    if (mode === 'night') {
      this.playNightMusic();
    } else {
      this.playDayMusic();
    }
  }

  playDayMusic() {
    const ctx = audioContext;

    // Melody notes (C major scale) - frequencies
    const notes = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
      G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25
    };

    // Simple pleasant melody pattern
    const melody = [
      { note: notes.C4, duration: 0.5 },
      { note: notes.E4, duration: 0.5 },
      { note: notes.G4, duration: 0.5 },
      { note: notes.E4, duration: 0.5 },
      { note: notes.A4, duration: 0.5 },
      { note: notes.G4, duration: 0.5 },
      { note: notes.F4, duration: 0.5 },
      { note: notes.E4, duration: 0.5 },
      { note: notes.D4, duration: 0.5 },
      { note: notes.C4, duration: 0.5 },
      { note: notes.G4, duration: 0.5 },
      { note: notes.E4, duration: 0.5 },
      { note: notes.F4, duration: 0.5 },
      { note: notes.D4, duration: 0.5 },
      { note: notes.E4, duration: 0.5 },
      { note: notes.C4, duration: 0.5 }
    ];

    // Bass line (harmony)
    const bass = [
      { note: notes.C4 * 0.5, duration: 2 },
      { note: notes.F4 * 0.5, duration: 2 },
      { note: notes.G4 * 0.5, duration: 2 },
      { note: notes.C4 * 0.5, duration: 2 }
    ];

    this.playMelodyLoop(melody, bass, 8, "sine", "triangle");
  }

  playNightMusic() {
    const ctx = audioContext;

    // Spooky minor scale notes - A minor
    const notes = {
      A3: 220.00, B3: 246.94, C4: 261.63, D4: 293.66,
      E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
      Bb3: 233.08, Eb4: 311.13
    };

    // Eerie, slow melody pattern (minor key, dissonant)
    const melody = [
      { note: notes.A3, duration: 1.0 },
      { note: notes.C4, duration: 1.0 },
      { note: notes.E4, duration: 0.75 },
      { note: notes.F4, duration: 0.75 },
      { note: notes.E4, duration: 0.5 },
      { note: notes.D4, duration: 1.0 },
      { note: notes.C4, duration: 1.0 },
      { note: notes.A3, duration: 1.0 },
      { note: notes.Bb3, duration: 0.75 },
      { note: notes.C4, duration: 0.75 },
      { note: notes.D4, duration: 0.5 },
      { note: notes.A3, duration: 1.0 }
    ];

    // Deep, ominous bass drone
    const bass = [
      { note: notes.A3 * 0.5, duration: 3 },
      { note: notes.E4 * 0.5, duration: 3 },
      { note: notes.F4 * 0.5, duration: 3 },
      { note: notes.A3 * 0.5, duration: 3 }
    ];

    this.playMelodyLoop(melody, bass, 12, "sawtooth", "sine");
  }

  playMelodyLoop(melody, bass, loopDuration, melodyWave, bassWave) {
    const ctx = audioContext;

    const playLoop = () => {
      if (!this.isPlaying || (this.currentMode === 'day' && isNightTime(timeOfDay)) ||
          (this.currentMode === 'night' && !isNightTime(timeOfDay))) {
        // Mode changed, don't continue this loop
        return;
      }

      let time = ctx.currentTime;

      // Play melody
      let melodyTime = time;
      melody.forEach(({ note, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.frequency.value = note;
        osc.type = melodyWave;

        // Envelope
        gain.gain.setValueAtTime(0, melodyTime);
        gain.gain.linearRampToValueAtTime(0.2, melodyTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, melodyTime + duration);

        osc.start(melodyTime);
        osc.stop(melodyTime + duration);

        melodyTime += duration;
      });

      // Play bass
      let bassTime = time;
      bass.forEach(({ note, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.frequency.value = note;
        osc.type = bassWave;

        // Envelope
        gain.gain.setValueAtTime(0, bassTime);
        gain.gain.linearRampToValueAtTime(0.3, bassTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, bassTime + duration);

        osc.start(bassTime);
        osc.stop(bassTime + duration);

        bassTime += duration;
      });

      // Schedule next loop
      this.loopTimeout = setTimeout(playLoop, loopDuration * 1000);
    };

    playLoop();
  }

  stop() {
    this.isPlaying = false;
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
    }
    if (this.musicGain) {
      this.musicGain.disconnect();
    }
  }
}

let soundFX;
let bgMusic;

// Day/Night cycle
let timeOfDay = 0; // Will be randomized in setup
let dayNightSpeed = 0.0002; // How fast time passes

// Points system
let points = 0;

// Get sky color based on time of day
function getSkyColor(time) {
  // time is 0-1 where 0.5 is noon
  let dayProgress = Math.abs(time - 0.5) * 2; // 0 at noon, 1 at midnight

  // Day colors (light blue)
  let dayR = 135, dayG = 206, dayB = 235;

  // Night colors (dark blue)
  let nightR = 10, nightG = 10, nightB = 40;

  // Sunset/sunrise colors (orange/pink)
  let sunsetR = 255, sunsetG = 150, sunsetB = 100;

  // Determine if we're in transition (sunrise/sunset)
  let isTransition = (time > 0.2 && time < 0.3) || (time > 0.7 && time < 0.8);

  if (isTransition) {
    // Blend with sunset colors
    let transitionAmount = 0.5;
    return {
      r: lerp(lerp(dayR, nightR, dayProgress), sunsetR, transitionAmount),
      g: lerp(lerp(dayG, nightG, dayProgress), sunsetG, transitionAmount),
      b: lerp(lerp(dayB, nightB, dayProgress), sunsetB, transitionAmount)
    };
  } else {
    return {
      r: lerp(dayR, nightR, dayProgress),
      g: lerp(dayG, nightG, dayProgress),
      b: lerp(dayB, nightB, dayProgress)
    };
  }
}

// Get light intensity based on time
function getLightIntensity(time) {
  let dayProgress = Math.abs(time - 0.5) * 2;
  return lerp(255, 50, dayProgress); // Bright during day, dim at night
}

// Check if it's nighttime (darkest 8 hours)
function isNightTime(time) {
  // Darkest 8 hours out of 24 = 0.333 of the cycle
  // Centered around midnight (0 and 1)
  // Night is roughly 8pm-4am: timeOfDay < 0.167 OR timeOfDay > 0.833
  return time < 0.167 || time > 0.833;
}

// Spawn enemies at their designated positions (called when night begins)
function spawnNightEnemies() {
  enemies = [];
  for (let pos of enemySpawnPositions) {
    enemies.push(new Enemy(pos.x, pos.z));
  }
}

// Draw sun or moon based on time of day
function drawCelestialBody() {
  push();

  // Calculate position in arc across sky
  let angle = timeOfDay * PI * 2 - PI / 2; // -90 to 270 degrees
  let distance = 800;
  let x = player.pos.x;
  let y = -sin(angle) * distance;
  let z = player.pos.z - cos(angle) * distance;

  translate(x, y, z);

  // Determine if sun or moon
  let isDay = timeOfDay > 0.25 && timeOfDay < 0.75;

  noStroke();
  if (isDay) {
    // Draw sun
    fill(255, 255, 100);
    sphere(80);

    // Sun glow
    fill(255, 255, 150, 50);
    sphere(100);
  } else {
    // Draw moon
    fill(240, 240, 255);
    sphere(60);

    // Moon craters
    fill(220, 220, 240);
    push();
    translate(15, 10, 55);
    sphere(8);
    pop();
    push();
    translate(-10, -15, 55);
    sphere(12);
    pop();
  }

  pop();
}

function setup() {
  soundFX = new SoundFX();
  bgMusic = new BackgroundMusic();
  createCanvas(windowWidth, windowHeight, WEBGL);

  // Randomize time of day on load
  timeOfDay = random(0, 1);

  // Initialize player
  player = new Player();

  // Initialize camera
  gameCamera = new ThirdPersonCamera(player);

  // Initialize terrain
  terrain = new Terrain();

  // Create level objects
  createLevel();
}

function draw() {
  // Update time of day
  timeOfDay += dayNightSpeed;
  if (timeOfDay > 1) timeOfDay = 0;

  // Switch music based on time of day
  if (bgMusic && bgMusic.isPlaying) {
    bgMusic.switchMusic(isNightTime(timeOfDay) ? 'night' : 'day');
  }

  // Get sky color for current time
  let skyColor = getSkyColor(timeOfDay);
  background(skyColor.r, skyColor.g, skyColor.b);

  // Update
  player.update();
  gameCamera.update();

  // Apply camera
  gameCamera.apply();

  // Dynamic lighting based on time of day
  let lightIntensity = getLightIntensity(timeOfDay);
  ambientLight(lightIntensity * 0.4);
  directionalLight(lightIntensity, lightIntensity, lightIntensity, 0.5, 1, -0.5);

  // Draw sun/moon
  drawCelestialBody();

  // Draw terrain
  terrain.display();

  // Draw level objects
  for (let obj of levelObjects) {
    obj.display();
  }

  // Update and draw enemies (only during nighttime)
  if (isNightTime(timeOfDay)) {
    // Spawn enemies if none exist and it's nighttime
    if (enemies.length === 0 && enemySpawnPositions.length > 0) {
      spawnNightEnemies();
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      enemies[i].update();
      enemies[i].display();

      // Remove dead enemies
      if (enemies[i].hp <= 0) {
        soundFX.playEnemyDeath(); // Play death sound
        points += 10; // Award 10 points for killing an enemy
        enemies.splice(i, 1);
      }
    }
  } else {
    // During daytime, clear all enemies
    if (enemies.length > 0) {
      enemies = [];
    }
  }

  // Draw player
  player.display();

  // Draw UI overlay
  push();
  // Reset transformations for 2D overlay
  camera();
  fill(255, 255, 255, 200);
  stroke(0);
  strokeWeight(2);
  textSize(20);
  textAlign(LEFT, TOP);

  // Shift lock indicator
  if (gameCamera.shiftLockEnabled) {
    text("SHIFT LOCK: ON", -windowWidth / 2 + 20, -windowHeight / 2 + 20);
  }

  // Time of day indicator
  let timePercent = (timeOfDay * 24).toFixed(1);
  let timeLabel = timeOfDay > 0.25 && timeOfDay < 0.75 ? "Day" : "Night";
  text(`Time: ${timePercent}:00 (${timeLabel})`, -windowWidth / 2 + 20, -windowHeight / 2 + 50);

  // Enemy warning during nighttime
  if (isNightTime(timeOfDay)) {
    fill(255, 50, 50, 200); // Red warning color
    text(`⚠ ENEMY HOURS - ${enemies.length} enemies active`, -windowWidth / 2 + 20, -windowHeight / 2 + 80);
  } else {
    fill(100, 255, 100, 200); // Green safe color
    text(`✓ Safe - Enemies only appear at night`, -windowWidth / 2 + 20, -windowHeight / 2 + 80);
  }

  // Points counter
  if (points >= 30) {
    fill(255, 215, 0, 255); // Gold color for 30+ points
    stroke(139, 69, 0);
  } else {
    fill(255, 255, 255, 200); // White for under 30 points
    stroke(0);
  }
  strokeWeight(2);
  textSize(24);
  text(`Points: ${points}`, -windowWidth / 2 + 20, -windowHeight / 2 + 110);

  // Gold outfit achievement
  if (points >= 30) {
    fill(255, 215, 0, 255);
    text("★ GOLD GIGACHAD UNLOCKED ★", -windowWidth / 2 + 20, -windowHeight / 2 + 140);
  }

  pop();
  // Reapply game camera
  gameCamera.apply();
}

// Player class
class Player {
  constructor() {
    this.size = 20;
    this.width = 12; // Player bounding box width (X)
    this.height = 40; // Player bounding box height (Y)
    this.depth = 12; // Player bounding box depth (Z)
    // Start high above ground so player falls naturally
    this.pos = createVector(0, -100, 0);
    this.vel = createVector(0, 0, 0);
    this.acc = createVector(0, 0, 0);
    this.angle = 0;
    this.speed = 4.0;
    this.runSpeed = 9.0;
    this.jumpForce = 9.6;
    this.isGrounded = false;
    this.wasGrounded = false;
    this.gravity = 1;
    this.maxJumps = 3;
    this.jumpsRemaining = 3;
    this.spaceWasPressed = false;
    // Sword properties
    this.swordSwinging = false;
    this.swingProgress = 0;
    this.swingSpeed = 0.15;
    this.swordDamage = 50;
    this.swordReach = 30;
  }

  update() {
    // Store previous grounded state
    this.wasGrounded = this.isGrounded;

    // Apply gravity
    this.vel.y += this.gravity;

    // Movement relative to camera
    let moveDir = createVector(0, 0, 0);
    let currentSpeed = keys["CapsLock"] ? this.runSpeed : this.speed;

    // Check for actual key presses (ensure they're boolean true, not undefined)
    if (keys["w"] === true || keys["W"] === true) {
      moveDir.z -= 1;
    }
    if (keys["s"] === true || keys["S"] === true) {
      moveDir.z += 1;
    }
    if (keys["a"] === true || keys["A"] === true) {
      moveDir.x -= 1;
    }
    if (keys["d"] === true || keys["D"] === true) {
      moveDir.x += 1;
    }

    // Normalize and apply speed
    if (moveDir.mag() > 0) {
      moveDir.normalize();

      // Rotate movement direction based on camera angle
      // Use negative angle because camera orbits around player
      let camAngle = -gameCamera.angleH;
      let rotatedX = moveDir.x * cos(camAngle) - moveDir.z * sin(camAngle);
      let rotatedZ = moveDir.x * sin(camAngle) + moveDir.z * cos(camAngle);

      moveDir.x = rotatedX;
      moveDir.z = rotatedZ;
      moveDir.mult(currentSpeed);

      this.vel.x = moveDir.x;
      this.vel.z = moveDir.z;

      // Update facing angle (only in normal mode, shift lock controls it)
      if (!gameCamera.shiftLockEnabled) {
        this.angle = atan2(moveDir.x, moveDir.z);
      }
    } else {
      this.vel.x *= 0.8; // Friction
      this.vel.z *= 0.8;

      // Stop completely when velocity is very small to prevent endless sliding
      if (abs(this.vel.x) < 0.01) this.vel.x = 0;
      if (abs(this.vel.z) < 0.01) this.vel.z = 0;
    }

    // Jumping - double jump mechanic
    if (keys[" "] && !this.spaceWasPressed && this.jumpsRemaining > 0) {
      this.vel.y = -this.jumpForce;
      this.jumpsRemaining--;
      this.isGrounded = false;
    }

    // Track space key state for next frame
    this.spaceWasPressed = keys[" "];

    // Store old position for collision resolution
    let oldPos = this.pos.copy();

    // Reset grounded state before collision checks
    this.isGrounded = false;

    // Update position with X movement
    this.pos.x += this.vel.x;
    this.handleCollisions("x", oldPos);

    // Update position with Y movement
    this.pos.y += this.vel.y;
    this.handleCollisions("y", oldPos);

    // Update position with Z movement
    this.pos.z += this.vel.z;
    this.handleCollisions("z", oldPos);

    // Update sword swing animation
    if (this.swordSwinging) {
      this.swingProgress += this.swingSpeed;
      if (this.swingProgress >= 1) {
        this.swordSwinging = false;
        this.swingProgress = 0;
      }
    }
  }

  attackEnemies() {
    // Check if sword hits any enemies
    for (let enemy of enemies) {
      let distance = dist(this.pos.x, this.pos.z, enemy.pos.x, enemy.pos.z);
      if (distance < this.swordReach && !enemy.justHit) {
        enemy.takeDamage(this.swordDamage);
        enemy.justHit = true;
        soundFX.playSwordHit(); // Play hit sound
        setTimeout(() => { enemy.justHit = false; }, 500); // Prevent multi-hit in same swing
      }
    }
  }

  swingSword() {
    if (!this.swordSwinging) {
      this.swordSwinging = true;
      this.swingProgress = 0;
      soundFX.playSwordSwing(); // Play swing sound
      this.attackEnemies();
    }
  }

  handleCollisions(axis, oldPos) {
    // Check collision with all solid objects
    for (let obj of levelObjects) {
      if (
        obj.type === "platform" ||
        obj.type === "block" ||
        obj.type === "castle"
      ) {
        if (this.checkAABBCollision(obj)) {
          this.resolveCollision(obj, axis, oldPos);
        }
      }
    }

    // Ground collision (only on Y axis)
    if (axis === "y") {
      let groundHeight = terrain.getHeightAt(this.pos.x, this.pos.z);
      let playerBottom = this.pos.y + this.height / 2;

      if (playerBottom >= groundHeight && this.vel.y >= 0) {
        this.pos.y = groundHeight - this.height / 2;
        this.vel.y = 0;
        this.isGrounded = true;
        this.jumpsRemaining = this.maxJumps; // Reset jumps on landing

        // Play landing sound if just landed
        if (!this.wasGrounded) {
          soundFX.playLanding();
        }
      }
    }
  }

  checkAABBCollision(obj) {
    // Get object bounds
    let objBounds = obj.getBounds
      ? obj.getBounds()
      : {
          minX: obj.pos.x - obj.width / 2,
          maxX: obj.pos.x + obj.width / 2,
          minY: obj.pos.y - obj.height / 2,
          maxY: obj.pos.y + obj.height / 2,
          minZ: obj.pos.z - obj.depth / 2,
          maxZ: obj.pos.z + obj.depth / 2,
        };

    // Get player bounds
    let playerBounds = {
      minX: this.pos.x - this.width / 2,
      maxX: this.pos.x + this.width / 2,
      minY: this.pos.y - this.height / 2,
      maxY: this.pos.y + this.height / 2,
      minZ: this.pos.z - this.depth / 2,
      maxZ: this.pos.z + this.depth / 2,
    };

    // Check overlap on all axes
    return (
      playerBounds.maxX > objBounds.minX &&
      playerBounds.minX < objBounds.maxX &&
      playerBounds.maxY > objBounds.minY &&
      playerBounds.minY < objBounds.maxY &&
      playerBounds.maxZ > objBounds.minZ &&
      playerBounds.minZ < objBounds.maxZ
    );
  }

  resolveCollision(obj, axis, oldPos) {
    let objBounds = obj.getBounds
      ? obj.getBounds()
      : {
          minX: obj.pos.x - obj.width / 2,
          maxX: obj.pos.x + obj.width / 2,
          minY: obj.pos.y - obj.height / 2,
          maxY: obj.pos.y + obj.height / 2,
          minZ: obj.pos.z - obj.depth / 2,
          maxZ: obj.pos.z + obj.depth / 2,
        };

    if (axis === "x") {
      // Colliding on X axis (left/right sides)
      if (this.vel.x > 0) {
        // Moving right, hit left side of object
        this.pos.x = objBounds.minX - this.width / 2;
      } else {
        // Moving left, hit right side of object
        this.pos.x = objBounds.maxX + this.width / 2;
      }
      this.vel.x = 0;
    } else if (axis === "y") {
      // Colliding on Y axis (top/bottom)
      if (this.vel.y > 0) {
        // Moving down, hit top of object (landing on it)
        this.pos.y = objBounds.minY - this.height / 2;
        this.vel.y = 0;
        this.isGrounded = true;
        this.jumpsRemaining = this.maxJumps; // Reset jumps on landing

        // Play landing sound if just landed
        if (!this.wasGrounded) {
          soundFX.playLanding();
        }
      } else {
        // Moving up, hit bottom of object (head bonk)
        this.pos.y = objBounds.maxY + this.height / 2;
        this.vel.y = 0;
      }
    } else if (axis === "z") {
      // Colliding on Z axis (front/back sides)
      if (this.vel.z > 0) {
        // Moving forward, hit back side of object
        this.pos.z = objBounds.minZ - this.depth / 2;
      } else {
        // Moving backward, hit front side of object
        this.pos.z = objBounds.maxZ + this.depth / 2;
      }
      this.vel.z = 0;
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    rotateY(this.angle);

    // GIGACHAD proportions - skin tone
    let skinColor = color(210, 180, 140);

    // Gold outfit colors when 30+ points
    let shirtColor, pantsColor;
    if (points >= 30) {
      shirtColor = color(255, 215, 0); // Gold
      pantsColor = color(218, 165, 32); // Golden rod
    } else {
      shirtColor = color(60, 60, 60); // Dark gray
      pantsColor = color(40, 40, 40); // Darker gray
    }

    // Position reference - adjusted to stand on ground properly
    // The collision box bottom is at pos.y + height/2 (pos.y + 20)
    // We need the character's feet to align with that point
    translate(0, -this.size * 2.7, 0);

    // LEGENDARY GIGACHAD JAW
    push();
    fill(skinColor);
    translate(0, this.size * 0.3, this.size * 0.15);
    box(this.size * 0.9, this.size * 0.7, this.size * 0.8); // Massive square jaw
    pop();

    // Upper head
    push();
    fill(skinColor);
    translate(0, -this.size * 0.2, 0);
    box(this.size * 0.85, this.size * 0.6, this.size * 0.7);
    pop();

    // Chad haircut - slicked back
    push();
    fill(40, 30, 20); // Dark hair
    translate(0, -this.size * 0.45, -this.size * 0.1);
    box(this.size * 0.9, this.size * 0.35, this.size * 0.6);
    pop();

    // Eyes - intense stare
    push();
    fill(255, 255, 255);
    translate(this.size * 0.2, 0, this.size * 0.35);
    box(this.size * 0.15, this.size * 0.1, this.size * 0.05);
    pop();

    push();
    fill(255, 255, 255);
    translate(-this.size * 0.2, 0, this.size * 0.35);
    box(this.size * 0.15, this.size * 0.1, this.size * 0.05);
    pop();

    // Pupils
    push();
    fill(50, 50, 50);
    translate(this.size * 0.2, 0, this.size * 0.38);
    box(this.size * 0.08, this.size * 0.08, this.size * 0.03);
    pop();

    push();
    fill(50, 50, 50);
    translate(-this.size * 0.2, 0, this.size * 0.38);
    box(this.size * 0.08, this.size * 0.08, this.size * 0.03);
    pop();

    // THICK NECK
    push();
    fill(skinColor);
    translate(0, this.size * 0.8, 0);
    box(this.size * 0.6, this.size * 0.5, this.size * 0.5);
    pop();

    // MASSIVE TRAPS
    push();
    fill(shirtColor);
    translate(0, this.size * 1.2, 0);
    box(this.size * 1.4, this.size * 0.4, this.size * 0.6);
    pop();

    // GIGANTIC SHOULDERS (left)
    push();
    fill(shirtColor);
    translate(-this.size * 0.9, this.size * 1.4, 0);
    box(this.size * 0.7, this.size * 0.6, this.size * 0.65);
    pop();

    // GIGANTIC SHOULDERS (right)
    push();
    fill(shirtColor);
    translate(this.size * 0.9, this.size * 1.4, 0);
    box(this.size * 0.7, this.size * 0.6, this.size * 0.65);
    pop();

    // MUSCULAR TORSO/CHEST
    push();
    fill(shirtColor);
    translate(0, this.size * 1.8, 0);
    box(this.size * 1.3, this.size * 1.2, this.size * 0.7);
    pop();

    // ABS (vest detail)
    push();
    if (points >= 30) {
      fill(218, 165, 32); // Darker gold for vest detail
    } else {
      fill(50, 50, 50);
    }
    translate(0, this.size * 2.0, this.size * 0.35);
    box(this.size * 0.9, this.size * 0.8, this.size * 0.02);
    pop();

    // MASSIVE BICEPS (left arm)
    push();
    fill(skinColor);
    translate(-this.size * 1.0, this.size * 2.0, 0);
    box(this.size * 0.45, this.size * 0.7, this.size * 0.45);
    pop();

    // MASSIVE BICEPS (right arm)
    push();
    fill(skinColor);
    translate(this.size * 1.0, this.size * 2.0, 0);
    box(this.size * 0.45, this.size * 0.7, this.size * 0.45);
    pop();

    // FOREARMS (left)
    push();
    fill(skinColor);
    translate(-this.size * 1.0, this.size * 2.8, 0);
    box(this.size * 0.4, this.size * 0.6, this.size * 0.4);
    pop();

    // FOREARMS (right)
    push();
    fill(skinColor);
    translate(this.size * 1.0, this.size * 2.8, 0);
    box(this.size * 0.4, this.size * 0.6, this.size * 0.4);
    pop();

    // POWERFUL LEGS (left)
    push();
    fill(pantsColor);
    translate(-this.size * 0.35, this.size * 3.2, 0);
    box(this.size * 0.5, this.size * 1.0, this.size * 0.5);
    pop();

    // POWERFUL LEGS (right)
    push();
    fill(pantsColor);
    translate(this.size * 0.35, this.size * 3.2, 0);
    box(this.size * 0.5, this.size * 1.0, this.size * 0.5);
    pop();

    // SWORD - held in right hand
    push();
    translate(this.size * 1.0, this.size * 2.5, this.size * 0.5);

    // Rotate sword during swing
    if (this.swordSwinging) {
      rotateX(-this.swingProgress * PI * 0.8);
    }

    // Sword blade
    push();
    fill(200, 200, 220);
    translate(0, -15, 0);
    box(3, 30, 1);
    pop();

    // Sword handle
    push();
    fill(139, 69, 19);
    translate(0, 2, 0);
    box(4, 8, 4);
    pop();

    // Sword guard
    push();
    fill(255, 215, 0);
    translate(0, -2, 0);
    box(12, 2, 2);
    pop();

    pop();

    pop();
  }
}

// Third Person Camera
class ThirdPersonCamera {
  constructor(target) {
    this.target = target;
    this.distance = 150;
    this.height = 80;
    this.angleH = 0;
    this.angleV = -0.3;
    this.sensitivity = 0.005;
    this.pos = createVector(0, 0, 0);
    this.shiftLockEnabled = false;
    this.shiftWasPressed = false;
  }

  update() {
    // Toggle shift lock mode when Shift is pressed
    if (keys["Shift"] && !this.shiftWasPressed) {
      this.shiftLockEnabled = !this.shiftLockEnabled;
    }
    this.shiftWasPressed = keys["Shift"];

    // Mouse look behavior depends on shift lock mode
    if (this.shiftLockEnabled) {
      // In shift lock mode, mouse always controls camera (no need to hold mouse button)
      if (movedX !== 0 || movedY !== 0) {
        this.angleH -= movedX * this.sensitivity;
        this.angleV -= movedY * this.sensitivity;
        this.angleV = constrain(this.angleV, -PI / 3, -0.1);
      }

      // Update player rotation to match camera direction
      this.target.angle = this.angleH;
    } else {
      // Normal third-person mode - only move camera when mouse is pressed
      if (mouseIsPressed) {
        this.angleH -= movedX * this.sensitivity;
        this.angleV -= movedY * this.sensitivity;
        this.angleV = constrain(this.angleV, -PI / 3, -0.1);
      }
    }

    // Calculate camera position
    let camDistance = this.shiftLockEnabled ? 50 : this.distance; // Closer in shift lock
    let camHeight = this.shiftLockEnabled ? 10 : this.height; // Lower in shift lock

    let camX = this.target.pos.x + sin(this.angleH) * camDistance;
    let camZ = this.target.pos.z + cos(this.angleH) * camDistance;
    let camY =
      this.target.pos.y + camHeight + camDistance * sin(this.angleV);

    this.pos.set(camX, camY, camZ);
  }

  apply() {
    camera(
      this.pos.x,
      this.pos.y,
      this.pos.z,
      this.target.pos.x,
      this.target.pos.y - 20,
      this.target.pos.z,
      0,
      1,
      0
    );
  }
}

// Terrain with hills
class Terrain {
  constructor() {
    this.size = 2000;
    this.resolution = 40;
    this.hills = [];
    this.lakes = [];

    // Generate 120 random hills
    for (let i = 0; i < 120; i++) {
      this.hills.push({
        x: random(-this.size / 2, this.size / 2),
        z: random(-this.size / 2, this.size / 2),
        radius: random(60, 180),
        height: random(30, 100)
      });
    }

    // Generate 15 random lakes (negative height areas)
    for (let i = 0; i < 15; i++) {
      this.lakes.push({
        x: random(-this.size / 2, this.size / 2),
        z: random(-this.size / 2, this.size / 2),
        radius: random(80, 150),
        depth: random(10, 25)
      });
    }
  }

  getHeightAt(x, z) {
    let h = 0;

    // Calculate height based on hills
    for (let hill of this.hills) {
      let d = dist(x, z, hill.x, hill.z);
      if (d < hill.radius) {
        let factor = 1 - d / hill.radius;
        h += factor * factor * hill.height;
      }
    }

    // Calculate height based on lakes (negative areas)
    for (let lake of this.lakes) {
      let d = dist(x, z, lake.x, lake.z);
      if (d < lake.radius) {
        let factor = 1 - d / lake.radius;
        h -= factor * factor * lake.depth;
      }
    }

    return h;
  }

  isInLake(x, z) {
    for (let lake of this.lakes) {
      let d = dist(x, z, lake.x, lake.z);
      if (d < lake.radius) {
        return true;
      }
    }
    return false;
  }

  display() {
    push();
    translate(0, 0, 0);

    // Draw terrain as a grid
    let step = this.size / this.resolution;

    for (let x = -this.resolution / 2; x < this.resolution / 2; x++) {
      for (let z = -this.resolution / 2; z < this.resolution / 2; z++) {
        let xPos = x * step;
        let zPos = z * step;

        let h1 = this.getHeightAt(xPos, zPos);
        let h2 = this.getHeightAt(xPos + step, zPos);
        let h3 = this.getHeightAt(xPos + step, zPos + step);
        let h4 = this.getHeightAt(xPos, zPos + step);

        // Check if this tile is in a lake
        let inLake = this.isInLake(xPos + step / 2, zPos + step / 2);

        if (inLake) {
          // Water color - blue with variation
          let waterR = 30 + (noise(xPos * 0.01, zPos * 0.01) - 0.5) * 15;
          let waterG = 100 + (noise(xPos * 0.01 + 100, zPos * 0.01) - 0.5) * 15;
          let waterB = 200 + (noise(xPos * 0.01, zPos * 0.01 + 100) - 0.5) * 20;
          fill(waterR, waterG, waterB);
          stroke(20, 80, 180);
        } else {
          // Grass color with slight variation based on position
          let grassR = 50 + (noise(xPos * 0.01, zPos * 0.01) - 0.5) * 20;
          let grassG = 150 + (noise(xPos * 0.01 + 100, zPos * 0.01) - 0.5) * 20;
          let grassB = 50 + (noise(xPos * 0.01, zPos * 0.01 + 100) - 0.5) * 20;
          fill(grassR, grassG, grassB);
          stroke(40, 120, 40);
        }
        strokeWeight(0.5);

        beginShape();
        vertex(xPos, h1, zPos);
        vertex(xPos + step, h2, zPos);
        vertex(xPos + step, h3, zPos + step);
        vertex(xPos, h4, zPos + step);
        endShape(CLOSE);
      }
    }

    pop();
  }
}

// Level object class
class LevelObject {
  constructor(type, pos, dimensions, color) {
    this.type = type;
    this.pos = pos;
    this.width = dimensions.w;
    this.height = dimensions.h;
    this.depth = dimensions.d;
    this.color = color;
  }

  getBounds() {
    return {
      minX: this.pos.x - this.width / 2,
      maxX: this.pos.x + this.width / 2,
      minY: this.pos.y - this.height / 2,
      maxY: this.pos.y + this.height / 2,
      minZ: this.pos.z - this.depth / 2,
      maxZ: this.pos.z + this.depth / 2,
    };
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    fill(this.color);
    stroke(0);
    strokeWeight(1);
    box(this.width, this.height, this.depth);
    pop();
  }
}

// Castle piece
class Castle {
  constructor(x, z) {
    this.type = "castle";
    this.x = x;
    this.z = z;
    this.pos = createVector(x, -100, z);
    this.width = 200; // Total width including side towers
    this.height = 200; // Main tower height
    this.depth = 80; // Main tower depth
  }

  getBounds() {
    // Return collision bounds for the castle base
    return {
      minX: this.x - this.width / 2,
      maxX: this.x + this.width / 2,
      minY: this.pos.y - this.height / 2,
      maxY: this.pos.y + this.height / 2,
      minZ: this.z - this.depth / 2,
      maxZ: this.z + this.depth / 2,
    };
  }

  display() {
    push();
    // Position castle so bottom sits on ground
    translate(this.x, -100, this.z);

    // Main tower
    fill(200, 200, 200);
    stroke(0);
    translate(0, 0, 0);
    box(80, 200, 80);

    // Tower top
    translate(0, -120, 0);
    fill(180, 50, 50);
    cone(50, 60);

    // Side towers
    push();
    translate(-80, 50, 0);
    fill(200, 200, 200);
    box(50, 100, 50);
    translate(0, -70, 0);
    fill(180, 50, 50);
    cone(35, 40);
    pop();

    push();
    translate(80, 50, 0);
    fill(200, 200, 200);
    box(50, 100, 50);
    translate(0, -70, 0);
    fill(180, 50, 50);
    cone(35, 40);
    pop();

    pop();
  }
}

// Bush class - decorative only, no collision
class Bush {
  constructor(x, z, size) {
    this.type = "bush";
    this.x = x;
    this.z = z;
    this.size = size;
    this.y = terrain.getHeightAt(x, z);
  }

  display() {
    push();
    translate(this.x, this.y - this.size / 2, this.z);

    // Main bush body - green sphere
    fill(34, 139, 34);
    noStroke();
    sphere(this.size);

    // Add some detail with smaller spheres
    push();
    translate(this.size * 0.3, -this.size * 0.2, 0);
    sphere(this.size * 0.6);
    pop();

    push();
    translate(-this.size * 0.3, -this.size * 0.2, 0);
    sphere(this.size * 0.6);
    pop();

    push();
    translate(0, -this.size * 0.2, this.size * 0.3);
    sphere(this.size * 0.6);
    pop();

    pop();
  }
}

// Enemy class
class Enemy {
  constructor(x, z) {
    this.pos = createVector(x, -100, z);
    this.vel = createVector(0, 0, 0);
    this.size = 20;
    this.width = 15;
    this.height = 30;
    this.depth = 15;
    this.hp = 100;
    this.maxHp = 100;
    this.gravity = 1;
    this.isGrounded = false;
    this.speed = 1.5;
    this.angle = 0;
    this.justHit = false;
    this.wanderTimer = 0;
    this.wanderDirection = createVector(0, 0);
  }

  takeDamage(amount) {
    this.hp -= amount;
    // Knockback effect
    let knockbackDir = p5.Vector.sub(this.pos, player.pos);
    knockbackDir.normalize();
    knockbackDir.mult(5);
    this.vel.x = knockbackDir.x;
    this.vel.z = knockbackDir.z;
  }

  update() {
    // Apply gravity
    this.vel.y += this.gravity;

    // Simple AI - wander around
    this.wanderTimer++;
    if (this.wanderTimer > 120) {
      this.wanderTimer = 0;
      this.wanderDirection = createVector(random(-1, 1), 0, random(-1, 1));
      this.wanderDirection.normalize();
    }

    // Move in wander direction
    this.vel.x = this.wanderDirection.x * this.speed;
    this.vel.z = this.wanderDirection.z * this.speed;

    // Update facing angle
    if (this.wanderDirection.mag() > 0) {
      this.angle = atan2(this.wanderDirection.x, this.wanderDirection.z);
    }

    // Update position
    this.pos.x += this.vel.x;
    this.pos.z += this.vel.z;
    this.pos.y += this.vel.y;

    // Ground collision
    let groundHeight = terrain.getHeightAt(this.pos.x, this.pos.z);
    let enemyBottom = this.pos.y + this.height / 2;

    if (enemyBottom >= groundHeight && this.vel.y >= 0) {
      this.pos.y = groundHeight - this.height / 2;
      this.vel.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Apply friction
    this.vel.x *= 0.9;
    this.vel.z *= 0.9;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    rotateY(this.angle);

    // Flash red when hit
    if (this.justHit) {
      fill(255, 0, 0);
    } else {
      fill(100, 50, 150); // Purple enemy
    }

    // Body
    translate(0, -this.size * 0.5, 0);
    box(this.size, this.size * 1.5, this.size * 0.8);

    // Head
    translate(0, -this.size * 0.9, 0);
    fill(120, 70, 170);
    sphere(this.size * 0.6);

    // Eyes
    push();
    translate(this.size * 0.2, 0, this.size * 0.5);
    fill(255, 255, 0);
    sphere(3);
    pop();

    push();
    translate(-this.size * 0.2, 0, this.size * 0.5);
    fill(255, 255, 0);
    sphere(3);
    pop();

    pop();

    // Draw HP bar
    push();
    translate(this.pos.x, this.pos.y - this.height, this.pos.z);

    // Billboard effect - face camera
    let camAngle = atan2(
      gameCamera.pos.x - this.pos.x,
      gameCamera.pos.z - this.pos.z
    );
    rotateY(-camAngle);

    // HP bar background
    fill(255, 0, 0);
    noStroke();
    box(30, 3, 1);

    // HP bar foreground
    let hpPercent = this.hp / this.maxHp;
    fill(0, 255, 0);
    translate(-15 + (15 * hpPercent), 0, 0.5);
    box(30 * hpPercent, 3, 1);

    pop();
  }
}

// Create level elements
function createLevel() {
  // Generate 30 random floating platforms
  for (let i = 0; i < 30; i++) {
    let x = random(-800, 800);
    let z = random(-800, 800);
    let y = random(-150, -30);
    let size = random(60, 120);

    levelObjects.push(
      new LevelObject(
        "platform",
        createVector(x, y, z),
        { w: size, h: 20, d: size },
        color(random(120, 180), random(80, 120), random(40, 60))
      )
    );
  }

  // Add some specific platforms near spawn
  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(100, -40, 100),
      { w: 80, h: 20, d: 80 },
      color(150, 100, 50)
    )
  );

  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(200, -80, 200),
      { w: 90, h: 20, d: 90 },
      color(150, 100, 50)
    )
  );

  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(300, -120, 300),
      { w: 100, h: 20, d: 100 },
      color(150, 100, 50)
    )
  );

  // Bridge platforms
  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(-200, -30, -150),
      { w: 150, h: 15, d: 60 },
      color(139, 90, 43)
    )
  );

  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(-350, -50, -200),
      { w: 120, h: 15, d: 60 },
      color(139, 90, 43)
    )
  );

  // Castle
  levelObjects.push(new Castle(-500, -400));

  // Decorative blocks - question blocks style
  for (let i = 0; i < 20; i++) {
    let x = random(-600, 600);
    let z = random(-600, 600);
    let y = random(-80, -10);

    levelObjects.push(
      new LevelObject(
        "block",
        createVector(x, y, z),
        { w: 40, h: 40, d: 40 },
        color(255, random(180, 220), 0)
      )
    );
  }

  // Generate 50 random bushes
  for (let i = 0; i < 50; i++) {
    let x = random(-900, 900);
    let z = random(-900, 900);
    let size = random(15, 35);

    levelObjects.push(new Bush(x, z, size));
  }

  // Generate 15 enemy spawn positions (enemies only appear at night)
  for (let i = 0; i < 15; i++) {
    let x = random(-700, 700);
    let z = random(-700, 700);

    enemySpawnPositions.push({ x: x, z: z });
  }

  // Spawn enemies immediately if starting at nighttime
  if (isNightTime(timeOfDay)) {
    spawnNightEnemies();
  }
}

// Input handling
function keyPressed() {
  // Resume audio context on first user interaction (browser autoplay policy)
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Start background music on first interaction
  if (!bgMusic.isPlaying) {
    bgMusic.start();
  }

  keys[key] = true;
  return false;
}

function keyReleased() {
  keys[key] = false;
  return false;
}

function mousePressed() {
  // Resume audio context on first user interaction (browser autoplay policy)
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Start background music on first interaction
  if (!bgMusic.isPlaying) {
    bgMusic.start();
  }

  // Swing sword on left click
  if (mouseButton === LEFT) {
    player.swingSword();
  }
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
