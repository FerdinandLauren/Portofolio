/**
 * Systems Analyst Desk — Three.js scene module.
 * Exports createDesk({ canvas, reduceMotion }) → desk controller API.
 * Builds procedural desk geometry, lights, camera, raycasting, parallax,
 * object focus, and lamp toggle.  No DOM coupling beyond the canvas.
 */
import * as THREE from 'three';

const CAM_DAMP = 4.2;           // camera smoothing
const PARALLAX = 0.5;           // overview parallax amplitude
const POINTER_DAMP = 5.0;       // pointer smoothing

export function createDesk({ canvas, reduceMotion = false }) {
  /* ---- renderer ---- */
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  /* ---- scene ---- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a201d);
  scene.fog = new THREE.Fog(0x1a201d, 10, 42);

  /* ---- camera ---- */
  const camera = new THREE.PerspectiveCamera(42, 1, 0.2, 80);
  camera.position.set(4.8, 3.1, 7.2);
  camera.lookAt(0, 1.0, 0);

  /* ---- lights ---- */
  const hemi = new THREE.HemisphereLight(0x4a6040, 0x1a2018, 0.9);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff4e2, 2.8);
  key.position.set(5, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.00045;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x566a64, 0.8);
  fill.position.set(-4, 3, -2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x8ab896, 1.5);
  rim.position.set(-6, 5, 7);
  scene.add(rim);

  const lampLight = new THREE.SpotLight(0xffc98a, 0, 8, 0.7, 0.72, 0);
  lampLight.position.set(1.76, 1.80, -0.65);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.bias = -0.0005;
  lampLight.target.position.set(0.15, 0.96, -0.1);
  scene.add(lampLight);
  scene.add(lampLight.target);

  /* ---- materials ---- */
  const matWood = new THREE.MeshStandardMaterial({ color: 0x6b462a, roughness: 0.5, metalness: 0.05 });
  const matWoodDark = new THREE.MeshStandardMaterial({ color: 0x4a301d, roughness: 0.55, metalness: 0.05 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x1c1e1c, roughness: 0.35, metalness: 0.75 });
  const matMetal2 = new THREE.MeshStandardMaterial({ color: 0x2a2d2b, roughness: 0.4, metalness: 0.6 });
  const matPaper = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.9, metalness: 0 });
  const matFolder = new THREE.MeshStandardMaterial({ color: 0xcdb88a, roughness: 0.8, metalness: 0 });
  const matCover = new THREE.MeshStandardMaterial({ color: 0x1f4d33, roughness: 0.7, metalness: 0 });
  const matKey = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5, metalness: 0.2 });
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x0b0d0b, roughness: 0.95, metalness: 0 });
  const matBulb = new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffc98a, emissiveIntensity: 0.1 });

  /* ---- screen texture ---- */
  const cnv = document.createElement('canvas'); cnv.width = 1024; cnv.height = 576;
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = '#0c1512'; ctx.fillRect(0, 0, 1024, 576);
  ctx.fillStyle = '#d8f26a'; ctx.font = '600 56px ui-sans-serif, system-ui, sans-serif'; ctx.fillText('FERDINAND LAUREN', 68, 172);
  ctx.fillStyle = '#8a9c90'; ctx.font = '40px ui-monospace, monospace'; ctx.fillText('Systems Analyst Desk', 68, 248);
  ctx.strokeStyle = 'rgba(216,242,106,0.10)'; ctx.lineWidth = 2;
  for (let x = 0; x <= 1024; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 576); ctx.stroke(); }
  for (let y = 0; y <= 576; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
  const screenTex = new THREE.CanvasTexture(cnv);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const matScreen = new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.1 });

  /* ---- desk group ---- */
  const group = new THREE.Group();
  scene.add(group);

  /* floor */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), matFloor);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.001;
  floor.receiveShadow = true;
  scene.add(floor);

  /* desk top */
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.7), matWood);
  deskTop.position.y = 0.9;
  deskTop.castShadow = true; deskTop.receiveShadow = true;
  group.add(deskTop);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(3.66, 0.05, 1.76), matWoodDark);
  trim.position.y = 0.865;
  group.add(trim);

  /* legs */
  for (const [x, z] of [[-1.62, 0.68], [1.62, 0.68], [-1.62, -0.68], [1.62, -0.68]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), matMetal);
    leg.position.set(x, 0.425, z);
    leg.castShadow = true; leg.receiveShadow = true;
    group.add(leg);
  }

  /* ---- monitor ---- */
  // Group origin sits on the desk surface (y = 0.96). Children use local Y above it.
  const monitor = new THREE.Group();
  monitor.position.set(0, 0.96, -0.55);
  const mBase = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.2), matMetal);
  mBase.position.y = 0.015;
  mBase.castShadow = true; mBase.receiveShadow = true;
  monitor.add(mBase);
  const mStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.28, 24), matMetal);
  mStand.position.y = 0.17;
  mStand.castShadow = true;
  monitor.add(mStand);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.68, 0.05), matMetal2);
  bezel.position.y = 0.65; bezel.castShadow = true; bezel.receiveShadow = true;
  monitor.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.58), matScreen);
  screen.position.set(0, 0.65, 0.028);
  monitor.add(screen);
  group.add(monitor);

  /* ---- notebook ---- */
  const notebook = new THREE.Group();
  notebook.position.set(-1.15, 0.96, -0.08);
  notebook.rotation.y = -0.28;
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.36), matCover);
  cover.position.y = 0.015; cover.castShadow = true; cover.receiveShadow = true;
  notebook.add(cover);
  const nbPages = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.32), matPaper);
  nbPages.position.set(0.01, 0.04, 0);
  nbPages.receiveShadow = true;
  notebook.add(nbPages);
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 20), matMetal);
    r.rotation.y = Math.PI / 2; r.position.set(-0.24, 0.035, -0.13 + i * 0.09);
    notebook.add(r);
  }
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 8), matMetal2);
  pen.rotation.z = Math.PI / 2; pen.position.set(0.28, 0.05, 0.1);
  notebook.add(pen);
  group.add(notebook);

  /* ---- folder ---- */
  const folder = new THREE.Group();
  folder.position.set(1.05, 0.96, 0.08);
  folder.rotation.y = 0.2;
  const fback = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.44), matFolder);
  fback.position.y = 0.01; fback.castShadow = true; fback.receiveShadow = true;
  folder.add(fback);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.22), matFolder);
  flap.position.set(0, 0.03, -0.14); flap.rotation.x = -0.12;
  folder.add(flap);
  const fPaperA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.008, 0.36), matPaper);
  fPaperA.position.set(0.02, 0.032, 0.02);
  folder.add(fPaperA);
  const fPaperB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.008, 0.36), matPaper);
  fPaperB.position.set(-0.03, 0.042, 0);
  folder.add(fPaperB);
  const fTab = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.06), matFolder);
  fTab.position.set(0.2, 0.025, -0.2);
  folder.add(fTab);
  group.add(folder);

  /* ---- clipboard ---- */
  const clipboard = new THREE.Group();
  clipboard.position.set(-1.15, 0.96, 0.55);
  const cboard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.55), matWoodDark);
  cboard.position.y = 0.01;
  cboard.castShadow = true; cboard.receiveShadow = true;
  clipboard.add(cboard);
  const cSheet = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.006, 0.48), matPaper);
  cSheet.position.y = 0.025;
  cSheet.receiveShadow = true;
  clipboard.add(cSheet);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.16), matMetal2);
  clip.position.set(0, 0.05, -0.24);
  clipboard.add(clip);
  group.add(clipboard);

  /* ---- lamp ---- */
  const lamp = new THREE.Group();
  lamp.position.set(1.42, 0.96, -0.4);
  const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.05, 24), matMetal2);
  lBase.position.y = 0.025;
  lBase.castShadow = true; lBase.receiveShadow = true;
  lamp.add(lBase);
  const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.95, 16), matMetal2);
  lArm.position.set(0.1, 0.5, 0); lArm.rotation.z = -0.25;
  lamp.add(lArm);
  const lNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.35, 16), matMetal2);
  lNeck.position.set(0.3, 0.92, -0.03); lNeck.rotation.x = 1.2;
  lamp.add(lNeck);

  // lamp head + bulb
  const lHead = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 24), matMetal2);
  lHead.position.set(0.34, 0.92, -0.17);
  lHead.rotation.x = -1.6;
  lamp.add(lHead);
  const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), matBulb);
  bulbMesh.position.set(0.34, 0.84, -0.25);
  lamp.add(bulbMesh);
  group.add(lamp);

  /* ---- keyboard ---- */
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.3), matKey);
  keyboard.position.set(0, 0.975, 0.38);
  keyboard.castShadow = true; keyboard.receiveShadow = true;
  group.add(keyboard);
  const keys = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.012, 0.25), new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 0.6 }));
  keys.position.set(0, 0.986, 0.38);
  group.add(keys);

  /* ---- mouse ---- */
  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.07), matKey);
  mouse.position.set(0.58, 0.978, 0.42);
  mouse.rotation.y = 0.2;
  mouse.castShadow = true;
  group.add(mouse);

  /* ---- contact card ---- */
  const card = new THREE.Group();
  card.position.set(1.05, 0.964, 0.62);
  card.rotation.y = -0.12;
  const cardBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.14), matPaper);
  cardBody.castShadow = true; cardBody.receiveShadow = true;
  card.add(cardBody);
  group.add(card);

  /* ---- interactable tags ---- */
  const interactables = [monitor, notebook, folder, clipboard, lamp, card];
  monitor.userData = { id: 'monitor', panelId: 'about', hint: 'Open the intro' };
  notebook.userData = { id: 'notebook', panelId: 'approach', hint: 'Explore how I think' };
  folder.userData = { id: 'folder', panelId: 'projects', hint: 'Open the case file' };
  clipboard.userData = { id: 'clipboard', panelId: 'lab', hint: 'Try the Decision Lab' };
  lamp.userData = { id: 'lamp', panelId: null, hint: 'Toggle the lamp' };
  card.userData = { id: 'card', panelId: 'contact', hint: 'Get in touch' };

  for (const o of interactables) {
    o.traverse(c => { if (c.isMesh) { c.userData.groupId = o.userData.id; c.userData.interactive = true; } });
  }
  const targets = interactables.flatMap(o => {
    const meshes = [];
    o.traverse(c => { if (c.isMesh) meshes.push(c); });
    return meshes;
  });

  /* ---- camera director (responsive overview frames) ---- */
  const frames = {
    wide:   { pos: new THREE.Vector3(4.8, 3.1, 7.2),  look: new THREE.Vector3(0, 1.0, 0),  fov: 42 },
    medium: { pos: new THREE.Vector3(4.6, 3.15, 8.4), look: new THREE.Vector3(0, 1.05, 0), fov: 46 },
    narrow: { pos: new THREE.Vector3(3.0, 3.4, 9.6),  look: new THREE.Vector3(0, 1.05, 0), fov: 54 },
  };
  let overview = frames.wide;
  let sized = false;
  function pickFrame(w, h) {
    const a = w / h;
    if (a >= 1.45) return frames.wide;
    if (a >= 1.0) return frames.medium;
    return frames.narrow;
  }
  const focusPoses = {
    monitor:   { pos: new THREE.Vector3(1.4, 2.1, 3.4),   look: new THREE.Vector3(0, 1.55, -0.55) },
    notebook:  { pos: new THREE.Vector3(-2.8, 1.85, 2.9), look: new THREE.Vector3(-1.15, 0.99, -0.08) },
    folder:    { pos: new THREE.Vector3(2.8, 1.85, 3.2),  look: new THREE.Vector3(1.05, 0.99, 0.08) },
    clipboard: { pos: new THREE.Vector3(-2.8, 1.9, 3.0),  look: new THREE.Vector3(-1.15, 0.98, 0.55) },
    lamp:      { pos: new THREE.Vector3(2.5, 2.2, 3.3),   look: new THREE.Vector3(1.42, 1.4, -0.4) },
    card:      { pos: new THREE.Vector3(2.4, 1.7, 3.6),   look: new THREE.Vector3(1.05, 0.97, 0.62) },
  };
  const curPos = overview.pos.clone();
  const curLook = overview.look.clone();

  let focusId = null;
  function focus(id) {
    focusId = id || null;
    if (reduceMotion && focusId) {
      const t = focusPoses[focusId];
      curPos.copy(t.pos); curLook.copy(t.look);
      camera.position.copy(curPos); camera.lookAt(curLook);
    }
  }
  function resetView() { focus(null); }

  /* ---- lamp ---- */
  let lampOn = false;
  let lampTarget = 0, bulbTarget = 0.1;
  function toggleLamp() {
    lampOn = !lampOn;
    lampTarget = lampOn ? 12 : 0;
    bulbTarget = lampOn ? 2.2 : 0.1;
    return lampOn;
  }

  /* ---- pointer ---- */
  const pointerTarget = new THREE.Vector2();
  const pointerSmooth = new THREE.Vector2();
  let downPos = null;

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;

  function pick(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((cx - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(targets, false);
    return hits[0] ? hits[0].object.userData.groupId : null;
  }

  const byId = Object.fromEntries(interactables.map(o => [o.userData.id, o]));

  if (!reduceMotion) {
    canvas.addEventListener('pointermove', e => {
      const rect = canvas.getBoundingClientRect();
      pointerTarget.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const id = pick(e.clientX, e.clientY);
      const obj = id ? byId[id] : null;
      if (obj !== hovered) { hovered = obj; _onHover?.(obj); }
    });
  } else {
    canvas.addEventListener('pointermove', e => {
      const id = pick(e.clientX, e.clientY);
      const obj = id ? byId[id] : null;
      if (obj !== hovered) { hovered = obj; _onHover?.(obj); }
    });
  }

  canvas.addEventListener('pointerdown', e => { downPos = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => {
    if (!downPos) return;
    if (Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) < 8) {
      const id = pick(e.clientX, e.clientY);
      if (id) {
        const obj = byId[id];
        if (obj.userData.id === 'lamp') toggleLamp();
        else _onSelect?.(obj);
      }
    }
    downPos = null;
  });

  /* ---- callbacks ---- */
  let _onHover = null, _onSelect = null, _onPointer = null;
  function onHover(cb) { _onHover = cb; }
  function onSelect(cb) { _onSelect = cb; }
  function onPointer(cb) { _onPointer = cb; }

  /* ---- animation loop ---- */
  const clock = new THREE.Clock();
  function animate() {
    const dt = Math.min(clock.getDelta(), 0.06);
    const k = reduceMotion ? 1 : 1 - Math.exp(-CAM_DAMP * dt);
    const target = focusId ? focusPoses[focusId] : overview;

    curPos.lerp(target.pos, k);
    curLook.lerp(target.look, k);

    if (!reduceMotion) {
      pointerSmooth.lerp(pointerTarget, 1 - Math.exp(-POINTER_DAMP * dt));
    }

    if (!focusId && !reduceMotion) {
      camera.position.set(
        curPos.x + pointerSmooth.x * PARALLAX,
        curPos.y + pointerSmooth.y * PARALLAX * 0.45,
        curPos.z,
      );
    } else {
      camera.position.copy(curPos);
    }
    camera.lookAt(curLook);

    // lamp
    lampLight.intensity += (lampTarget - lampLight.intensity) * k;
    matBulb.emissiveIntensity += (bulbTarget - matBulb.emissiveIntensity) * k;

    if (!reduceMotion) _onPointer?.(pointerSmooth.x, pointerSmooth.y);

    renderer.render(scene, camera);
  }

  /* ---- resize: real container dimensions, DPR, responsive frame ---- */
  function onResize() {
    const parent = canvas.parentElement;
    const w = canvas.clientWidth || parent?.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || parent?.clientHeight || window.innerHeight;
    if (w < 1 || h < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (renderer.getPixelRatio() !== dpr) renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    overview = pickFrame(w, h);
    camera.fov = overview.fov;
    camera.updateProjectionMatrix();
    if (!sized) {
      sized = true;
      curPos.copy(overview.pos);
      curLook.copy(overview.look);
      camera.position.copy(curPos);
      camera.lookAt(curLook);
    }
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => onResize()) : null;
  ro?.observe(canvas);
  if (canvas.parentElement) ro?.observe(canvas.parentElement);
  window.addEventListener('resize', onResize);
  onResize();

  renderer.setAnimationLoop(animate);

  /* ---- dispose ---- */
  function dispose() {
    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', onResize);
    ro?.disconnect();
    scene.traverse(o => {
      if (o.isMesh) { o.geometry?.dispose(); const m = o.material; if (Array.isArray(m)) m.forEach(x => x.dispose()); else m?.dispose(); }
    });
    screenTex.dispose();
    renderer.dispose();
  }

  /* ---- debug ---- */
  let _mcount = 0; scene.traverse(o => { if (o.isMesh) _mcount++; });

  return {
    focus, resetView, resize: onResize,
    onHover, onSelect, onPointer,
    toggleLamp, get isLampOn() { return lampOn; },
    dispose,
    _debug: {
      renderer, scene, camera, lampLight, reduceMotion, THREE,
      meshCount: () => _mcount,
      renderCalls: () => renderer.info.render.calls,
    },
  };
}