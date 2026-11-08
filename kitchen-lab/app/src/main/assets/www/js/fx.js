// Particles (flour, sugar, droplets, steam) and liquid streams.
import * as THREE from 'three';

export class Particles {
  constructor(scene, { max = 600, map, color = 0xffffff, blending = THREE.NormalBlending, gravity = -1.2, drag = 0.5, depthWrite = false, opacity = 1 }) {
    this.max = max; this.gravity = gravity; this.drag = drag; this.floor = null;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max); this.maxLife = new Float32Array(max);
    this.s0 = new Float32Array(max); this.s1 = new Float32Array(max); this.a0 = new Float32Array(max);
    this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: map }, color: { value: new THREE.Color(color) }, uScale: { value: 400 }, uOpacity: { value: opacity } },
      vertexShader: `attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
        void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = aSize * uScale / max(0.05, -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 color; uniform float uOpacity; varying float vA;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vA * uOpacity; if(a < 0.01) discard;
          gl_FragColor = vec4(color * t.rgb, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite, blending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false; this.points.renderOrder = 5;
    scene.add(this.points);
    this.cursor = 0;
  }
  emit(p, v, { life = 1, size = 0.01, size1 = null, alpha = 1 } = {}) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.max;
    this.pos.set([p.x, p.y, p.z], i * 3); this.vel.set([v.x, v.y, v.z], i * 3);
    this.life[i] = life; this.maxLife[i] = life; this.s0[i] = size; this.s1[i] = size1 ?? size; this.a0[i] = alpha;
  }
  update(dt) {
    let alive = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      alive++;
      this.life[i] -= dt;
      const k = 1 - this.life[i] / this.maxLife[i];
      const j = i * 3;
      this.vel[j + 1] += this.gravity * dt;
      const d = Math.exp(-this.drag * dt);
      this.vel[j] *= d; this.vel[j + 1] *= d; this.vel[j + 2] *= d;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      if (this.floor) {
        const fy = this.floor(this.pos[j], this.pos[j + 2]);
        if (fy !== null && this.pos[j + 1] < fy && this.vel[j + 1] < 0) { this.life[i] = 0; this.alpha[i] = 0; if (this.onLand) this.onLand(this.pos[j], fy, this.pos[j + 2]); continue; }
      }
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * k;
      this.alpha[i] = this.a0[i] * Math.min(1, (1 - k) * 3) * Math.min(1, k * 12 + 0.2);
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = g.attributes.aSize.needsUpdate = g.attributes.aAlpha.needsUpdate = true;
    this.alive = alive;
  }
  setScale(h) { this.mat.uniforms.uScale.value = h * 0.9; }
}

// A pouring stream: tube along a falling curve from spout to target
export class Stream {
  constructor(scene, mat, radius = 0.004) {
    this.mat = mat; this.radius = radius; this.mesh = null; this.scene = scene; this.t = 0;
  }
  set(from, to, k = 1, wob = 0.002) {
    if (k <= 0.01) { this.hide(); return; }
    this.t += 0.016;
    const mid = new THREE.Vector3((from.x * 0.7 + to.x * 0.3) + Math.sin(this.t * 13) * wob, from.y + 0.004, (from.z * 0.7 + to.z * 0.3) + Math.cos(this.t * 11) * wob);
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const geo = new THREE.TubeGeometry(curve, 24, this.radius * (0.4 + 0.6 * k), 10, false);
    // taper toward the bottom slightly, thinner at spout
    const p = geo.attributes.position;
    if (this.mesh) { this.mesh.geometry.dispose(); this.mesh.geometry = geo; }
    else { this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.castShadow = false; this.scene.add(this.mesh); }
    this.mesh.visible = true;
    return p;
  }
  hide() { if (this.mesh) this.mesh.visible = false; }
}
