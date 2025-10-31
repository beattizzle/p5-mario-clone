// Player object
let player;
// Camera
let gameCamera;
// Terrain
let terrain;
// Level objects
let levelObjects = [];
// Keys pressed
let keys = {};

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

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
  background(135, 206, 235); // Sky blue

  // Update
  player.update();
  gameCamera.update();

  // Apply camera
  gameCamera.apply();

  // Lighting
  ambientLight(100);
  directionalLight(255, 255, 255, 0.5, 1, -0.5);

  // Draw terrain
  terrain.display();

  // Draw level objects
  for (let obj of levelObjects) {
    obj.display();
  }

  // Draw player
  player.display();
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
    this.gravity = 1;
    this.maxJumps = 3;
    this.jumpsRemaining = 3;
    this.spaceWasPressed = false;
  }

  update() {
    // Apply gravity
    this.vel.y += this.gravity;

    // Movement relative to camera
    let moveDir = createVector(0, 0, 0);
    let currentSpeed = keys["CapsLock"] ? this.runSpeed : this.speed;

    if (keys["w"] || keys["W"]) {
      moveDir.z -= 1;
    }
    if (keys["s"] || keys["S"]) {
      moveDir.z += 1;
    }
    if (keys["a"] || keys["A"]) {
      moveDir.x -= 1;
    }
    if (keys["d"] || keys["D"]) {
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

      // Update facing angle
      this.angle = atan2(moveDir.x, moveDir.z);
    } else {
      this.vel.x *= 0.8; // Friction
      this.vel.z *= 0.8;
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

    // Mario colors - red and blue

    // Head
    fill(255, 200, 180);
    translate(0, -this.size * 1.2, 0);
    sphere(this.size * 0.6);

    // Hat
    translate(0, -this.size * 0.5, 0);
    fill(255, 0, 0);
    cone(this.size * 0.7, this.size * 0.5);

    // Body
    translate(0, this.size * 1.2, 0);
    fill(255, 0, 0);
    box(this.size * 0.8, this.size, this.size * 0.6);

    // Overalls
    translate(0, this.size * 0.3, this.size * 0.1);
    fill(0, 0, 255);
    box(this.size * 0.6, this.size * 0.5, this.size * 0.4);

    // Legs
    translate(-this.size * 0.2, this.size * 0.5, 0);
    fill(0, 0, 255);
    box(this.size * 0.3, this.size * 0.8, this.size * 0.3);

    translate(this.size * 0.4, 0, 0);
    box(this.size * 0.3, this.size * 0.8, this.size * 0.3);

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
  }

  update() {
    // Mouse look (when dragging)
    if (mouseIsPressed) {
      this.angleH -= movedX * this.sensitivity;
      this.angleV -= movedY * this.sensitivity;
      this.angleV = constrain(this.angleV, -PI / 3, -0.1);
    }

    // Calculate camera position
    let camX = this.target.pos.x + sin(this.angleH) * this.distance;
    let camZ = this.target.pos.z + cos(this.angleH) * this.distance;
    let camY =
      this.target.pos.y + this.height + this.distance * sin(this.angleV);

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
    this.resolution = 30;
    this.hills = [];

    // Create some hills
    this.hills.push({ x: 200, z: 200, radius: 150, height: 80 });
    this.hills.push({ x: -300, z: -100, radius: 120, height: 60 });
    this.hills.push({ x: 400, z: -300, radius: 100, height: 50 });
    this.hills.push({ x: -200, z: 300, radius: 80, height: 40 });
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

    return h;
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

        // Grass color with slight variation based on position (not random)
        let grassR = 50 + (noise(xPos * 0.01, zPos * 0.01) - 0.5) * 20;
        let grassG = 150 + (noise(xPos * 0.01 + 100, zPos * 0.01) - 0.5) * 20;
        let grassB = 50 + (noise(xPos * 0.01, zPos * 0.01 + 100) - 0.5) * 20;

        fill(grassR, grassG, grassB);
        stroke(40, 120, 40);
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

// Create level elements
function createLevel() {
  // Floating platforms
  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(200, -50, 100),
      { w: 80, h: 20, d: 80 },
      color(150, 100, 50)
    )
  );

  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(300, -80, 150),
      { w: 80, h: 20, d: 80 },
      color(150, 100, 50)
    )
  );

  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(400, -120, 200),
      { w: 100, h: 20, d: 100 },
      color(150, 100, 50)
    )
  );

  // Bridge platform
  levelObjects.push(
    new LevelObject(
      "platform",
      createVector(-200, -30, -150),
      { w: 150, h: 15, d: 60 },
      color(139, 90, 43)
    )
  );

  // Castle
  levelObjects.push(new Castle(-500, -400));

  // Some decorative blocks
  levelObjects.push(
    new LevelObject(
      "block",
      createVector(100, -20, -100),
      { w: 40, h: 40, d: 40 },
      color(255, 200, 0)
    )
  );

  levelObjects.push(
    new LevelObject(
      "block",
      createVector(-150, -10, 200),
      { w: 40, h: 40, d: 40 },
      color(255, 200, 0)
    )
  );
}

// Input handling
function keyPressed() {
  keys[key] = true;
  return false;
}

function keyReleased() {
  keys[key] = false;
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
