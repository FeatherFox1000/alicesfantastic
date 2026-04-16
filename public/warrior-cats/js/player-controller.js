// Third-person player controller with camera orbit
import * as THREE from 'three';
import { CatAnimator } from './cat-animations.js';

export class PlayerController {
  constructor(catModel, camera, terrain) {
    this.cat = catModel;
    this.camera = camera;
    this.terrain = terrain;
    this.animator = new CatAnimator(catModel);

    // Movement
    this.velocity = new THREE.Vector3();
    this.moveDir = new THREE.Vector3();
    this.walkSpeed = 5;
    this.runSpeed = 12;
    this.jumpForce = 8;
    this.gravity = -20;
    this.isGrounded = true;
    this.verticalVelocity = 0;

    // Camera
    this.cameraDistance = 5;
    this.cameraHeight = 2.5;
    this.cameraAngleX = 0;     // Horizontal orbit
    this.cameraAngleY = 0.3;   // Vertical angle
    this.cameraSensitivity = 0.003;
    this.cameraTarget = new THREE.Vector3();

    // Input
    this.keys = {};
    this.isRunning = false;
    this.isLocked = false;

    this.setupInput();
  }

  setupInput() {
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === 'Shift') this.isRunning = true;
      if (e.key === ' ' && this.isGrounded) {
        this.verticalVelocity = this.jumpForce;
        this.isGrounded = false;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
      if (e.key === 'Shift') this.isRunning = false;
    });

    // Mouse look
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', () => {
      canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', e => {
      if (!this.isLocked) return;
      this.cameraAngleX -= e.movementX * this.cameraSensitivity;
      this.cameraAngleY -= e.movementY * this.cameraSensitivity;
      this.cameraAngleY = Math.max(-0.2, Math.min(1.2, this.cameraAngleY));
    });

    // Scroll to zoom
    window.addEventListener('wheel', e => {
      this.cameraDistance += e.deltaY * 0.005;
      this.cameraDistance = Math.max(2, Math.min(15, this.cameraDistance));
    });
  }

  getTerrainHeight(x, z) {
    if (!this.terrain) return 0;
    return this.terrain.getHeightAt(x, z);
  }

  update(dt) {
    // Calculate movement direction relative to camera
    const forward = new THREE.Vector3(
      -Math.sin(this.cameraAngleX),
      0,
      -Math.cos(this.cameraAngleX)
    ).normalize();

    const right = new THREE.Vector3(
      Math.cos(this.cameraAngleX),
      0,
      -Math.sin(this.cameraAngleX)
    ).normalize();

    this.moveDir.set(0, 0, 0);
    if (this.keys['w'] || this.keys['arrowup']) this.moveDir.add(forward);
    if (this.keys['s'] || this.keys['arrowdown']) this.moveDir.sub(forward);
    if (this.keys['a'] || this.keys['arrowleft']) this.moveDir.sub(right);
    if (this.keys['d'] || this.keys['arrowright']) this.moveDir.add(right);

    const isMoving = this.moveDir.lengthSq() > 0.001;
    const speed = this.isRunning ? this.runSpeed : this.walkSpeed;

    if (isMoving) {
      this.moveDir.normalize();

      // Rotate cat to face movement direction
      const targetAngle = Math.atan2(this.moveDir.x, this.moveDir.z);
      let currentAngle = this.cat.rotation.y;
      let diff = targetAngle - currentAngle;
      // Normalize angle difference
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.cat.rotation.y += diff * 8 * dt;

      // Move cat
      this.cat.position.x += this.moveDir.x * speed * dt;
      this.cat.position.z += this.moveDir.z * speed * dt;

      // Animation state
      this.animator.setState(this.isRunning ? 'run' : 'walk');
    } else {
      this.animator.setState('idle');
    }

    // Gravity & jumping
    this.verticalVelocity += this.gravity * dt;
    this.cat.position.y += this.verticalVelocity * dt;

    const groundHeight = this.getTerrainHeight(this.cat.position.x, this.cat.position.z);
    if (this.cat.position.y <= groundHeight) {
      this.cat.position.y = groundHeight;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    // Keep cat in world bounds
    const bounds = 295;
    this.cat.position.x = Math.max(-bounds, Math.min(bounds, this.cat.position.x));
    this.cat.position.z = Math.max(-bounds, Math.min(bounds, this.cat.position.z));

    // Update animation
    this.animator.update(dt);

    // Update camera
    this.updateCamera(dt);
  }

  updateCamera(dt) {
    const catPos = this.cat.position;

    // Camera orbits around cat
    const camX = catPos.x + Math.sin(this.cameraAngleX) * this.cameraDistance;
    const camZ = catPos.z + Math.cos(this.cameraAngleX) * this.cameraDistance;
    const camY = catPos.y + this.cameraHeight + Math.sin(this.cameraAngleY) * this.cameraDistance * 0.5;

    // Smooth camera follow
    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 6 * dt);

    // Look at cat
    this.cameraTarget.lerp(
      new THREE.Vector3(catPos.x, catPos.y + 0.5, catPos.z),
      8 * dt
    );
    this.camera.lookAt(this.cameraTarget);
  }
}
