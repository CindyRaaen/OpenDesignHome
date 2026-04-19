/**
 * CameraAnimator — Smooth camera path animation and recording
 *
 * Handles:
 * - Playback of predefined cinematic paths
 * - Smooth interpolation between keyframes
 * - Recording of custom paths
 * - Dynamic path generation from room/furniture data
 */

export class CameraAnimator {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.isAnimating = false;
    this.recordedKeyframes = [];
    this.isRecording = false;
    this.lastRecordTime = 0;
    this.recordInterval = 100; // ms between recorded frames
  }

  /**
   * Easing functions for smooth interpolation
   */
  static easeInOutCubic(t) {
    // t is [0, 1]
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  static easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  /**
   * Linear interpolation between two vectors
   */
  static lerp3(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }

  /**
   * Play a camera path with smooth interpolation
   * @param {Array} keyframes - Array of {position, target, duration}
   * @param {Function} onComplete - Callback when animation finishes
   * @param {Function} onProgress - Callback with progress 0-1
   */
  playPath(keyframes, onComplete, onProgress) {
    if (!keyframes || keyframes.length === 0) {
      console.warn('No keyframes to play');
      return;
    }

    this.isAnimating = true;
    let currentKeyframeIndex = 0;
    let keyframeStartTime = Date.now();
    let overallStartTime = Date.now();
    const totalDuration = keyframes.reduce((sum, kf) => sum + (kf.duration || 0), 0);

    const animate = () => {
      if (!this.isAnimating) return;

      const now = Date.now();
      const elapsed = now - keyframeStartTime;
      const currentKeyframe = keyframes[currentKeyframeIndex];

      if (!currentKeyframe) {
        this.isAnimating = false;
        if (onComplete) onComplete();
        return;
      }

      const duration = currentKeyframe.duration || 1000;
      let progress = Math.min(elapsed / duration, 1);

      // Easing
      const eased = this.easeInOutCubic(progress);

      // Get next keyframe for interpolation
      const nextKeyframe = keyframes[currentKeyframeIndex + 1];
      if (nextKeyframe) {
        // Interpolate between current and next
        const newPos = this.lerp3(
          currentKeyframe.position,
          nextKeyframe.position,
          eased
        );
        const newTarget = this.lerp3(
          currentKeyframe.target,
          nextKeyframe.target,
          eased
        );

        this.camera.position.set(newPos.x, newPos.y, newPos.z);
        this.controls.target.set(newTarget.x, newTarget.y, newTarget.z);
        this.controls.update();
      }

      // Keyframe transition
      if (progress >= 1) {
        currentKeyframeIndex++;
        keyframeStartTime = now;
        if (currentKeyframeIndex >= keyframes.length) {
          this.isAnimating = false;
          if (onComplete) onComplete();
          return;
        }
      }

      // Overall progress callback
      if (onProgress) {
        const overallElapsed = now - overallStartTime;
        onProgress(Math.min(overallElapsed / totalDuration, 1));
      }

      requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Smooth animation to a single position/target
   * @param {Object} position - {x, y, z}
   * @param {Object} target - {x, y, z}
   * @param {Number} duration - milliseconds
   * @param {String} easing - 'easeInOutCubic', 'easeOutQuart', etc.
   * @param {Function} onComplete
   */
  animateTo(position, target, duration = 2000, easing = 'easeInOutCubic', onComplete) {
    const startPos = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
    const startTarget = { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z };

    const easingFn = this.constructor[easing] || this.constructor.easeInOutCubic;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easingFn(progress);

      const newPos = this.lerp3(startPos, position, eased);
      const newTarget = this.lerp3(startTarget, target, eased);

      this.camera.position.set(newPos.x, newPos.y, newPos.z);
      this.controls.target.set(newTarget.x, newTarget.y, newTarget.z);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };

    animate();
  }

  /**
   * Start recording camera movement
   */
  startRecording() {
    this.recordedKeyframes = [];
    this.isRecording = true;
    this.lastRecordTime = Date.now();
  }

  /**
   * Record current camera position/target (called periodically)
   */
  recordFrame() {
    if (!this.isRecording) return;

    const now = Date.now();
    if (now - this.lastRecordTime < this.recordInterval) return;

    this.recordedKeyframes.push({
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      target: {
        x: this.controls.target.x,
        y: this.controls.target.y,
        z: this.controls.target.z,
      },
      duration: this.recordInterval,
    });

    this.lastRecordTime = now;
  }

  /**
   * Stop recording and return keyframes
   * @returns {Array} Keyframes array
   */
  stopRecording() {
    this.isRecording = false;
    return this.recordedKeyframes;
  }

  /**
   * Clear animation
   */
  stop() {
    this.isAnimating = false;
  }

  /**
   * Generate a grand tour path from room dimensions and furniture
   * @param {Object} roomDims - {width, depth, height}
   * @param {Array} furnitureItems - Array of furniture with position/size
   * @returns {Array} Keyframes
   */
  static generateGrandTour(roomDims, furnitureItems = []) {
    const w = roomDims.width || 10;
    const d = roomDims.depth || 10;
    const h = roomDims.height || 3;

    // Calculate center
    const cx = w / 2;
    const cz = d / 2;

    const keyframes = [
      // High wide shot from corner
      {
        position: { x: -w * 0.4, y: h * 0.7, z: -d * 0.4 },
        target: { x: cx, y: h * 0.3, z: cz },
        duration: 3000,
      },
      // Move to opposite corner
      {
        position: { x: w * 0.4, y: h * 0.6, z: d * 0.4 },
        target: { x: cx, y: h * 0.2, z: cz },
        duration: 4000,
      },
      // Top-down view rotating
      {
        position: { x: -w * 0.3, y: h * 0.8, z: 0 },
        target: { x: cx, y: 0, z: cz },
        duration: 3000,
      },
      // Return to center from above
      {
        position: { x: 0, y: h * 1.2, z: 0.1 },
        target: { x: cx, y: h * 0.3, z: cz },
        duration: 3000,
      },
    ];

    return keyframes;
  }

  /**
   * Generate a walkthrough at eye level
   * @param {Object} roomDims - {width, depth, height}
   * @returns {Array} Keyframes
   */
  static generateWalkthrough(roomDims) {
    const w = roomDims.width || 10;
    const d = roomDims.depth || 10;
    const eyeHeight = 1.7; // Standing eye level

    const keyframes = [
      // Start at entrance, looking in
      {
        position: { x: -w * 0.3, y: eyeHeight, z: 0 },
        target: { x: w * 0.2, y: eyeHeight - 0.5, z: 0 },
        duration: 3000,
      },
      // Walk to center
      {
        position: { x: 0, y: eyeHeight, z: -d * 0.2 },
        target: { x: 0, y: eyeHeight - 0.3, z: d * 0.3 },
        duration: 4000,
      },
      // Move left side
      {
        position: { x: -w * 0.35, y: eyeHeight, z: d * 0.3 },
        target: { x: -w * 0.1, y: eyeHeight - 0.2, z: d * 0.1 },
        duration: 3000,
      },
      // Move right side
      {
        position: { x: w * 0.35, y: eyeHeight, z: d * 0.2 },
        target: { x: w * 0.1, y: eyeHeight - 0.2, z: -d * 0.1 },
        duration: 3000,
      },
      // Return to center
      {
        position: { x: 0, y: eyeHeight, z: 0 },
        target: { x: 0, y: eyeHeight, z: d * 0.2 },
        duration: 2000,
      },
    ];

    return keyframes;
  }

  /**
   * Generate a slow 360° rotation from above
   * @param {Object} roomDims - {width, depth, height}
   * @returns {Array} Keyframes
   */
  static generateBirdsEye(roomDims) {
    const w = roomDims.width || 10;
    const d = roomDims.depth || 10;
    const h = roomDims.height || 3;
    const cx = w / 2;
    const cz = d / 2;
    const radius = Math.max(w, d) * 0.6;
    const height = h * 0.9;

    const keyframes = [];
    const steps = 12; // 12 steps = 30° increments
    const stepDuration = 1250; // 15 seconds total

    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const z = cz + Math.sin(angle) * radius;

      keyframes.push({
        position: { x, y: height, z },
        target: { x: cx, y: h * 0.2, z: cz },
        duration: stepDuration,
      });
    }

    // Return to start
    keyframes.push({
      position: { x: cx + radius, y: height, z: cz },
      target: { x: cx, y: h * 0.2, z: cz },
      duration: stepDuration,
    });

    return keyframes;
  }

  /**
   * Generate detail focus paths for specific furniture
   * @param {Array} furnitureItems - Array of {position, size, name}
   * @returns {Array} Keyframes
   */
  static generateDetailFocus(furnitureItems) {
    if (!furnitureItems || furnitureItems.length === 0) {
      // Fallback if no furniture
      return [
        { position: { x: 0, y: 1.5, z: 2 }, target: { x: 0, y: 0.5, z: 0 }, duration: 3000 },
      ];
    }

    const keyframes = [];

    // Visit each piece of furniture
    furnitureItems.slice(0, 5).forEach((item, idx) => {
      const px = item.position?.x || 0;
      const pz = item.position?.z || 0;
      const size = item.size || 1;

      // Approach from angle
      const angle = (idx / 5) * Math.PI * 2;
      const distance = Math.max(size * 1.5, 1);

      keyframes.push({
        position: {
          x: px + Math.cos(angle) * distance,
          y: Math.max(size * 0.8, 1),
          z: pz + Math.sin(angle) * distance,
        },
        target: {
          x: px,
          y: size * 0.5,
          z: pz,
        },
        duration: 3500,
      });
    });

    return keyframes;
  }

  /**
   * Convert recorded keyframes into a smooth path
   * @param {Array} rawFrames - Raw recorded frames
   * @param {Number} smoothingFactor - How much to compress (default 5 = take every 5th frame)
   * @returns {Array} Smoothed keyframes
   */
  static smoothKeyframes(rawFrames, smoothingFactor = 5) {
    if (rawFrames.length < 2) return rawFrames;

    const smoothed = [];
    for (let i = 0; i < rawFrames.length; i += smoothingFactor) {
      smoothed.push({
        ...rawFrames[i],
        duration: rawFrames[i].duration * smoothingFactor,
      });
    }

    // Ensure we include the last frame
    if (smoothed[smoothed.length - 1] !== rawFrames[rawFrames.length - 1]) {
      smoothed.push(rawFrames[rawFrames.length - 1]);
    }

    return smoothed;
  }
}
