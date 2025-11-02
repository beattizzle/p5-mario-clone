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

  // Player HP bar - ALWAYS ON TOP (drawn last as front layer)
  push();
  camera(); // Reset to 2D overlay mode

  fill(255, 255, 255);
  stroke(0);
  strokeWeight(3);
  textSize(32);
  textAlign(CENTER, TOP);

  let hpPercent = player.hp / player.maxHp;

  // Color based on health
  if (hpPercent > 0.5) {
    fill(0, 255, 0); // Bright green when healthy
  } else if (hpPercent > 0.25) {
    fill(255, 255, 0); // Yellow when hurt
  } else {
    fill(255, 0, 0); // Red when critical
  }

  // Create visual HP bar with text characters
  let maxBars = 20;
  let currentBars = Math.ceil(maxBars * hpPercent);
  let hpBarText = "";
  for (let i = 0; i < currentBars; i++) {
    hpBarText += "█";
  }
  for (let i = currentBars; i < maxBars; i++) {
    hpBarText += "░";
  }

  text(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 0, -windowHeight / 2 + 70);
  text(hpBarText, 0, -windowHeight / 2 + 105);

  // Reset text alignment
  textAlign(LEFT, TOP);

  pop();
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
    // HP properties
    this.hp = 60;
    this.maxHp = 60;
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

    // Tang Dynasty character - Asian skin tone
    let skinColor = color(245, 215, 180);

    // Tang Dynasty red and gold embroidery robes
    let robeColor, accentColor, pantColor;
    if (points >= 30) {
      robeColor = color(220, 20, 60); // Crimson red (Tang Dynasty imperial red)
      accentColor = color(255, 215, 0); // Gold embroidery
      pantColor = color(180, 15, 50); // Dark red
    } else {
      robeColor = color(200, 30, 60); // Red robe
      accentColor = color(218, 165, 32); // Gold accents
      pantColor = color(160, 20, 50); // Dark red pants
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

    // Traditional black hair - Tang Dynasty style
    push();
    fill(10, 10, 10); // Black hair
    translate(0, -this.size * 0.45, -this.size * 0.1);
    box(this.size * 0.9, this.size * 0.35, this.size * 0.6);

    // Hair ornament/decoration
    fill(accentColor);
    translate(0, -this.size * 0.1, 0);
    box(this.size * 0.3, this.size * 0.1, this.size * 0.2);
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

    // BIG GOLD CHAIN NECKLACE
    push();
    fill(255, 215, 0); // Gold color
    stroke(200, 170, 0);
    strokeWeight(1);

    // Chain sits around the neck
    let chainRadius = this.size * 0.5;
    let numLinks = 12;

    for (let i = 0; i < numLinks; i++) {
      let angle = (i / numLinks) * TWO_PI;
      let x = sin(angle) * chainRadius;
      let y = this.size * 1.1 + cos(angle) * chainRadius * 0.3;
      let z = cos(angle) * chainRadius;

      push();
      translate(x, y, z);
      rotateY(angle);

      // Chain link (thick torus-like shape)
      box(this.size * 0.15, this.size * 0.2, this.size * 0.08);
      pop();
    }

    // Big dollar sign pendant
    push();
    translate(0, this.size * 1.5, this.size * 0.4);
    fill(255, 215, 0);
    stroke(200, 170, 0);
    strokeWeight(2);

    // Pendant circle background
    sphere(this.size * 0.3);

    // Dollar sign on pendant
    fill(0, 150, 0);
    translate(0, 0, this.size * 0.3);
    textSize(this.size * 0.5);
    textAlign(CENTER, CENTER);
    text("$", 0, 0);
    pop();

    pop();

    // UPPER ROBE (shoulders area)
    push();
    fill(robeColor);
    translate(0, this.size * 1.2, 0);
    box(this.size * 1.4, this.size * 0.4, this.size * 0.6);
    pop();

    // ROBE SHOULDERS (left)
    push();
    fill(robeColor);
    translate(-this.size * 0.9, this.size * 1.4, 0);
    box(this.size * 0.7, this.size * 0.6, this.size * 0.65);
    pop();

    // ROBE SHOULDERS (right)
    push();
    fill(robeColor);
    translate(this.size * 0.9, this.size * 1.4, 0);
    box(this.size * 0.7, this.size * 0.6, this.size * 0.65);
    pop();

    // ROBE BODY/CHEST
    push();
    fill(robeColor);
    translate(0, this.size * 1.8, 0);
    box(this.size * 1.3, this.size * 1.2, this.size * 0.7);
    pop();

    // GOLD EMBROIDERY DETAIL
    push();
    fill(accentColor);
    translate(0, this.size * 2.0, this.size * 0.35);
    box(this.size * 0.9, this.size * 0.8, this.size * 0.02);

    // Add decorative pattern
    fill(accentColor);
    for (let i = -0.3; i <= 0.3; i += 0.3) {
      push();
      translate(i * this.size, 0, 0.01);
      box(this.size * 0.15, this.size * 0.15, this.size * 0.01);
      pop();
    }
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

    // ROBE LOWER GARMENT (left leg)
    push();
    fill(pantColor);
    translate(-this.size * 0.35, this.size * 3.2, 0);
    box(this.size * 0.5, this.size * 1.0, this.size * 0.5);
    pop();

    // ROBE LOWER GARMENT (right leg)
    push();
    fill(pantColor);
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
    this.width = 500; // Larger, more imposing castle
    this.height = 350;
    this.depth = 400;
  }

  getBounds() {
    // Return collision bounds for the castle outer walls
    // This represents the perimeter walls that block entry
    return {
      minX: this.x - 220,
      maxX: this.x + 220,
      minY: this.pos.y - this.height / 2,
      maxY: this.pos.y + 20, // Only bottom portion blocks movement
      minZ: this.z - 170,
      maxZ: this.z + 170,
    };
  }

  isInsideWalls(x, z) {
    // Check if a position is inside the castle walls (hollow interior)
    let relX = x - this.x;
    let relZ = z - this.z;

    // Outside the outer perimeter
    if (abs(relX) > 220 || abs(relZ) > 170) return false;

    // Inside the inner courtyard (hollow area)
    if (abs(relX) < 180 && abs(relZ) < 130) return false;

    return true; // In the wall thickness
  }

  drawBattlement(x, y, z, width) {
    // Draw individual battlement/crenellation
    for (let i = 0; i < 5; i++) {
      push();
      let offset = (i - 2) * (width / 4.5);
      translate(x + offset, y, z);
      fill(220, 220, 220);
      box(width / 6, 15, 15);
      pop();
    }
  }

  drawArrowSlit(x, y, z) {
    push();
    translate(x, y, z);
    fill(40, 40, 40);
    box(3, 20, 2);
    pop();
  }

  drawWindow(x, y, z, size) {
    push();
    translate(x, y, z);
    fill(100, 150, 200, 150);
    box(size, size * 1.5, 2);
    // Window frame
    stroke(80, 60, 40);
    strokeWeight(1);
    noFill();
    box(size + 2, size * 1.5 + 2, 2);
    pop();
  }

  display() {
    push();
    translate(this.x, 0, this.z);
    let groundY = terrain.getHeightAt(this.x, this.z);

    // === MOAT (surrounding the castle) ===
    push();
    translate(0, groundY + 10, 0);
    fill(40, 80, 120); // Dark water
    noStroke();
    // Outer moat ring
    for (let angle = 0; angle < TWO_PI; angle += 0.2) {
      push();
      let radius = 260;
      let x = sin(angle) * radius;
      let z = cos(angle) * radius;
      translate(x, 0, z);
      box(60, 30, 60);
      pop();
    }
    pop();

    // === STONE BRIDGE / DRAWBRIDGE ===
    push();
    translate(0, groundY - 5, 200);
    fill(120, 100, 80); // Stone/wood color
    stroke(80, 60, 40);
    strokeWeight(2);
    box(60, 10, 100);

    // Bridge support pillars
    for (let i = -1; i <= 1; i++) {
      push();
      translate(i * 25, 10, 0);
      fill(100, 90, 70);
      box(8, 20, 8);
      pop();
    }

    // Chains for drawbridge (decorative)
    stroke(80, 80, 80);
    strokeWeight(3);
    line(-25, -10, 50, -25, -10, 150);
    line(25, -10, 50, 25, -10, 150);
    pop();

    // === OUTER DEFENSIVE BARRIERS ===
    // Stone bollards/barriers in front of gate
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue; // Leave center open for gate
      push();
      translate(i * 40, groundY - 15, 170);
      fill(150, 140, 130);
      stroke(100, 90, 80);
      strokeWeight(1);
      cylinder(8, 30);
      // Top cap
      translate(0, -18, 0);
      fill(130, 120, 110);
      sphere(10);
      pop();
    }

    // === OUTER WALLS ===
    // Front wall (with extra thickness and detail)
    push();
    translate(0, groundY - 60, 150);
    fill(200, 200, 200);
    stroke(0);
    strokeWeight(1);
    box(400, 120, 25);

    // Wall texture - stone blocks
    stroke(180, 180, 180);
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 20; x++) {
        push();
        translate(-190 + x * 20, -50 + y * 20, 13);
        noFill();
        strokeWeight(1);
        box(19, 19, 1);
        pop();
      }
    }

    // Battlements on front wall
    this.drawBattlement(0, groundY - 125, 150, 400);
    pop();

    // Back wall
    push();
    translate(0, groundY - 60, -150);
    fill(200, 200, 200);
    stroke(0);
    strokeWeight(1);
    box(400, 120, 25);

    // Stone texture
    stroke(180, 180, 180);
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 20; x++) {
        push();
        translate(-190 + x * 20, -50 + y * 20, -13);
        noFill();
        strokeWeight(1);
        box(19, 19, 1);
        pop();
      }
    }
    this.drawBattlement(0, groundY - 125, -150, 400);
    pop();

    // Left wall
    push();
    translate(-200, groundY - 60, 0);
    fill(200, 200, 200);
    stroke(0);
    strokeWeight(1);
    box(25, 120, 300);

    // Stone texture
    stroke(180, 180, 180);
    for (let y = 0; y < 6; y++) {
      for (let z = 0; z < 15; z++) {
        push();
        translate(-13, -50 + y * 20, -140 + z * 20);
        noFill();
        strokeWeight(1);
        box(1, 19, 19);
        pop();
      }
    }
    this.drawBattlement(-200, groundY - 125, 0, 300);
    pop();

    // Right wall
    push();
    translate(200, groundY - 60, 0);
    fill(200, 200, 200);
    stroke(0);
    strokeWeight(1);
    box(25, 120, 300);

    // Stone texture
    stroke(180, 180, 180);
    for (let y = 0; y < 6; y++) {
      for (let z = 0; z < 15; z++) {
        push();
        translate(13, -50 + y * 20, -140 + z * 20);
        noFill();
        strokeWeight(1);
        box(1, 19, 19);
        pop();
      }
    }
    this.drawBattlement(200, groundY - 125, 0, 300);
    pop();

    // === CORNER TOWERS (4 large round towers) ===
    let towerPositions = [
      { x: -190, z: -140 },
      { x: 190, z: -140 },
      { x: -190, z: 140 },
      { x: 190, z: 140 },
    ];

    for (let pos of towerPositions) {
      push();
      translate(pos.x, groundY - 80, pos.z);

      // Tower body
      fill(190, 190, 190);
      cylinder(30, 160);

      // Arrow slits at different levels
      for (let level = 0; level < 4; level++) {
        let slitY = -60 + level * 40;
        this.drawArrowSlit(30, slitY, 0);
        this.drawArrowSlit(-30, slitY, 0);
        this.drawArrowSlit(0, slitY, 30);
        this.drawArrowSlit(0, slitY, -30);
      }

      // Tower top platform
      translate(0, -90, 0);
      fill(180, 180, 180);
      cylinder(35, 10);

      // Battlements on tower
      for (let i = 0; i < 8; i++) {
        let angle = (i / 8) * TWO_PI;
        push();
        translate(sin(angle) * 35, -10, cos(angle) * 35);
        fill(200, 200, 200);
        box(12, 18, 12);
        pop();
      }

      // Conical roof
      translate(0, -20, 0);
      fill(150, 50, 50);
      cone(40, 50, 8);

      // Flag on top
      translate(0, -45, 0);
      fill(255, 0, 0);
      box(2, 60, 2);
      translate(0, -30, 8);
      box(1, 15, 15);
      pop();
    }

    // === GATEHOUSE (main entrance) ===
    push();
    translate(0, groundY - 70, 150);

    // Gatehouse towers (left and right)
    for (let side of [-1, 1]) {
      push();
      translate(side * 50, 0, 0);
      fill(180, 180, 180);
      box(40, 140, 40);

      // Windows on gatehouse towers
      for (let i = 0; i < 3; i++) {
        this.drawWindow(0, -40 + i * 35, 21, 12);
      }

      // Gatehouse tower tops
      translate(0, -80, 0);
      fill(140, 40, 40);
      cone(30, 40, 4);
      pop();
    }

    // Gate arch
    push();
    translate(0, 20, 0);
    fill(101, 67, 33);
    box(50, 80, 25);

    // Portcullis detail
    fill(60, 60, 60);
    for (let i = -20; i <= 20; i += 8) {
      push();
      translate(i, 0, 13);
      box(3, 80, 1);
      pop();
    }
    pop();

    // Arch decoration
    push();
    translate(0, -35, 13);
    fill(180, 160, 140);
    box(60, 15, 3);
    pop();

    // Machicolations (murder holes) above the gate
    push();
    translate(0, -50, 0);
    fill(170, 170, 170);
    box(70, 20, 45);

    // Murder holes openings
    for (let i = -1; i <= 1; i++) {
      push();
      translate(i * 20, 10, 0);
      fill(40, 40, 40);
      box(12, 5, 12);
      pop();
    }
    pop();
    pop();

    // === DEFENSIVE SPIKES (around outer perimeter) ===
    // Wooden spikes/stakes in front of moat
    for (let angle = 0; angle < TWO_PI; angle += 0.4) {
      push();
      let radius = 290;
      let x = sin(angle) * radius;
      let z = cos(angle) * radius;
      translate(x, groundY - 15, z);

      // Skip area in front of gate
      if (z > 180 && abs(x) < 40) {
        pop();
        continue;
      }

      fill(101, 67, 33);
      stroke(80, 50, 20);
      strokeWeight(1);

      // Angled defensive spike
      push();
      rotateZ(-PI / 6); // Angle outward
      cylinder(4, 35);
      translate(0, -20, 0);
      fill(80, 50, 20);
      cone(5, 10);
      pop();
      pop();
    }

    // === CENTRAL KEEP (tallest structure) ===
    push();
    translate(0, groundY - 140, -50);
    fill(180, 180, 180);
    stroke(0);
    strokeWeight(1);
    box(100, 280, 100);

    // Keep windows at multiple levels
    for (let level = 0; level < 6; level++) {
      let winY = -100 + level * 40;
      // Front windows
      this.drawWindow(0, winY, 52, 15);
      // Side windows
      this.drawWindow(52, winY, 0, 15);
      this.drawWindow(-52, winY, 0, 15);
    }

    // Keep battlements
    translate(0, -150, 0);
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        if (abs(x) === 4 || abs(z) === 4) {
          push();
          translate(x * 12, 0, z * 12);
          fill(200, 200, 200);
          box(10, 20, 10);
          pop();
        }
      }
    }

    // Keep roof
    translate(0, -25, 0);
    fill(120, 30, 30);
    cone(70, 80, 4);

    // Main flag
    translate(0, -100, 0);
    fill(255, 215, 0);
    box(4, 80, 4);
    translate(0, -40, 12);
    fill(255, 0, 0);
    box(2, 25, 25);
    // Royal emblem
    fill(255, 215, 0);
    translate(0, 0, 1);
    textSize(15);
    textAlign(CENTER, CENTER);
    text("⚔", 0, 0);
    pop();

    // === ADDITIONAL TURRETS ===
    let turretPositions = [
      { x: -100, z: 50 },
      { x: 100, z: 50 },
      { x: -100, z: -150 },
      { x: 100, z: -150 },
    ];

    for (let pos of turretPositions) {
      push();
      translate(pos.x, groundY - 100, pos.z);
      fill(190, 190, 190);
      cylinder(20, 200);

      // Turret windows
      for (let i = 0; i < 4; i++) {
        this.drawWindow(22, -70 + i * 40, 0, 10);
      }

      translate(0, -110, 0);
      fill(140, 40, 40);
      cone(25, 35, 6);
      pop();
    }

    // === INNER COURTYARD DETAILS ===
    // Well
    push();
    translate(50, groundY - 10, 0);
    fill(120, 120, 120);
    cylinder(15, 20);
    translate(0, -15, 0);
    fill(80, 80, 80);
    cylinder(10, 5);
    pop();

    // Armory building
    push();
    translate(-80, groundY - 30, 20);
    fill(160, 160, 160);
    box(60, 60, 40);
    translate(0, -35, 0);
    fill(100, 40, 40);
    box(65, 10, 45);
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

