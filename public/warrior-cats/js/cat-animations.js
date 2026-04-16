// Animations for GLB cat model — uses Three.js AnimationMixer with embedded clips
import * as THREE from 'three';

export class CatAnimator {
  constructor(catGroup) {
    this.cat = catGroup;
    this.state = 'idle';
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    this._setup();
  }

  _setup() {
    const model = this.cat.userData.model;
    const clips = this.cat.userData.clips;
    if (!model || !clips || clips.length === 0) return;

    this.mixer = new THREE.AnimationMixer(model);

    // This model only has one real animation clip ("Armature|ArmatureAction")
    // Use it for all states — the cat will at least animate instead of T-posing
    const mainClip = clips.find(c => c.name.includes('ArmatureAction')) || clips[0];
    if (mainClip) {
      const action = this.mixer.clipAction(mainClip);
      action.setLoop(THREE.LoopRepeat);
      action.play();
      this.currentAction = action;
      // Point all states to the same action
      this.actions.idle = action;
      this.actions.walk = action;
      this.actions.run = action;
      this.actions.sit = action;
      this.actions.jump = action;
      this.actions.attack = action;
      this.actions.death = action;
    }
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    // Single-clip model — nothing to crossfade
  }

  update(dt) {
    if (this.mixer) {
      this.mixer.update(dt);
    }
  }
}
