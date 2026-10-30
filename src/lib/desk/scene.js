/**
 * Systems Analyst Desk, Three.js scene module.
 * Exports createDesk({ canvas, reduceMotion }) → desk controller API.
 * Builds procedural desk geometry, lights, camera, raycasting, parallax,
 * object focus, and lamp toggle.  No DOM coupling beyond the canvas.
 */
import {
  WebGLRenderer, Scene, Color, Fog, PerspectiveCamera,
  HemisphereLight, DirectionalLight, SpotLight,
  MeshStandardMaterial, CanvasTexture,
  Group, Mesh, PlaneGeometry, BoxGeometry, CylinderGeometry,
  TorusGeometry, ConeGeometry, SphereGeometry,
  Vector2, Vector3, Raycaster,
  SRGBColorSpace, ACESFilmicToneMapping, PCFShadowMap,
} from 'three';

const PARALLAX = 0.5;           // overview parallax amplitude
const POINTER_DAMP = 5.0;       // pointer smoothing

export async function createDesk({ canvas, reduceMotion: motionPref = false }) {
  let reduceMotion = Boolean(motionPref);
  /* ---- renderer ---- */
  const renderer = new WebGLRenderer({
    canvas, antialias: true, powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  // The props and lights never move, so bake the shadow maps once instead of
  // re-rendering them every frame.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  /* ---- scene ---- */
  const scene = new Scene();
  scene.background = new Color(0x1a201d);
  scene.fog = new Fog(0x1a201d, 10, 42);

  /* ---- camera ---- */
  const camera = new PerspectiveCamera(42, 1, 0.2, 80);
  camera.position.set(4.8, 3.1, 7.2);
  camera.lookAt(0, 1.0, 0);

  /* ---- lights ---- */
  const hemi = new HemisphereLight(0x4a6040, 0x1a2018, 0.9);
  scene.add(hemi);

  const key = new DirectionalLight(0xfff4e2, 2.8);
  key.position.set(5, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.bias = -0.00045;
  scene.add(key);

  const fill = new DirectionalLight(0x566a64, 0.8);
  fill.position.set(-4, 3, -2);
  scene.add(fill);

  const rim = new DirectionalLight(0x8ab896, 1.5);
  rim.position.set(-6, 5, 7);
  scene.add(rim);

  const lampLight = new SpotLight(0xffc98a, 0, 8, 0.7, 0.72, 0);
  lampLight.position.set(0.70, 1.78, -0.44);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.bias = -0.0005;
  lampLight.target.position.set(0.05, 1.15, -0.5);
  // The lamp starts off, so keep its (zero-intensity) spot and shadow out of
  // the frame until it is switched on.
  lampLight.visible = false;
  scene.add(lampLight);
  scene.add(lampLight.target);

  /* ---- materials ---- */
  const matWood = new MeshStandardMaterial({ color: 0x6b462a, roughness: 0.5, metalness: 0.05 });
  const matWoodDark = new MeshStandardMaterial({ color: 0x4a301d, roughness: 0.55, metalness: 0.05 });
  const matMetal = new MeshStandardMaterial({ color: 0x1c1e1c, roughness: 0.35, metalness: 0.75 });
  const matMetal2 = new MeshStandardMaterial({ color: 0x2a2d2b, roughness: 0.4, metalness: 0.6 });
  const matPaper = new MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.9, metalness: 0 });
  const matFolder = new MeshStandardMaterial({ color: 0xcdb88a, roughness: 0.8, metalness: 0 });
  const matCover = new MeshStandardMaterial({ color: 0x1f4d33, roughness: 0.7, metalness: 0 });
  const matKey = new MeshStandardMaterial({ color: 0x15171a, roughness: 0.5, metalness: 0.2 });
  const matFloor = new MeshStandardMaterial({ color: 0x0b0d0b, roughness: 0.95, metalness: 0 });
  const matBulb = new MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffc98a, emissiveIntensity: 0.1 });

  /* ---- screen texture ---- */
  const cnv = document.createElement('canvas'); cnv.width = 1024; cnv.height = 576;
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = '#0c1512'; ctx.fillRect(0, 0, 1024, 576);
  ctx.fillStyle = '#d8f26a'; ctx.font = '600 56px ui-sans-serif, system-ui, sans-serif'; ctx.fillText('FERDINAND LAUREN', 68, 172);
  ctx.fillStyle = '#8a9c90'; ctx.font = '40px ui-monospace, monospace'; ctx.fillText('Systems Analyst Desk', 68, 248);
  ctx.strokeStyle = 'rgba(216,242,106,0.10)'; ctx.lineWidth = 2;
  for (let x = 0; x <= 1024; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 576); ctx.stroke(); }
  for (let y = 0; y <= 576; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
  const screenTex = new CanvasTexture(cnv);
  screenTex.colorSpace = SRGBColorSpace;
  screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const matScreen = new MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.1 });

  /* ---- blueprint texture: process nodes, no readable copy ---- */
  const bpc = document.createElement('canvas'); bpc.width = 1024; bpc.height = 640;
  const bc = bpc.getContext('2d');
  bc.fillStyle = '#efe9d9'; bc.fillRect(0, 0, 1024, 640);
  bc.strokeStyle = 'rgba(23,58,43,0.16)'; bc.lineWidth = 1;
  for (let x = 0; x <= 1024; x += 64) { bc.beginPath(); bc.moveTo(x, 0); bc.lineTo(x, 640); bc.stroke(); }
  for (let y = 0; y <= 640; y += 64) { bc.beginPath(); bc.moveTo(0, y); bc.lineTo(1024, y); bc.stroke(); }
  bc.strokeStyle = 'rgba(23,58,43,0.62)'; bc.lineWidth = 3;
  const nodes = [[128, 190], [330, 190], [532, 190], [734, 190], [734, 400], [512, 400], [290, 400]];
  bc.beginPath();
  nodes.forEach(([x, y], i) => { if (i === 0) bc.moveTo(x, y); else bc.lineTo(x, y); });
  bc.stroke();
  for (const [x, y] of nodes) {
    bc.fillStyle = '#efe9d9'; bc.fillRect(x - 42, y - 30, 84, 60);
    bc.strokeStyle = 'rgba(23,58,43,0.8)'; bc.lineWidth = 3;
    bc.strokeRect(x - 42, y - 30, 84, 60);
    bc.fillStyle = 'rgba(23,58,43,0.72)';
    for (let l = 0; l < 3; l++) bc.fillRect(x - 26, y - 13 + l * 13, l === 2 ? 30 : 52, 4);
  }
  // decision diamond
  bc.beginPath(); bc.moveTo(880, 370); bc.lineTo(944, 430); bc.lineTo(880, 490); bc.lineTo(816, 430); bc.closePath();
  bc.strokeStyle = 'rgba(180,89,42,0.8)'; bc.lineWidth = 3; bc.stroke();
  bc.beginPath(); bc.moveTo(734, 430); bc.lineTo(816, 430); bc.stroke();
  const blueprintTex = new CanvasTexture(bpc);
  blueprintTex.colorSpace = SRGBColorSpace;
  blueprintTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const matBlueprint = new MeshStandardMaterial({
    map: blueprintTex, emissive: 0xffffff, emissiveMap: blueprintTex,
    emissiveIntensity: 0.06, roughness: 0.9, metalness: 0,
  });

  /* ---- tablet texture: the AI bench ---- */
  const tbc = document.createElement('canvas'); tbc.width = 512; tbc.height = 340;
  const tc = tbc.getContext('2d');
  tc.fillStyle = '#0c1512'; tc.fillRect(0, 0, 512, 340);
  tc.fillStyle = '#d8f26a'; tc.font = '600 28px ui-monospace, monospace'; tc.fillText('AI WORKBENCH', 34, 74);
  tc.fillStyle = 'rgba(216,242,106,0.5)'; tc.font = '20px ui-monospace, monospace';
  tc.fillText('DRAFT  ->  REVIEW  ->  VERIFY', 34, 118);
  tc.strokeStyle = 'rgba(216,242,106,0.28)'; tc.lineWidth = 2;
  [160, 196, 232, 268].forEach((y, i) => {
    const w = [300, 240, 340, 200][i];
    tc.beginPath(); tc.moveTo(34, y); tc.lineTo(34 + w, y); tc.stroke();
  });
  tc.strokeStyle = 'rgba(255,255,255,0.12)';
  tc.strokeRect(18, 18, 476, 304);
  const tabletTex = new CanvasTexture(tbc);
  tabletTex.colorSpace = SRGBColorSpace;
  tabletTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const matTablet = new MeshStandardMaterial({
    map: tabletTex, emissive: 0xffffff, emissiveMap: tabletTex,
    emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.1,
  });

  /* ---- desk group ---- */
  const group = new Group();
  scene.add(group);

  /* floor */
  const floor = new Mesh(new PlaneGeometry(60, 60), matFloor);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.001;
  floor.receiveShadow = true;
  scene.add(floor);

  /* desk top */
  const deskTop = new Mesh(new BoxGeometry(3.6, 0.12, 1.7), matWood);
  deskTop.position.y = 0.9;
  deskTop.castShadow = true; deskTop.receiveShadow = true;
  group.add(deskTop);
  const trim = new Mesh(new BoxGeometry(3.66, 0.05, 1.76), matWoodDark);
  trim.position.y = 0.865;
  group.add(trim);

  /* legs */
  for (const [x, z] of [[-1.62, 0.68], [1.62, 0.68], [-1.62, -0.68], [1.62, -0.68]]) {
    const leg = new Mesh(new BoxGeometry(0.14, 0.85, 0.14), matMetal);
    leg.position.set(x, 0.425, z);
    leg.castShadow = true; leg.receiveShadow = true;
    group.add(leg);
  }

  /* ---- monitor ---- */
  // Group origin sits on the desk surface (y = 0.96). Children use local Y above it.
  const monitor = new Group();
  monitor.position.set(0, 0.96, -0.55);
  const mBase = new Mesh(new BoxGeometry(0.34, 0.03, 0.2), matMetal);
  mBase.position.y = 0.015;
  mBase.castShadow = true; mBase.receiveShadow = true;
  monitor.add(mBase);
  const mStand = new Mesh(new CylinderGeometry(0.03, 0.05, 0.28, 24), matMetal);
  mStand.position.y = 0.17;
  mStand.castShadow = true;
  monitor.add(mStand);
  const bezel = new Mesh(new BoxGeometry(1.12, 0.68, 0.05), matMetal2);
  bezel.position.y = 0.65; bezel.castShadow = true; bezel.receiveShadow = true;
  monitor.add(bezel);
  const screen = new Mesh(new PlaneGeometry(1.02, 0.58), matScreen);
  screen.position.set(0, 0.65, 0.028);
  monitor.add(screen);
  group.add(monitor);

  /* ---- notebook ---- */
  const notebook = new Group();
  notebook.position.set(-1.15, 0.96, -0.08);
  notebook.rotation.y = -0.28;
  const cover = new Mesh(new BoxGeometry(0.5, 0.03, 0.36), matCover);
  cover.position.y = 0.015; cover.castShadow = true; cover.receiveShadow = true;
  notebook.add(cover);
  const nbPages = new Mesh(new BoxGeometry(0.46, 0.02, 0.32), matPaper);
  nbPages.position.set(0.01, 0.04, 0);
  nbPages.receiveShadow = true;
  notebook.add(nbPages);
  for (let i = 0; i < 4; i++) {
    const r = new Mesh(new TorusGeometry(0.02, 0.006, 8, 20), matMetal);
    r.rotation.y = Math.PI / 2; r.position.set(-0.24, 0.035, -0.13 + i * 0.09);
    notebook.add(r);
  }
  const pen = new Mesh(new CylinderGeometry(0.008, 0.008, 0.24, 8), matMetal2);
  pen.rotation.z = Math.PI / 2; pen.position.set(0.28, 0.05, 0.1);
  notebook.add(pen);
  group.add(notebook);

  /* ---- folder ---- */
  const folder = new Group();
  folder.position.set(1.05, 0.96, 0.08);
  folder.rotation.y = 0.2;
  const fback = new Mesh(new BoxGeometry(0.62, 0.02, 0.44), matFolder);
  fback.position.y = 0.01; fback.castShadow = true; fback.receiveShadow = true;
  folder.add(fback);
  const flap = new Mesh(new BoxGeometry(0.62, 0.02, 0.22), matFolder);
  flap.position.set(0, 0.03, -0.14); flap.rotation.x = -0.12;
  folder.add(flap);
  const fPaperA = new Mesh(new BoxGeometry(0.5, 0.008, 0.36), matPaper);
  fPaperA.position.set(0.02, 0.032, 0.02);
  folder.add(fPaperA);
  const fPaperB = new Mesh(new BoxGeometry(0.5, 0.008, 0.36), matPaper);
  fPaperB.position.set(-0.03, 0.042, 0);
  folder.add(fPaperB);
  const fTab = new Mesh(new BoxGeometry(0.16, 0.02, 0.06), matFolder);
  fTab.position.set(0.2, 0.025, -0.2);
  folder.add(fTab);
  group.add(folder);

  /* ---- clipboard ---- */
  const clipboard = new Group();
  clipboard.position.set(-1.15, 0.96, 0.55);
  const cboard = new Mesh(new BoxGeometry(0.4, 0.02, 0.55), matWoodDark);
  cboard.position.y = 0.01;
  cboard.castShadow = true; cboard.receiveShadow = true;
  clipboard.add(cboard);
  const cSheet = new Mesh(new BoxGeometry(0.34, 0.006, 0.48), matPaper);
  cSheet.position.y = 0.025;
  cSheet.receiveShadow = true;
  clipboard.add(cSheet);
  const clip = new Mesh(new BoxGeometry(0.1, 0.04, 0.16), matMetal2);
  clip.position.set(0, 0.05, -0.24);
  clipboard.add(clip);
  group.add(clipboard);

  /* ---- blueprint sheet: the analysis scene ---- */
  const blueprint = new Group();
  blueprint.position.set(-0.62, 0.962, 0.31);
  blueprint.rotation.y = -0.07;
  const bpBack = new Mesh(new BoxGeometry(0.74, 0.012, 0.5), matPaper);
  bpBack.position.y = 0.006;
  bpBack.castShadow = true; bpBack.receiveShadow = true;
  blueprint.add(bpBack);
  const bpFace = new Mesh(new PlaneGeometry(0.68, 0.44), matBlueprint);
  bpFace.rotation.x = -Math.PI / 2;
  bpFace.position.y = 0.013;
  bpFace.receiveShadow = true;
  blueprint.add(bpFace);
  group.add(blueprint);

  /* ---- lamp ---- */
  const lamp = new Group();
  lamp.position.set(1.42, 0.96, -0.4);
  const lBase = new Mesh(new CylinderGeometry(0.13, 0.16, 0.05, 24), matMetal2);
  lBase.position.y = 0.025;
  lBase.castShadow = true; lBase.receiveShadow = true;
  lamp.add(lBase);
  const lArm = new Mesh(new CylinderGeometry(0.018, 0.018, 0.95, 16), matMetal2);
  lArm.position.set(-0.18, 0.5, 0); lArm.rotation.z = 0.4;
  lamp.add(lArm);
  const lNeck = new Mesh(new CylinderGeometry(0.016, 0.016, 0.3, 16), matMetal2);
  lNeck.position.set(-0.5, 0.92, -0.03); lNeck.rotation.z = Math.PI / 2;
  lamp.add(lNeck);

  // lamp head + bulb, reaching left over the desk toward the monitor
  const lHead = new Mesh(new ConeGeometry(0.15, 0.24, 24), matMetal2);
  lHead.position.set(-0.72, 0.9, -0.04);
  lHead.rotation.z = -0.6; lHead.rotation.x = 0.25;
  lamp.add(lHead);
  const bulbMesh = new Mesh(new SphereGeometry(0.042, 12, 8), matBulb);
  bulbMesh.position.set(-0.72, 0.82, -0.04);
  lamp.add(bulbMesh);
  group.add(lamp);

  /* ---- keyboard ---- */
  const keyboard = new Mesh(new BoxGeometry(0.9, 0.03, 0.3), matKey);
  keyboard.position.set(0, 0.975, 0.38);
  keyboard.castShadow = true; keyboard.receiveShadow = true;
  group.add(keyboard);
  const keys = new Mesh(new BoxGeometry(0.84, 0.012, 0.25), new MeshStandardMaterial({ color: 0x0c0d0e, roughness: 0.6 }));
  keys.position.set(0, 0.986, 0.38);
  group.add(keys);

  /* ---- mouse ---- */
  const mouse = new Mesh(new BoxGeometry(0.12, 0.035, 0.07), matKey);
  mouse.position.set(0.58, 0.978, 0.42);
  mouse.rotation.y = 0.2;
  mouse.castShadow = true;
  group.add(mouse);

  /* ---- contact card ---- */
  const card = new Group();
  card.position.set(1.05, 0.964, 0.62);
  card.rotation.y = -0.12;
  const cardBody = new Mesh(new BoxGeometry(0.22, 0.008, 0.14), matPaper);
  cardBody.castShadow = true; cardBody.receiveShadow = true;
  card.add(cardBody);
  group.add(card);

  /* ---- secondary display: the AI workbench object ---- */
  const tablet = new Group();
  tablet.position.set(1.46, 0.962, 0.24);
  tablet.rotation.y = -0.5;
  const tBase = new Mesh(new BoxGeometry(0.24, 0.022, 0.15), matMetal2);
  tBase.position.y = 0.011;
  tBase.castShadow = true; tBase.receiveShadow = true;
  tablet.add(tBase);
  const tNeck = new Mesh(new BoxGeometry(0.045, 0.24, 0.045), matMetal);
  tNeck.position.y = 0.13;
  tNeck.castShadow = true;
  tablet.add(tNeck);
  const tHead = new Group();
  tHead.position.y = 0.33;
  tHead.rotation.x = -0.1;
  const tBody = new Mesh(new BoxGeometry(0.5, 0.34, 0.035), matMetal2);
  tBody.castShadow = true; tBody.receiveShadow = true;
  tHead.add(tBody);
  const tScreen = new Mesh(new PlaneGeometry(0.46, 0.3), matTablet);
  tScreen.position.z = 0.019;
  tHead.add(tScreen);
  tablet.add(tHead);
  group.add(tablet);

  /* ---- interactable tags ---- */
  const interactables = [monitor, notebook, folder, clipboard, blueprint, tablet, lamp, card];
  monitor.userData = { id: 'monitor', panelId: 'projects', hint: 'Open selected work' };
  notebook.userData = { id: 'notebook', panelId: 'about', hint: 'Read about the analyst' };
  folder.userData = { id: 'folder', panelId: 'projects', hint: 'Open the case files' };
  clipboard.userData = { id: 'clipboard', panelId: 'lab', hint: 'Walk the decision rules' };
  blueprint.userData = { id: 'blueprint', panelId: 'approach', hint: 'See how the analysis is structured' };
  tablet.userData = { id: 'tablet', panelId: 'ai', hint: 'Open the AI workbench' };
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

  /* ---- camera director: a scroll journey, framed per scene ---- */
  const poses = {
    desk:     { pos: new Vector3(4.8, 3.1, 7.2),   look: new Vector3(0, 1.0, 0),       fov: 42 },
    about:    { pos: new Vector3(-0.05, 1.58, 1.95), look: new Vector3(-0.75, 0.98, 0.0), fov: 42 },
    projects: { pos: new Vector3(-2.0, 1.95, 3.2), look: new Vector3(-0.72, 1.38, -0.42), fov: 42 },
    approach: { pos: new Vector3(1.0, 1.95, 3.0),   look: new Vector3(-0.55, 1.0, 0.32), fov: 41 },
    lab:      { pos: new Vector3(1.15, 1.95, 2.85), look: new Vector3(-0.42, 1.0, 0.36), fov: 40 },
    ai:       { pos: new Vector3(-0.4, 1.8, 2.75), look: new Vector3(0.95, 1.18, 0.24), fov: 42 },
    contact:  { pos: new Vector3(3.1, 2.3, 5.6),  look: new Vector3(0.0, 1.0, 0.1),  fov: 42 },
  };

  let journey = { from: 'desk', to: 'desk', t: 0 };

  // Camera poses are pure functions of the viewport fit; build them once per
  // resize instead of allocating fresh vectors on every frame.
  let poseCache = null;
  let needsRender = true;
  let idle = false;
  let paused = false;
  let running = false;
  let booted = false;
  let cap60 = false;
  let refreshDecided = false;
  const refreshSamples = [];
  let lastDraw = 0;

  // Pull the camera back on narrow viewports so the frame still reads.
  function viewFit() {
    const a = camera.aspect || 1;
    if (a >= 1.45) return { d: 1, fov: 0, lift: 0 };
    if (a >= 1.0) return { d: 1.16, fov: 5, lift: 0 };
    return { d: 1.44, fov: 11, lift: window.innerWidth <= 720 ? 1.5 : 0 };
  }
  function buildPoses() {
    const fit = viewFit();
    const built = {};
    for (const key of Object.keys(poses)) {
      const base = poses[key];
      const look = base.look.clone();
      look.y += fit.lift;
      const pos = look.clone().add(base.pos.clone().sub(base.look).multiplyScalar(fit.d));
      built[key] = { pos, look, fov: base.fov + fit.fov };
    }
    return built;
  }
  function poseFor(key) {
    if (!poseCache) poseCache = buildPoses();
    return poseCache[key] || poseCache.desk;
  }

  const curPos = poseFor('desk').pos.clone();
  const curLook = poseFor('desk').look.clone();
  let curFov = poseFor('desk').fov;

  function snapTo(p) {
    curPos.copy(p.pos); curLook.copy(p.look); curFov = p.fov;
    camera.position.copy(curPos); camera.lookAt(curLook);
    camera.fov = curFov; camera.updateProjectionMatrix();
  }

  function setScene(from, to, t) {
    journey = {
      from: poses[from] ? from : 'desk',
      to: poses[to] ? to : (poses[from] ? from : 'desk'),
      t: Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)),
    };
    if (reduceMotion) snapTo(poseFor(journey.to));
    wake();
  }
  function setReducedMotion(value) {
    reduceMotion = Boolean(value);
    if (reduceMotion) snapTo(poseFor('desk'));
    wake();
  }
  function focus(id) { setScene(id, id, 0); }
  function resetView() { setScene('desk', 'desk', 0); }

  /* ---- lamp ---- */
  let lampOn = false;
  let lampTarget = 0, bulbTarget = 0.1;
  function toggleLamp() {
    lampOn = !lampOn;
    if (lampOn) {
      lampLight.visible = true;
      lampTarget = 12;
      // Its shadow map was not baked while the lamp was hidden.
      renderer.shadowMap.needsUpdate = true;
    } else {
      lampTarget = 0;
    }
    bulbTarget = lampOn ? 2.2 : 0.1;
    wake();
    return lampOn;
  }

  /* ---- pointer ---- */
  const pointerTarget = new Vector2();
  const pointerSmooth = new Vector2();
  let downPos = null;

  const raycaster = new Raycaster();
  const ndc = new Vector2();
  let hovered = null;
  let pendingPick = null;
  let canvasRect = canvas.getBoundingClientRect();

  function pick(cx, cy) {
    // The render loop may be idle here, so make sure matrices are current.
    camera.updateMatrixWorld();
    const rect = canvasRect;
    ndc.x = ((cx - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(targets, false);
    return hits[0] ? hits[0].object.userData.groupId : null;
  }

  const byId = Object.fromEntries(interactables.map(o => [o.userData.id, o]));

  canvas.addEventListener('pointermove', e => {
    const rect = canvasRect;
    if (!reduceMotion) {
      pointerTarget.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
    }
    pendingPick = [e.clientX, e.clientY];
    wake();
  });

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
  let lastFrame = performance.now();
  const tmpPos = new Vector3();
  const tmpLook = new Vector3();

  function sceneWeight(key) {
    let w = 0;
    if (journey.from === key) w += 1 - journey.t;
    if (journey.to === key) w += journey.t;
    return w;
  }

  function animate() {
    const now = performance.now();
    const dt = Math.min((now - lastFrame) / 1000, 0.06);
    lastFrame = now;
    const k = reduceMotion ? 1 : 1 - Math.exp(-6.0 * dt);

    // On a high-refresh display, draw the desk at 60fps: the scroll layer stays
    // at the display rate, while the background no longer pays for 120 draws.
    if (!refreshDecided) {
      refreshSamples.push(dt * 1000);
      if (refreshSamples.length >= 30) {
        // The fastest fifth of frames reveals the panel rate even when the
        // first frames include startup hitches.
        const sorted = refreshSamples.slice().sort((x, y) => x - y);
        cap60 = sorted[Math.floor(sorted.length * 0.2)] < 9.5;
        refreshDecided = true;
      }
    }

    const a = poseFor(journey.from);
    const b = poseFor(journey.to);
    tmpPos.copy(a.pos).lerp(b.pos, journey.t);
    tmpLook.copy(a.look).lerp(b.look, journey.t);
    const targetFov = a.fov + (b.fov - a.fov) * journey.t;

    let moving = needsRender;
    needsRender = false;

    if (reduceMotion) {
      snapTo(b);
    } else {
      curPos.lerp(tmpPos, k);
      curLook.lerp(tmpLook, k);
      curFov += (targetFov - curFov) * k;

      // Settle exactly once the smoothing is below what a pixel can show,
      // so an idle desk can stop issuing draw calls.
      if (curPos.distanceToSquared(tmpPos) < 1e-6
          && curLook.distanceToSquared(tmpLook) < 1e-6
          && Math.abs(targetFov - curFov) < 1e-3) {
        curPos.copy(tmpPos); curLook.copy(tmpLook); curFov = targetFov;
      } else {
        moving = true;
      }

      if (Math.abs(camera.fov - curFov) > 0.001) {
        camera.fov = curFov;
        camera.updateProjectionMatrix();
      }

      pointerSmooth.lerp(pointerTarget, 1 - Math.exp(-POINTER_DAMP * dt));
      if (pointerSmooth.distanceToSquared(pointerTarget) < 1e-8) pointerSmooth.copy(pointerTarget);
      else moving = true;

      const atDesk = journey.from === 'desk' && journey.to === 'desk' && journey.t === 0;
      const amp = atDesk ? PARALLAX : PARALLAX * 0.16;
      camera.position.set(
        curPos.x + pointerSmooth.x * amp,
        curPos.y + pointerSmooth.y * amp * 0.45,
        curPos.z,
      );
      camera.lookAt(curLook);
      _onPointer?.(pointerSmooth.x, pointerSmooth.y);
    }

    // lamp
    if (Math.abs(lampTarget - lampLight.intensity) < 0.002) lampLight.intensity = lampTarget;
    else { lampLight.intensity += (lampTarget - lampLight.intensity) * k; moving = true; }
    if (Math.abs(bulbTarget - matBulb.emissiveIntensity) < 0.002) matBulb.emissiveIntensity = bulbTarget;
    else { matBulb.emissiveIntensity += (bulbTarget - matBulb.emissiveIntensity) * k; moving = true; }
    if (!lampOn && lampLight.visible && lampLight.intensity < 0.001) lampLight.visible = false;

    // objects wake up as their scene arrives
    const wDesk = sceneWeight('desk');
    const wProjects = sceneWeight('projects');
    const wAi = sceneWeight('ai');
    const wApproach = sceneWeight('approach') + sceneWeight('lab');
    const screenGoal = 0.06 + 0.62 * wDesk + 0.70 * wProjects;
    const tabletGoal = 0.5 + 0.7 * wAi;
    const blueprintGoal = 0.06 + 0.22 * Math.min(1, wApproach);
    if (Math.abs(screenGoal - matScreen.emissiveIntensity) < 0.002) matScreen.emissiveIntensity = screenGoal;
    else { matScreen.emissiveIntensity += (screenGoal - matScreen.emissiveIntensity) * k; moving = true; }
    if (Math.abs(tabletGoal - matTablet.emissiveIntensity) < 0.002) matTablet.emissiveIntensity = tabletGoal;
    else { matTablet.emissiveIntensity += (tabletGoal - matTablet.emissiveIntensity) * k; moving = true; }
    if (Math.abs(blueprintGoal - matBlueprint.emissiveIntensity) < 0.002) matBlueprint.emissiveIntensity = blueprintGoal;
    else { matBlueprint.emissiveIntensity += (blueprintGoal - matBlueprint.emissiveIntensity) * k; moving = true; }

    // Hover picking is limited to one raycast per frame.
    if (pendingPick) {
      const [px, py] = pendingPick;
      pendingPick = null;
      const id = pick(px, py);
      const obj = id ? byId[id] : null;
      if (obj !== hovered) { hovered = obj; _onHover?.(obj); }
    }

    if (moving) {
      if (!cap60 || now - lastDraw >= 15.5) {
        renderer.render(scene, camera);
        lastDraw = now;
      } else {
        // Keep the loop alive so the next display frame can draw.
        needsRender = true;
      }
    } else if (!idle) {
      idle = true;
      syncLoop();
    }
  }

  /* ---- resize: real container dimensions, DPR, responsive frame ---- */
  let sized = false;
  function onResize() {
    const parent = canvas.parentElement;
    const w = canvas.clientWidth || parent?.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || parent?.clientHeight || window.innerHeight;
    if (w < 1 || h < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (renderer.getPixelRatio() !== dpr) renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    canvasRect = canvas.getBoundingClientRect();
    poseCache = null;
    needsRender = true;
    lastDraw = 0;
    if (booted) wake();
    if (!sized) {
      sized = true;
      snapTo(poseFor('desk'));
    } else if (reduceMotion) {
      snapTo(poseFor('desk'));
    }
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => onResize()) : null;
  ro?.observe(canvas);
  if (canvas.parentElement) ro?.observe(canvas.parentElement);
  window.addEventListener('resize', onResize);
  onResize();

  // Compile both lamp states off the critical path so neither the first frame
  // nor the first lamp click stalls on shader compilation.
  try {
    await renderer.compileAsync(scene, camera);
    lampLight.visible = true;
    await renderer.compileAsync(scene, camera);
  } catch { /* compileAsync is best-effort */ }
  lampLight.visible = false;

  // Fully stop the loop once the desk settles: no rAF work at rest, and the
  // compositor can idle until something actually moves.
  function syncLoop() {
    const next = !document.hidden && !paused && !idle;
    if (next === running) return;
    running = next;
    renderer.setAnimationLoop(next ? animate : null);
  }
  function wake() {
    idle = false;
    needsRender = true;
    syncLoop();
  }
  function setPaused(value) {
    const next = Boolean(value);
    if (paused === next) return;
    paused = next;
    if (paused) syncLoop(); else wake();
  }
  function onVisibility() {
    if (document.hidden) syncLoop(); else wake();
  }
  document.addEventListener('visibilitychange', onVisibility);
  booted = true;
  wake();

  /* ---- dispose ---- */
  function dispose() {
    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    ro?.disconnect();
    scene.traverse(o => {
      if (o.isMesh) { o.geometry?.dispose(); const m = o.material; if (Array.isArray(m)) m.forEach(x => x.dispose()); else m?.dispose(); }
    });
    screenTex.dispose();
    blueprintTex.dispose();
    tabletTex.dispose();
    renderer.dispose();
  }

  /* ---- debug ---- */
  let _mcount = 0; scene.traverse(o => { if (o.isMesh) _mcount++; });

  return {
    focus, resetView, setScene, setReducedMotion, setPaused, resize: onResize,
    onHover, onSelect, onPointer,
    toggleLamp, get isLampOn() { return lampOn; },
    dispose,
    _debug: {
      renderer, scene, camera, lampLight, reduceMotion,
      meshCount: () => _mcount,
      renderCalls: () => renderer.info.render.calls,
      journey: () => ({ ...journey }),
      cap60: () => cap60,
      lampVisible: () => lampLight.visible,
    },
  };
}