// Find the highest even terrain for castle placement
function findHighestEvenTerrain() {
  let bestPosition = { x: 0, z: 0, height: -Infinity, flatness: Infinity };
  let searchRadius = 900; // Search within this radius
  let sampleSize = 50; // Number of positions to sample
  let checkRadius = 250; // Area needed for castle (must be flat within this radius)

  for (let i = 0; i < sampleSize; i++) {
    // Random position to test
    let testX = random(-searchRadius, searchRadius);
    let testZ = random(-searchRadius, searchRadius);

    // Get height at this position
    let centerHeight = terrain.getHeightAt(testX, testZ);

    // Check flatness by sampling nearby points
    let heightVariation = 0;
    let samples = 8;

    for (let angle = 0; angle < TWO_PI; angle += TWO_PI / samples) {
      let sampleX = testX + cos(angle) * checkRadius;
      let sampleZ = testZ + sin(angle) * checkRadius;
      let sampleHeight = terrain.getHeightAt(sampleX, sampleZ);
      heightVariation += abs(sampleHeight - centerHeight);
    }

    let avgVariation = heightVariation / samples;

    // Prefer higher terrain with less variation (flatter)
    // Weight: higher terrain is better, but must be reasonably flat
    if (avgVariation < 30) { // Only consider if reasonably flat
      if (centerHeight > bestPosition.height) {
        bestPosition = {
          x: testX,
          z: testZ,
          height: centerHeight,
          flatness: avgVariation
        };
      }
    }
  }

  return bestPosition;
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

  // Castle - place on highest even terrain
  let castleLocation = findHighestEvenTerrain();
  console.log(`Castle placed at (${castleLocation.x.toFixed(0)}, ${castleLocation.z.toFixed(0)}) - Height: ${castleLocation.height.toFixed(1)}, Flatness: ${castleLocation.flatness.toFixed(1)}`);
  levelObjects.push(new Castle(castleLocation.x, castleLocation.z));

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
  // Avoid spawning too close to the castle
  for (let i = 0; i < 15; i++) {
    let x, z;
    let validPosition = false;

    // Keep trying until we find a position far enough from castle
    while (!validPosition) {
      x = random(-700, 700);
      z = random(-700, 700);

      // Check distance from castle
      let distToCastle = dist(x, z, castleLocation.x, castleLocation.z);
      if (distToCastle > 400) { // At least 400 units away from castle
        validPosition = true;
      }
    }

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
