import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GALLERY_MODEL, GALLERY_VIDEOS, PLAYER, VISITOR_ENTRY_POSITION, VISITORS, WEAPON } from "./asset-manifest.js?v=20260708-voxel-visitors";

window.__csGalleryBooted = true;

const canvas = document.querySelector("#stage");
const gameEl = document.querySelector("#game");
const startPanel = document.querySelector("#startPanel");
const endPanel = document.querySelector("#endPanel");
const loadingProgressBar = document.querySelector("#loadingProgressBar");
const loadingProgressText = document.querySelector("#loadingProgressText");
const loadingStatus = document.querySelector("#loadingStatus");
const reloadButton = document.querySelector("#reloadButton");
const radarGoalDot = document.querySelector("#radarGoalDot");
const radarGlassesDot = document.querySelector("#radarGlassesDot");
const radarWeaponDot = document.querySelector("#radarWeaponDot");
const targetNameEl = document.querySelector("#targetName");
const targetHealthEl = document.querySelector("#targetHealth");
const hitMarker = document.querySelector("#hitMarker");
const crosshairEl = document.querySelector(".crosshair");
const pickupNotice = document.querySelector("#pickupNotice");
const damageOverlay = document.querySelector("#damageOverlay");
const dialogueLog = document.querySelector("#dialogueLog");
const visionTicker = document.querySelector("#visionTicker");
const visionTickerLines = [...document.querySelectorAll("#visionTicker .statusBar__marquee span")];
const endTitle = document.querySelector("#endTitle");
const endMessage = document.querySelector("#endMessage");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f1);
scene.fog = new THREE.Fog(0xf4f4f1, 28, 48);

const WORLD_FLOOR_Y = GALLERY_MODEL.position?.[1] ?? 0;
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 90);
camera.position.set(PLAYER.spawn[0], WORLD_FLOOR_Y + PLAYER.eyeHeight, PLAYER.spawn[2]);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.84;
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
renderTarget.texture.colorSpace = THREE.SRGBColorSpace;
renderTarget.depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
renderTarget.depthTexture.type = THREE.UnsignedShortType;
const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const presbyopiaMaterial = makePresbyopiaMaterial();
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), presbyopiaMaterial));

const raycaster = new THREE.Raycaster();
const focusRaycaster = new THREE.Raycaster();
const visitorFloorBox = new THREE.Box3();
const pickupFloorBox = new THREE.Box3();
const clock = new THREE.Clock();
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const pointer = new THREE.Vector2(0, 0);
const keys = new Set();
const shootTargets = [];
const pickupTargets = [];
const galleryColliders = [];
const galleryDestructibles = [];
const galleryMorphAnimations = [];
const galleryVideos = [];
const galleryVideoSources = new Map();
const pendingGalleryVideos = new Set();
const loadingItems = new Map();
const pageParams = new URLSearchParams(window.location.search);
const reloadToken = pageParams.get("reload") || "";
let galleryVideosStarted = false;
let galleryVideoPlayRequested = false;
let galleryVideoWaitStartedAt = 0;
let galleryVideoStartTime = 0;
let galleryVideoSyncCooldown = 0;
let loadingProgress = 0;
let loadingComplete = false;
const GALLERY_VIDEO_START_TIMEOUT = 8;
const LOADING_STALL_TIMEOUT = 18000;
const galleryVideoByNode = new Map(GALLERY_VIDEOS.map((config) => [config.nodeName.toLowerCase(), config]));
const visitors = [];
const bullets = [];
const bulletTrails = [];
const casings = [];
const bulletHoles = [];
const room = { width: 18, depth: 22 };
const MAX_BULLET_HOLES = 180;
const GALLERY_COLLIDER_XZ_SHRINK = 0.78;
const DESTRUCTIBLE_COLLIDER_XZ_SHRINK = 0.56;
const MD_COLLIDER_XZ_SHRINK = 0.34;
const CAR_LADDER_COLLIDER_XZ_SHRINK = 0.28;
const SPACE_DESTRUCTIBLE_HEALTH_MIN = 3;
const SPACE_DESTRUCTIBLE_HEALTH_MAX = 6;
const AS_GROUP_HEALTH_MIN = 5;
const AS_GROUP_HEALTH_MAX = 7;
const S_IMAGE_DESTRUCTIBLE_HEALTH = 5;
const S_IMAGE_BRIGHTNESS = 0.55;
const IMAGE_1783259518580_BRIGHTNESS = 1.38;
const WALL_BACKLIGHT_BRIGHTNESS = 1.72;
const WALL_BACKLIGHT_EMISSIVE_INTENSITY = 1.45;
const CH_ARTWORK_COLOR_CORRECTION = new THREE.Color(0.58, 0.78, 0.7);
const CH_FRAME_COLOR_CORRECTION = new THREE.Color(0.38, 0.46, 0.42);
const GALLERY_SHOOT_THROUGH_NAMES = new Set([
  "box001",
  "box002",
  "box001.001",
]);
const SPACE_DESTRUCTIBLE_NAMES = new Set([
  "ss",
  "s__28524548",
  "s__28524548.002",
  "as01",
  "as02",
  "as03",
  "wa",
  "uu",
  "uu02",
  "uu03",
  "uu04",
  "n01",
  "n02",
  "n03",
  "n04",
  "car01",
  "car01.001",
  "ladder.001",
  "ladder.002",
  "ladder.003",
  "t01",
  "t02",
  "t03",
  "ch01",
  "ch02",
  "ch03",
  "ch04",
  "ch05",
  "ch06",
  "md01",
  "md02",
  "mo01",
  "mo02",
  "mo03",
  "mo04",
]);
const CAR_LADDER_DESTRUCTIBLE_NAMES = new Set([
  "car01",
  "car01.001",
  "ladder.001",
  "ladder.002",
  "ladder.003",
]);
const SPACE_DESTRUCTIBLE_DAMAGE_LINKS = new Map([
  ["as02", "as01"],
  ["as03", "as01"],
  ["nvs", "n01"],
  ["nv2", "n02"],
  ["nv3", "n03"],
  ["nv4", "n04"],
  ["fv01", "md01"],
  ["fv02", "md02"],
]);
const VISITOR_HIDE_SPOTS = [
  new THREE.Vector3(-9.3, WORLD_FLOOR_Y, -13.8),
  new THREE.Vector3(9.3, WORLD_FLOOR_Y, -13.8),
  new THREE.Vector3(-9.3, WORLD_FLOOR_Y, 13.8),
  new THREE.Vector3(9.3, WORLD_FLOOR_Y, 13.8),
  new THREE.Vector3(-8.8, WORLD_FLOOR_Y, 0.4),
  new THREE.Vector3(8.8, WORLD_FLOOR_Y, -0.4),
];
const galleryDestructibleByObject = new Map();
const galleryDestructibleById = new Map();
const pendingLinkedDestructibleMeshes = new Map();

let yaw = 0;
let pitch = 0;
let targetYaw = 0;
let targetPitch = 0;
let bodyVelocity = new THREE.Vector3();
let bodySway = 0;
let recoilYawVelocity = 0;
let recoilPitchVelocity = 0;
let aimRecoilOffset = new THREE.Vector2();
let aimRecoilVelocity = new THREE.Vector2();
let isPlaying = false;
let isPointerLocked = false;
let shotCooldown = 0;
let targetEntity;
let goalTarget;
let player;
let weapon;
let muzzleFlash;
let muzzleLight;
let weaponBasePosition;
let weaponPickup;
let emptyHand;
let emptyHandLift = 0;
let emptyHandLiftVelocity = 0;
let weaponRecoilPosition = new THREE.Vector3();
let weaponRecoilRotation = new THREE.Vector3();
let weaponKickVelocity = new THREE.Vector3();
let weaponAngularVelocity = new THREE.Vector3();
let playerHp = 100;
let playerArmor = 100;
let audioContext;
let chatterCooldown = 1.5;
let hasGlasses = false;
let hasWeapon = false;
let glassesPickup;
let playerVelocityY = 0;
let isGrounded = true;
let eyeHeight = PLAYER.eyeHeight;
let targetEyeHeight = PLAYER.eyeHeight;
let entrance;
let visitorSpawnCooldown = 2.2;
let spawnedVisitorCount = 0;
let currentVisionBlur = 5;
let systemTickerTimer = 0;
const DEFAULT_TICKER_TEXT = "NO GLASSES EQUIPPED - NEAR OBJECTS MAY NOT FOCUS - LOCATE THE GLASSES TO CLEAR YOUR VISION";

init();
animate();

function withLoadCacheBust(url) {
  if (!reloadToken || !url || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  const nextUrl = new URL(url, window.location.href);
  nextUrl.searchParams.set("reload", reloadToken);
  return nextUrl.href;
}

function makePresbyopiaMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: renderTarget.texture },
      tDepth: { value: renderTarget.depthTexture },
      cameraNear: { value: camera.near },
      cameraFar: { value: camera.far },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      enabled: { value: 1 },
      nearFocus: { value: 5.8 },
      blurStrength: { value: 1.4 },
      distortion: { value: 0.035 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform float cameraNear;
      uniform float cameraFar;
      uniform vec2 resolution;
      uniform float enabled;
      uniform float nearFocus;
      uniform float blurStrength;
      uniform float distortion;

      float viewZToOrthographicDepth(const in float viewZ, const in float near, const in float far) {
        return (viewZ + near) / (near - far);
      }

      float perspectiveDepthToViewZ(const in float depth, const in float near, const in float far) {
        return (near * far) / ((far - near) * depth - far);
      }

      vec2 distortUv(vec2 uv, float amount) {
        vec2 centered = uv - 0.5;
        float r2 = dot(centered, centered);
        return uv + centered * r2 * amount;
      }

      vec4 sampleScene(vec2 uv, float radius) {
        vec2 texel = radius / resolution;
        vec4 sum = texture2D(tDiffuse, uv) * 0.2;
        sum += texture2D(tDiffuse, uv + texel * vec2(1.0, 0.0)) * 0.1;
        sum += texture2D(tDiffuse, uv + texel * vec2(-1.0, 0.0)) * 0.1;
        sum += texture2D(tDiffuse, uv + texel * vec2(0.0, 1.0)) * 0.1;
        sum += texture2D(tDiffuse, uv + texel * vec2(0.0, -1.0)) * 0.1;
        sum += texture2D(tDiffuse, uv + texel * vec2(1.0, 1.0)) * 0.1;
        sum += texture2D(tDiffuse, uv + texel * vec2(-1.0, 1.0)) * 0.1;
        sum += texture2D(tDiffuse, uv + texel * vec2(1.0, -1.0)) * 0.1;
        sum += texture2D(tDiffuse, uv + texel * vec2(-1.0, -1.0)) * 0.1;
        return sum;
      }

      void main() {
        float depth = texture2D(tDepth, vUv).x;
        float viewZ = perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
        float distance = -viewZ;
        float nearAmount = (1.0 - smoothstep(0.65, nearFocus, distance)) * enabled;
        vec2 uv = mix(vUv, distortUv(vUv, distortion), nearAmount);
        float radius = nearAmount * blurStrength * 11.2;
        vec4 sharp = texture2D(tDiffuse, uv);
        vec4 blurred = sampleScene(uv, radius);
        vec4 color = mix(sharp, blurred, nearAmount);
        color.rgb *= 1.0 - nearAmount * 0.06;
        gl_FragColor = color;
      }
    `,
  });
}

function init() {
  startLoadingWatchdog();
  makeLights();
  makePlayer();
  makeGallery();
  makeVisitorEntrance();
  makeMuseumVisitors();
  makeGlassesPickup();
  makeWeapon();
  makeEmptyHand();
  makeWeaponPickup();
  updateTargetHud();
  updateLoadingProgress();
  playGalleryVideos();

  canvas.addEventListener("click", () => {
    if (!isPlaying) return;
    unlockGalleryVideoPlayback();
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
      return;
    }
    if (hasWeapon) {
      shoot();
    } else {
      raiseEmptyHand();
    }
  });
  document.addEventListener("pointerdown", unlockGalleryVideoPlayback, { passive: true });
  document.addEventListener("pointerlockchange", () => {
    isPointerLocked = document.pointerLockElement === canvas;
  });
  window.addEventListener("blur", () => {
    isPointerLocked = false;
  });
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("keydown", (event) => keys.add(event.code));
  document.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("resize", onResize);
  reloadButton?.addEventListener("click", () => forceGalleryReload("manual"));
}

function makePlayer() {
  player = {
    id: PLAYER.id,
    group: new THREE.Group(),
    bounds: PLAYER.bounds ?? GALLERY_MODEL.playerBounds,
    radius: PLAYER.radius ?? 0.36,
    modelWidth: PLAYER.modelWidth ?? 0.8,
    walkSpeed: PLAYER.walkSpeed,
    sprintSpeed: PLAYER.sprintSpeed,
  };
  player.group.position.set(PLAYER.spawn[0], WORLD_FLOOR_Y, PLAYER.spawn[2]);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(player.radius * 0.89, 28),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  player.shadow = shadow;
  player.group.add(shadow);
  if (PLAYER.modelPath) {
    loadPlayerModel(PLAYER.modelPath);
  }
  scene.add(player.group);
}

function loadPlayerModel(modelPath) {
  loadConfiguredModel(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      model.name = PLAYER.id;
      normalizeModelToBox(model, new THREE.Vector3(player.modelWidth, PLAYER.eyeHeight, player.modelWidth), { anchorY: 0 });
      model.visible = false;
      player.model = model;
      player.group.add(model);
      addDialogue("System", "Player GLB loaded.");
    },
    () => addDialogue("System", "Player GLB failed to load; using first-person fallback.")
  );
}

function startGame() {
  if (loadingComplete) return;
  loadingComplete = true;
  sessionStorage.removeItem("csGalleryReloadCount");
  loadingProgress = 1;
  updateLoadingProgress();
  startPanel.classList.add("loadingPanel--hidden");
  setTimeout(() => startPanel.classList.add("panel--hidden"), 460);
  gameEl.classList.add("no-glasses");
  isPlaying = true;
}

function forceGalleryReload(reason = "loading") {
  if (reason === "manual") {
    sessionStorage.removeItem("csGalleryReloadCount");
  }

  if (typeof window.__csGalleryReload === "function") {
    window.__csGalleryReload(reason);
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("reload", String(Date.now()));
  url.searchParams.set("reason", reason);
  window.location.replace(url.href);
}

function showManualReload() {
  if (loadingStatus) {
    loadingStatus.textContent = "Loading stalled. Press reload to try again.";
  }
  if (reloadButton) {
    reloadButton.hidden = false;
  }
}

function startLoadingWatchdog() {
  if (loadingStatus) {
    loadingStatus.textContent = reloadToken
      ? "Reloading assets..."
      : "Loading assets...";
  }

  window.setTimeout(() => {
    if (loadingComplete) {
      return;
    }

    const reloadCount = Number(sessionStorage.getItem("csGalleryReloadCount") || "0");
    if (reloadCount >= 1) {
      showManualReload();
      return;
    }

    forceGalleryReload("assets");
  }, LOADING_STALL_TIMEOUT);
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function registerLoadingItem(id) {
  if (!loadingItems.has(id)) {
    loadingItems.set(id, { loaded: 0, total: 1, done: false });
  }
  updateLoadingProgress();
  return id;
}

function updateLoadingItem(id, loaded, total = 1, done = false) {
  const item = loadingItems.get(id);
  if (!item) return;
  item.total = Math.max(total || item.total || 1, 1);
  item.loaded = done ? item.total : Math.max(loaded || 0, item.loaded || 0);
  item.done = done;
  updateLoadingProgress();
}

function updateLoadingProgress() {
  const items = Array.from(loadingItems.values());
  const assetProgress =
    items.length === 0
      ? 0
      : items.reduce((sum, item) => sum + THREE.MathUtils.clamp(item.loaded / item.total, 0, 1), 0) / items.length;
  const playbackProgress = galleryVideosStarted ? 1 : 0;
  const targetProgress = loadingComplete ? 1 : Math.min(0.95, assetProgress * 0.88 + playbackProgress * 0.12);
  loadingProgress = Math.max(loadingProgress, targetProgress);
  loadingProgressBar?.style.setProperty("--loading-progress", loadingProgress.toFixed(4));
  if (loadingProgressText) {
    loadingProgressText.textContent = `${Math.round(loadingProgress * 100)}%`;
  }
  if (loadingStatus && reloadButton?.hidden !== false) {
    loadingStatus.textContent = `Loading assets... ${Math.round(loadingProgress * 100)}%`;
  }
}

function maybeFinishLoading() {
  if (loadingComplete || pendingGalleryVideos.size > 0 || !galleryVideosStarted) return;
  const assetsReady = Array.from(loadingItems.values()).every((item) => item.done);
  if (!assetsReady) return;
  startGame();
}

function playGunshot() {
  ensureAudio();
  const now = audioContext.currentTime;
  const master = audioContext.createGain();
  master.gain.setValueAtTime(0.8, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  master.connect(audioContext.destination);

  const osc = audioContext.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(42, now + 0.08);
  osc.connect(master);
  osc.start(now);
  osc.stop(now + 0.09);

  const bufferSize = Math.floor(audioContext.sampleRate * 0.12);
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = audioContext.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(1600, now);
  noiseFilter.Q.setValueAtTime(0.7, now);
  noise.connect(noiseFilter);
  noiseFilter.connect(master);
  noise.start(now);
  noise.stop(now + 0.12);
}

function makeLights() {
  scene.add(new THREE.AmbientLight(0xfff8ef, 1.7));
  scene.add(new THREE.HemisphereLight(0xfffbf5, 0xe8e4dd, 0.95));

  const fill = new THREE.DirectionalLight(0xfff3e3, 0.42);
  fill.position.set(0, 8, 0);
  fill.castShadow = true;
  fill.shadow.mapSize.set(2048, 2048);
  scene.add(fill);

  const positions = [
    [-6, 4.2, -8],
    [0, 4.2, -8],
    [6, 4.2, -8],
    [-6, 4.2, 0],
    [0, 4.2, 0],
    [6, 4.2, 0],
    [-6, 4.2, 8],
    [0, 4.2, 8],
    [6, 4.2, 8],
  ];
  positions.forEach(([x, y, z]) => {
    const light = new THREE.PointLight(0xffffff, 0.82, 13.5, 2.15);
    light.position.set(x, y, z);
    scene.add(light);
  });
}

function loadConfiguredModel(modelPath, onLoad, onError = null) {
  if (!modelPath) {
    onError?.();
    return;
  }
  const loadingId = registerLoadingItem(`model:${modelPath}`);
  gltfLoader.load(
    withLoadCacheBust(modelPath),
    (gltf) => {
      updateLoadingItem(loadingId, 1, 1, true);
      prepareModelMeshes(gltf.scene);
      onLoad(gltf);
    },
    (event) => {
      if (event.lengthComputable) {
        updateLoadingItem(loadingId, event.loaded, event.total);
      }
    },
    () => {
      updateLoadingItem(loadingId, 1, 1, true);
      onError?.();
    }
  );
}

function prepareModelMeshes(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material) {
      child.material.needsUpdate = true;
    }
  });
}

function normalizeModelToBox(model, targetSize, options = {}) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = Math.min(
    targetSize.x / Math.max(size.x, 0.001),
    targetSize.y / Math.max(size.y, 0.001),
    targetSize.z / Math.max(size.z, 0.001)
  );
  if (Number.isFinite(scale)) model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = scaledBox.getCenter(new THREE.Vector3());
  const yOffset = options.centerY ? -center.y : (options.anchorY ?? 0) - scaledBox.min.y;
  model.position.add(new THREE.Vector3(-center.x, yOffset, -center.z));
}

function registerModelMeshes(model, type, owner = null) {
  const meshes = [];
  model.traverse((child) => {
    if (!child.isMesh) return;
    registerShootTarget(child, type, owner);
    child.userData.originalPosition = child.position.clone();
    child.userData.originalRotation = child.rotation.clone();
    child.userData.originalScale = child.scale.clone();
    meshes.push(child);
  });
  return meshes;
}

function registerGalleryModel(model, parser = null) {
  tuneGalleryMaterials(model, parser);
  model.updateMatrixWorld(true);
  model.traverse((child) => {
    if (!child.isMesh) return;
    if (registerGalleryGoalTarget(child)) return;
    if (registerGalleryDestructible(child, model)) return;
    registerShootTarget(child, "surface");
    registerGalleryCollider(child);
  });
}

function tuneGalleryMaterials(model, parser = null) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    const nodeName = child.name?.trim();
    tuneSImageMaterial(child);
    tuneImage1783259518580Material(child, nodeName);
    tuneWallBacklightMaterial(child, nodeName);
    tuneChArtworkMaterial(child, nodeName);
    const videoConfig = galleryVideoByNode.get(nodeName?.toLowerCase());
    if (videoConfig) {
      applyGalleryVideoMaterial(child, videoConfig, parser);
    }

    if (nodeName === "立方體") {
      child.material = normalizeMaterialArray(child.material).map((material, index) => {
        const metal = material.clone();
        metal.name = `${material.name || "cube"} metal`;
        metal.color.set(index === 0 ? 0x1c2024 : 0xbfc5c9);
        metal.metalness = 0.92;
        metal.roughness = index === 0 ? 0.16 : 0.22;
        metal.envMapIntensity = 1.45;
        metal.side = THREE.DoubleSide;
        metal.needsUpdate = true;
        return metal;
      });
      child.castShadow = true;
      child.receiveShadow = true;
    }

    if (nodeName?.toLowerCase() === "buffalo") {
      const buffaloTexture = textureLoader.load(withLoadCacheBust("./assets/textures/buffalo.jpg"), (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
        texture.needsUpdate = true;
      });
      buffaloTexture.colorSpace = THREE.SRGBColorSpace;
      buffaloTexture.flipY = false;
      buffaloTexture.wrapS = THREE.RepeatWrapping;
      buffaloTexture.wrapT = THREE.RepeatWrapping;

      child.material = new THREE.MeshStandardMaterial({
        name: "buffalo relief texture",
        map: buffaloTexture,
        color: 0xffffff,
        metalness: 0,
        roughness: 0.42,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      child.renderOrder = 8;
      child.position.z += 0.035;
      child.material.needsUpdate = true;
    }
  });
}

function tuneSImageMaterial(mesh) {
  const hasSImageMaterial = normalizeMaterialArray(mesh.material).some((material) => {
    const name = material?.name?.trim().toLowerCase();
    return name === "s__28524548";
  });
  if (!hasSImageMaterial) return;

  mesh.material = normalizeMaterialArray(mesh.material).map((material) => {
    if (material?.name?.trim().toLowerCase() !== "s__28524548") return material;
    const tuned = material.clone();
    tuned.color?.setScalar(S_IMAGE_BRIGHTNESS);
    tuned.emissive?.set(0x000000);
    tuned.emissiveIntensity = 0;
    tuned.metalness = 0;
    tuned.roughness = Math.max(tuned.roughness ?? 0.5, 0.68);
    tuned.envMapIntensity = 0.45;
    tuned.needsUpdate = true;
    return tuned;
  });
  if (mesh.material.length === 1) mesh.material = mesh.material[0];
}

function tuneImage1783259518580Material(mesh, nodeName = "") {
  if (nodeName?.toLowerCase() !== "box002") return;

  mesh.material = normalizeMaterialArray(mesh.material).map((material) => {
    if (!material) return material;
    const tuned = material.clone();
    tuned.color?.setScalar(IMAGE_1783259518580_BRIGHTNESS);
    tuned.emissive?.set(0x000000);
    tuned.emissiveIntensity = 0;
    tuned.metalness = 0;
    tuned.roughness = Math.max(tuned.roughness ?? 0.5, 0.58);
    tuned.envMapIntensity = 0.38;
    tuned.needsUpdate = true;
    return tuned;
  });
  if (mesh.material.length === 1) mesh.material = mesh.material[0];
}

function tuneWallBacklightMaterial(mesh, nodeName = "") {
  if (nodeName?.toLowerCase() !== "box001.001") return;

  mesh.material = normalizeMaterialArray(mesh.material).map((material) => {
    if (!material) return material;
    const tuned = material.clone();
    tuned.color?.setScalar(WALL_BACKLIGHT_BRIGHTNESS);
    tuned.emissive?.set(0xffe6c4);
    tuned.emissiveIntensity = WALL_BACKLIGHT_EMISSIVE_INTENSITY;
    tuned.metalness = 0;
    tuned.roughness = Math.max(tuned.roughness ?? 0.5, 0.42);
    tuned.envMapIntensity = 0.18;
    tuned.toneMapped = true;
    tuned.needsUpdate = true;
    return tuned;
  });
  if (mesh.material.length === 1) mesh.material = mesh.material[0];
}

function tuneChArtworkMaterial(mesh, nodeName = "") {
  if (!/^ch0[1-6]$/i.test(nodeName)) return;

  mesh.material = normalizeMaterialArray(mesh.material).map((material) => {
    if (!material) return material;
    const tuned = material.clone();
    const materialName = tuned.name?.trim().toLowerCase() ?? "";
    const isFrame = materialName === "材質.010";
    tuned.color?.copy(isFrame ? CH_FRAME_COLOR_CORRECTION : CH_ARTWORK_COLOR_CORRECTION);
    tuned.emissive?.set(0x000000);
    tuned.emissiveIntensity = 0;
    tuned.metalness = 0;
    tuned.roughness = isFrame ? 0.92 : 0.86;
    tuned.envMapIntensity = isFrame ? 0.08 : 0.12;
    tuned.toneMapped = true;
    tuned.needsUpdate = true;
    return tuned;
  });
  if (mesh.material.length === 1) mesh.material = mesh.material[0];
}

function applyGalleryVideoMaterial(mesh, config, parser) {
  if (mesh.userData.galleryVideo) return;
  mesh.userData.galleryVideo = { video: null, texture: null, config };

  if (config.videoPath) {
    attachGalleryVideo(mesh, config, config.videoPath, () => {
      resolveEmbeddedGalleryVideoUrl(parser, config.nodeName)
        .then((videoUrl) => {
          if (!videoUrl) {
            addDialogue("System", `${config.nodeName} video not found: ${config.videoPath}`);
            return;
          }
          attachGalleryVideo(mesh, config, videoUrl);
        })
        .catch(() => {
          addDialogue("System", `${config.nodeName} video failed to load.`);
        });
    });
    return;
  }

  resolveEmbeddedGalleryVideoUrl(parser, config.nodeName)
    .then((videoUrl) => {
      if (!videoUrl) {
        addDialogue("System", `${config.nodeName} has no embedded video data in the GLB.`);
        return;
      }
      attachGalleryVideo(mesh, config, videoUrl);
    })
    .catch(() => {
      addDialogue("System", `${config.nodeName} embedded video failed to load.`);
    });
}

function playGalleryVideos() {
  galleryVideoPlayRequested = true;
  if (!galleryVideoWaitStartedAt) galleryVideoWaitStartedAt = clock.elapsedTime;
  maybeStartGalleryVideos();
}

function maybeStartGalleryVideos(force = false) {
  if (galleryVideosStarted || galleryVideos.length === 0) return;
  const waitedLongEnough = clock.elapsedTime - galleryVideoWaitStartedAt >= GALLERY_VIDEO_START_TIMEOUT;
  if (!force && pendingGalleryVideos.size > 0 && !waitedLongEnough) return;

  galleryVideosStarted = true;
  galleryVideoStartTime = clock.elapsedTime;
  galleryVideoSyncCooldown = 0;
  let playCount = 0;
  galleryVideos.forEach((video) => {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      video.currentTime = 0;
    }
    playCount += 1;
    requestGalleryVideoPlay(video);
  });
  if (playCount > 0) {
    updateLoadingProgress();
    maybeFinishLoading();
  }
}

function syncGalleryVideos(delta) {
  if (galleryVideoPlayRequested && !galleryVideosStarted) maybeStartGalleryVideos();
  if (!galleryVideosStarted || galleryVideos.length === 0) return;
  galleryVideoSyncCooldown -= delta;
  if (galleryVideoSyncCooldown > 0) return;
  galleryVideoSyncCooldown = 0.25;

  const elapsed = Math.max(0, clock.elapsedTime - galleryVideoStartTime);
  galleryVideos.forEach((video) => {
    if (video.paused) {
      requestGalleryVideoPlay(video);
    }
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (duration <= 0) return;
    const targetTime = elapsed % duration;
    if (Math.abs(video.currentTime - targetTime) > 0.08) {
      video.currentTime = targetTime;
    }
  });
  maybeFinishLoading();
}

function attachGalleryVideo(mesh, config, videoUrl, onError = null) {
  const existingSource = galleryVideoSources.get(videoUrl);
  if (existingSource) {
    mesh.userData.galleryVideo.video = existingSource.video;
    if (existingSource.texture) {
      applyGalleryVideoTexture(mesh, config, existingSource.texture);
    } else {
      existingSource.targets.push({ mesh, config });
    }
    return;
  }

  const loadingId = registerLoadingItem(`video:${videoUrl}`);
  const video = document.createElement("video");
  video.loop = true;
  video.muted = false;
  video.defaultMuted = false;
  video.volume = 1;
  video.playsInline = true;
  video.preload = "auto";
  video.src = new URL(withLoadCacheBust(videoUrl), window.location.href).href;
  mesh.userData.galleryVideo.video = video;
  const source = { video, texture: null, targets: [{ mesh, config }] };
  galleryVideoSources.set(videoUrl, source);
  galleryVideos.push(video);
  pendingGalleryVideos.add(video);

  video.addEventListener(
    "loadeddata",
    () => {
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      source.texture = texture;
      source.targets.forEach((target) => applyGalleryVideoTexture(target.mesh, target.config, texture));
      source.targets.length = 0;
      pendingGalleryVideos.delete(video);
      updateLoadingItem(loadingId, 1, 1, true);
      if (galleryVideoPlayRequested) {
        if (galleryVideosStarted) {
          const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
          if (duration > 0) video.currentTime = Math.max(0, clock.elapsedTime - galleryVideoStartTime) % duration;
          requestGalleryVideoPlay(video);
        } else {
          maybeStartGalleryVideos();
        }
      }
      maybeFinishLoading();
    },
    { once: true }
  );
  video.addEventListener("progress", () => {
    if (video.buffered.length === 0) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    updateLoadingItem(loadingId, Math.min(bufferedEnd, duration), duration);
  });
  video.addEventListener(
    "error",
    () => {
      pendingGalleryVideos.delete(video);
      const index = galleryVideos.indexOf(video);
      if (index >= 0) galleryVideos.splice(index, 1);
      galleryVideoSources.delete(videoUrl);
      updateLoadingItem(loadingId, 1, 1, true);
      onError?.();
      if (isPlaying && galleryVideoPlayRequested) maybeStartGalleryVideos();
      maybeFinishLoading();
    },
    { once: true }
  );
  video.load();
}

function applyGalleryVideoTexture(mesh, config, texture) {
  mesh.material = new THREE.MeshBasicMaterial({
    name: `${config.nodeName} video material`,
    map: texture,
    color: new THREE.Color(config.brightness ?? 1, config.brightness ?? 1, config.brightness ?? 1),
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  mesh.userData.galleryVideo.texture = texture;
}

function requestGalleryVideoPlay(video) {
  const playPromise = video.play();
  if (!playPromise) return;
  playPromise.catch(() => {
    setTimeout(() => {
      if (galleryVideosStarted && video.paused) video.play().catch(() => {});
    }, 350);
  });
}

function unlockGalleryVideoPlayback() {
  if (!galleryVideoPlayRequested) return;
  if (!galleryVideosStarted) {
    maybeStartGalleryVideos(true);
    return;
  }
  galleryVideos.forEach((video) => {
    if (video.paused) requestGalleryVideoPlay(video);
  });
}

async function resolveEmbeddedGalleryVideoUrl(parser, nodeName) {
  const json = parser?.json;
  if (!json?.images) return null;

  const target = nodeName.toLowerCase();
  const imageIndex = json.images.findIndex((image) => {
    const name = image.name?.toLowerCase();
    const uri = image.uri?.toLowerCase();
    const mimeType = image.mimeType?.toLowerCase() ?? "";
    return (
      name === target ||
      uri?.includes(`${target}.`) ||
      (mimeType.startsWith("video/") && name?.includes(target))
    );
  });
  if (imageIndex < 0) return null;

  const image = json.images[imageIndex];
  const mimeType = image.mimeType ?? getVideoMimeType(image.uri);
  if (!mimeType?.startsWith("video/")) return null;
  if (image.uri) return image.uri;
  if (image.bufferView === undefined) return null;

  const buffer = await parser.getDependency("bufferView", image.bufferView);
  const blob = new Blob([buffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

function getVideoMimeType(uri = "") {
  const lower = uri.toLowerCase();
  if (lower.startsWith("data:video/mp4")) return "video/mp4";
  if (lower.startsWith("data:video/webm")) return "video/webm";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return "";
}

function normalizeMaterialArray(material) {
  return Array.isArray(material) ? material : [material].filter(Boolean);
}

function registerGalleryDestructible(mesh, model) {
  const linkedId = findLinkedSpaceDestructibleId(mesh, model);
  if (linkedId) return registerLinkedGalleryDestructibleMesh(mesh, linkedId);

  const object = findSpaceDestructibleObject(mesh, model);
  if (!object) return false;

  let target = galleryDestructibleByObject.get(object);
  if (!target) {
    const targetId = getSpaceDestructibleTargetId(object, mesh);
    const maxHealth = getSpaceDestructibleMaxHealth(targetId);
    target = {
      id: targetId,
      object,
      meshes: [],
      colliders: [],
      health: maxHealth,
      maxHealth,
      damage: 0,
      destroyed: false,
    };
    object.userData.originalPosition = object.position.clone();
    object.userData.originalRotation = object.rotation.clone();
    object.userData.originalScale = object.scale.clone();
    galleryDestructibleByObject.set(object, target);
    galleryDestructibleById.set(target.id.toLowerCase(), target);
    galleryDestructibles.push(target);
    registerGalleryCollider(object, target);
    configureDestructibleGoalTarget(target);
    attachPendingLinkedDestructibleMeshes(target);
  }

  attachGalleryDestructibleMesh(target, mesh);
  return true;
}

function getSpaceDestructibleMaxHealth(id) {
  const normalizedId = id?.toLowerCase();
  if (normalizedId === "as01") {
    return THREE.MathUtils.randInt(AS_GROUP_HEALTH_MIN, AS_GROUP_HEALTH_MAX);
  }
  if (normalizedId === "ss" || normalizedId === "s__28524548" || normalizedId === "s__28524548.002") {
    return S_IMAGE_DESTRUCTIBLE_HEALTH;
  }
  return THREE.MathUtils.randInt(SPACE_DESTRUCTIBLE_HEALTH_MIN, SPACE_DESTRUCTIBLE_HEALTH_MAX);
}

function configureDestructibleGoalTarget(target) {
  if (target.id?.toLowerCase() !== "as01") return;
  goalTarget = target;
  targetEntity = {
    type: "destructible",
    name: "as01",
    getHealth: () => target.health,
    getMaxHealth: () => target.maxHealth,
  };
  updateTargetHud();
  addDialogue("System", "Final target as01 configured.");
}

function registerLinkedGalleryDestructibleMesh(mesh, linkedId) {
  const target = galleryDestructibleById.get(linkedId);
  if (target) {
    attachGalleryDestructibleMesh(target, mesh);
  } else {
    const pending = pendingLinkedDestructibleMeshes.get(linkedId) ?? [];
    pending.push(mesh);
    pendingLinkedDestructibleMeshes.set(linkedId, pending);
  }
  return true;
}

function attachPendingLinkedDestructibleMeshes(target) {
  const linkedId = target.id.toLowerCase();
  const pending = pendingLinkedDestructibleMeshes.get(linkedId);
  if (!pending) return;
  pending.forEach((mesh) => attachGalleryDestructibleMesh(target, mesh));
  pendingLinkedDestructibleMeshes.delete(linkedId);
}

function attachGalleryDestructibleMesh(target, mesh) {
  if (mesh.userData.destructible === target) return;
  cloneMaterialsForDamage(mesh);
  mesh.userData.destructible = target;
  mesh.userData.originalPosition = mesh.position.clone();
  mesh.userData.originalRotation = mesh.rotation.clone();
  mesh.userData.originalScale = mesh.scale.clone();
  target.meshes.push(mesh);
  registerShootTarget(mesh, "destructible", target);
  registerGalleryMorphAnimation(target, mesh);
}

function registerGalleryMorphAnimation(target, mesh) {
  if (target.id?.toLowerCase() !== "as01") return;
  if (!mesh.morphTargetInfluences?.length) return;
  if (mesh.userData.galleryMorphAnimation) return;

  mesh.userData.galleryMorphAnimation = true;
  galleryMorphAnimations.push({
    target,
    mesh,
    influenceIndex: 0,
    value: 0.05,
    state: "hold-low",
    holdUntil: clock.elapsedTime + 20,
    low: 0.05,
    high: 0.95,
    transitionDuration: 2.5,
    holdLowDuration: 20,
    holdHighDuration: 15,
  });
  addDialogue("System", "as01 morph animation enabled.");
}

function findSpaceDestructibleObject(mesh, model) {
  let node = mesh;
  let matched = null;
  while (node && node !== model.parent) {
    const name = node.name?.trim().toLowerCase();
    if (SPACE_DESTRUCTIBLE_NAMES.has(name)) matched = node;
    if (node === mesh && hasSpaceDestructibleMaterial(mesh)) matched = node;
    if (node === model) break;
    node = node.parent;
  }
  return matched;
}

function getSpaceDestructibleTargetId(object, mesh) {
  const materialName = getSpaceDestructibleMaterialName(mesh);
  if (materialName) return materialName;
  return object.name?.trim() || mesh.name?.trim() || "space-object";
}

function hasSpaceDestructibleMaterial(mesh) {
  return Boolean(getSpaceDestructibleMaterialName(mesh));
}

function getSpaceDestructibleMaterialName(mesh) {
  const material = normalizeMaterialArray(mesh.material).find((item) => {
    const name = item?.name?.trim().toLowerCase();
    return SPACE_DESTRUCTIBLE_NAMES.has(name);
  });
  return material?.name?.trim() ?? "";
}

function findLinkedSpaceDestructibleId(mesh, model) {
  let node = mesh;
  let linkedId = null;
  while (node && node !== model.parent) {
    const name = node.name?.trim().toLowerCase();
    if (SPACE_DESTRUCTIBLE_DAMAGE_LINKS.has(name)) linkedId = SPACE_DESTRUCTIBLE_DAMAGE_LINKS.get(name);
    if (node === model) break;
    node = node.parent;
  }
  return linkedId;
}

function cloneMaterialsForDamage(mesh) {
  if (mesh.userData.damageMaterialCloned) return;
  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((material) => material?.clone?.() ?? material);
  } else if (mesh.material) {
    mesh.material = mesh.material.clone();
  }
  normalizeMaterialArray(mesh.material).forEach((material) => {
    if (!material?.color) return;
    material.userData.originalDamageColor = material.color.clone();
  });
  mesh.userData.damageMaterialCloned = true;
}

function registerGalleryGoalTarget(mesh) {
  if (mesh.name?.trim().toLowerCase() !== "as.008") return false;

  const target = {
    id: "as.008",
    name: "as.008",
    mesh,
    health: 3,
    maxHealth: 3,
    destroyed: false,
  };
  goalTarget = target;
  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((material) => material.clone());
  } else if (mesh.material) {
    mesh.material = mesh.material.clone();
  }
  mesh.userData.galleryTarget = target;
  targetEntity = {
    type: "gallery-target",
    name: target.name,
    getHealth: () => target.health,
    getMaxHealth: () => target.maxHealth,
  };
  registerShootTarget(mesh, "gallery-target", target);
  updateTargetHud();
  addDialogue("System", "Target as.008 configured.");
  return true;
}

function registerGalleryCollider(mesh, owner = null) {
  const name = mesh.name?.toLowerCase() ?? "";
  if (!owner && GALLERY_SHOOT_THROUGH_NAMES.has(name)) return;
  if (!owner) {
    if (name === "box034") return;
    if (name.includes("floor") || name.includes("bench") || name.includes("entrance")) return;
    if (name.includes("scaniverse") || name.includes("buffalo")) return;
  }

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  if (!owner) {
    if (size.y < 1.0 || box.max.y < 0.55) return;
    if (size.x > 18 && size.z > 18) return;
    if (size.x < 0.12 && size.z < 0.12) return;
    if (size.x > 2.4 && size.z > 2.4) return;
  } else if (size.x < 0.03 && size.y < 0.03 && size.z < 0.03) {
    return;
  }

  const collider = {
    mesh,
    owner,
    box,
    center: new THREE.Vector3(),
    size,
  };
  updateColliderBox(collider);
  galleryColliders.push(collider);
  owner?.colliders?.push(collider);
}

function updateColliderBox(collider) {
  collider.box.setFromObject(collider.mesh);
  collider.box.getCenter(collider.center);
  shrinkColliderBoxXZ(collider.box, collider.center, getColliderShrinkAmount(collider));
  collider.box.getSize(collider.size);
}

function getColliderShrinkAmount(collider) {
  const id = collider.owner?.id?.toLowerCase();
  if (id === "md01" || id === "md02") return MD_COLLIDER_XZ_SHRINK;
  if (CAR_LADDER_DESTRUCTIBLE_NAMES.has(id)) return CAR_LADDER_COLLIDER_XZ_SHRINK;
  return collider.owner ? DESTRUCTIBLE_COLLIDER_XZ_SHRINK : GALLERY_COLLIDER_XZ_SHRINK;
}

function shrinkColliderBoxXZ(box, center, amount) {
  const halfX = (box.max.x - box.min.x) * 0.5 * amount;
  const halfZ = (box.max.z - box.min.z) * 0.5 * amount;
  if (halfX > 0.025) {
    box.min.x = center.x - halfX;
    box.max.x = center.x + halfX;
  }
  if (halfZ > 0.025) {
    box.min.z = center.z - halfZ;
    box.max.z = center.z + halfZ;
  }
}

function makeGallery() {
  if (GALLERY_MODEL.modelPath) {
    loadGalleryModel(GALLERY_MODEL);
    return;
  }
  addDialogue("System", "Using generated gallery fallback.");
  makeFallbackGallery();
}

function makeFallbackGallery() {
  const floorTexture = makeFloorTexture();
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf0eee7, roughness: 0.72 });
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    color: 0xd4bd8f,
    roughness: 0.66,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.depth), floorMaterial);
  floor.position.y = WORLD_FLOOR_Y;
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  registerShootTarget(floor, "surface");
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(room.width, room.depth),
    new THREE.MeshStandardMaterial({ color: 0xe7e4db, roughness: 0.78 })
  );
  ceiling.position.y = 4.6;
  ceiling.rotation.x = Math.PI / 2;
  registerShootTarget(ceiling, "surface");
  scene.add(ceiling);

  addWall(0, 2.3, -room.depth / 2, room.width, 4.6, 0, wallMaterial);
  addWall(-room.width / 2, 2.3, 0, room.depth, 4.6, Math.PI / 2, wallMaterial);
  addWall(room.width / 2, 2.3, 0, room.depth, 4.6, -Math.PI / 2, wallMaterial);
  addInteriorWall(-2.2, 2.25, -4.25, 4.7, 3.15, Math.PI / 2, wallMaterial);
  addInteriorWall(5.7, 2.25, 1.3, 5.3, 3.15, -Math.PI / 2, wallMaterial);

  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8a7b68, roughness: 0.78 });
  addBaseboard(0, 0.09, -10.93, room.width, 0, baseMaterial);
  addBaseboard(-8.93, 0.09, 0, room.depth, Math.PI / 2, baseMaterial);
  addBaseboard(8.93, 0.09, 0, room.depth, Math.PI / 2, baseMaterial);

  const textWall = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 3.4),
    new THREE.MeshStandardMaterial({ map: makeWallTextTexture(), roughness: 0.8 })
  );
  textWall.position.set(6.72, 2.35, 4.2);
  textWall.rotation.y = -Math.PI / 2;
  registerShootTarget(textWall, "surface");
  scene.add(textWall);

  makeCeilingRails();
  makeBenches();

  const ropeMaterial = new THREE.MeshStandardMaterial({ color: 0x786c5a, roughness: 0.7 });
  for (let z = -7.5; z <= 4; z += 4) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.9, 16), ropeMaterial);
    post.position.set(-6.2, 0.45, z);
    post.castShadow = true;
    registerShootTarget(post, "surface");
    scene.add(post);
  }
}

function loadGalleryModel(config) {
  loadConfiguredModel(
    config.modelPath,
    (gltf) => {
      const model = gltf.scene;
      model.name = config.id;
      model.position.set(...(config.position ?? [0, 0, 0]));
      model.rotation.y = config.rotationY ?? 0;
      model.scale.setScalar(config.scale ?? 1);
      registerGalleryModel(model, gltf.parser);
      scene.add(model);
      addDialogue("System", `${config.label ?? "Gallery GLB"} loaded.`);
    },
    () => {
      addDialogue("System", `${config.label ?? "Gallery GLB"} failed to load.`);
      makeFallbackGallery();
    }
  );
}

function addInteriorWall(x, y, z, w, h, rotY, material) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, w), material);
  wall.position.set(x, y, z);
  wall.rotation.y = rotY;
  wall.castShadow = true;
  wall.receiveShadow = true;
  registerShootTarget(wall, "surface");
  scene.add(wall);
}

function addBaseboard(x, y, z, length, rotY, material) {
  const board = new THREE.Mesh(new THREE.BoxGeometry(length, 0.18, 0.08), material);
  board.position.set(x, y, z);
  board.rotation.y = rotY;
  board.receiveShadow = true;
  registerShootTarget(board, "surface");
  scene.add(board);
}

function makeCeilingRails() {
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x30322d, roughness: 0.52, metalness: 0.2 });
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff2cf,
    emissive: 0xffcf75,
    emissiveIntensity: 0.65,
    roughness: 0.35,
  });

  for (let x = -5.5; x <= 5.5; x += 5.5) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 16.5), railMaterial);
    rail.position.set(x, 4.48, -1.2);
    registerShootTarget(rail, "surface");
    scene.add(rail);
    for (let z = -8; z <= 5; z += 3.25) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.32, 18), lampMaterial);
      lamp.position.set(x, 4.24, z);
      lamp.rotation.x = Math.PI / 2;
      registerShootTarget(lamp, "surface");
      scene.add(lamp);
    }
  }
}

function makeBenches() {
  const wood = new THREE.MeshStandardMaterial({ color: 0x8d6845, roughness: 0.68 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x44413a, roughness: 0.55, metalness: 0.25 });
  for (const z of [-1.2, 4.8]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.18, 0.62), wood);
    seat.position.set(0.8, 0.48, z);
    seat.castShadow = true;
    seat.receiveShadow = true;
    registerShootTarget(seat, "surface");
    scene.add(seat);
    for (const x of [-0.25, 1.85]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.48), metal);
      leg.position.set(x, 0.24, z);
      leg.castShadow = true;
      registerShootTarget(leg, "surface");
      scene.add(leg);
    }
  }
}

function addWall(x, y, z, w, h, rotY, material) {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  wall.position.set(x, y, z);
  wall.rotation.y = rotY;
  wall.receiveShadow = true;
  registerShootTarget(wall, "surface");
  scene.add(wall);
}

function registerShootTarget(mesh, type, owner = null) {
  mesh.userData.shootType = type;
  if (owner) mesh.userData.owner = owner;
  shootTargets.push(mesh);
  return mesh;
}

function registerPickupTarget(group, type, radius = 0.85) {
  group.userData.pickupType = type;
  group.userData.radius = radius;
  pickupTargets.push(group);
  return group;
}

function settlePickupOnFloor(group, clearance = 0.015) {
  group.updateMatrixWorld(true);
  pickupFloorBox.makeEmpty();
  pickupFloorBox.setFromObject(group);
  if (pickupFloorBox.isEmpty()) return;
  group.position.y += WORLD_FLOOR_Y + clearance - pickupFloorBox.min.y;
  group.userData.groundY = group.position.y;
}

function makeVisitorEntrance() {
  if (!VISITOR_ENTRY_POSITION) return;
  entrance = new THREE.Group();
  entrance.position.set(VISITOR_ENTRY_POSITION[0], WORLD_FLOOR_Y, VISITOR_ENTRY_POSITION[2]);
  entrance.rotation.y = Math.PI;

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d2428,
    emissive: 0x1a4f6a,
    emissiveIntensity: 0.28,
    roughness: 0.45,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x6fd6ff, transparent: true, opacity: 0.32 });

  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 2.75), glowMaterial);
  door.position.y = 1.38;
  entrance.add(door);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 0.12), frameMaterial);
  top.position.y = 2.82;
  entrance.add(top);
  for (const x of [-0.92, 0.92]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.78, 0.12), frameMaterial);
    side.position.set(x, 1.39, 0);
    entrance.add(side);
  }

  const signTexture = makeEntranceSignTexture();
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.28),
    new THREE.MeshBasicMaterial({ map: signTexture, transparent: true })
  );
  sign.position.set(0, 3.08, 0.01);
  entrance.add(sign);

  scene.add(entrance);
}

function makeGlassesPickup() {
  const group = new THREE.Group();
  const pickupScale = 0.8;
  const spots = [
    [0.7, WORLD_FLOOR_Y, 9.4],
    [-8.3, WORLD_FLOOR_Y, 11.7],
    [8.1, WORLD_FLOOR_Y, 11.5],
    [-7.8, WORLD_FLOOR_Y, -11.8],
    [7.5, WORLD_FLOOR_Y, -12.2],
    [1.6, WORLD_FLOOR_Y, -2.4],
  ];
  group.position.set(...spots[Math.floor(Math.random() * spots.length)]);
  group.rotation.set(-Math.PI / 2, 0.4, 0.08);
  group.scale.setScalar(pickupScale);

  const lensMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9f3ff,
    transparent: true,
    opacity: 0.38,
    roughness: 0.12,
    metalness: 0.05,
  });
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.38, metalness: 0.4 });

  const leftLens = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.015, 10, 28), frameMaterial);
  leftLens.position.x = -0.18;
  group.add(leftLens);
  const rightLens = leftLens.clone();
  rightLens.position.x = 0.18;
  group.add(rightLens);

  const leftGlass = new THREE.Mesh(new THREE.CircleGeometry(0.14, 28), lensMaterial);
  leftGlass.position.set(-0.18, 0, 0.002);
  group.add(leftGlass);
  const rightGlass = leftGlass.clone();
  rightGlass.position.x = 0.18;
  group.add(rightGlass);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.025), frameMaterial);
  group.add(bridge);
  for (const side of [-1, 1]) {
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.018, 0.022), frameMaterial);
    temple.position.set(side * 0.36, 0, -0.12);
    temple.rotation.y = side * 0.72;
    group.add(temple);
  }

  const glow = new THREE.PointLight(0xeffcff, 1.1, 2.4, 2);
  glow.position.set(0, 0.28, 0);
  group.add(glow);
  settlePickupOnFloor(group, 0.012);
  registerPickupTarget(group, "glasses", 1.05 * pickupScale);
  glassesPickup = group;
  scene.add(group);
}

function makeMuseumVisitors() {
  VISITORS.forEach((config, index) => {
    const visitor = createVisitor(config, index);
    visitors.push(visitor);
    scene.add(visitor.group);
  });
}

function createVisitor(config, index) {
  const group = new THREE.Group();
  group.position.set(config.position[0], WORLD_FLOOR_Y, config.position[2]);
  group.rotation.y = config.rotationY;

  const visitor = {
    group,
    parts: [],
    coverPartIndexes: [],
    state: "calm",
    behavior: config.behavior ?? "coward",
    role: config.role ?? "visitor",
    gender: config.gender ?? (index % 2 === 0 ? "male" : "female"),
    species: config.species ?? "human",
    hp: 1,
    downDamage: 0,
    destroyed: false,
    panic: 0,
    wobble: 0,
    speed: 0,
    attackCooldown: 0,
    talkCooldown: 0.8 + index * 0.6,
    downTilt: Math.random() > 0.5 ? 1 : -1,
    velocity: new THREE.Vector3(),
    home: new THREE.Vector3(config.position[0], WORLD_FLOOR_Y, config.position[2]),
    wanderTarget: new THREE.Vector3(config.position[0], WORLD_FLOOR_Y, config.position[2]),
    hideTarget: new THREE.Vector3(config.position[0], WORLD_FLOOR_Y, config.position[2]),
    wanderPause: Math.random() * 1.4,
    patrolPoints: (config.patrolPoints ?? []).map((point) => new THREE.Vector3(point[0], WORLD_FLOOR_Y, point[2])),
    patrolTargetIndex: 1,
    patrolPause: 0,
    busyPhase: Math.random() * Math.PI * 2,
    busyTimer: 1.6 + Math.random() * 2.8,
    busyPose: ["inspect", "crouch", "clipboard"][index % 3],
    isMovingToWork: false,
    busyTarget: new THREE.Vector3(config.position[0], WORLD_FLOOR_Y, config.position[2]),
    workRadius: config.workRadius ?? 1.2,
    animationMixer: null,
    animationActions: [],
    bones: {},
    usesSkeletonAnimation: false,
    visualScale: config.scale ?? 1,
    wanderOffset: index * 1.7,
  };

  const skin = new THREE.MeshStandardMaterial({ color: 0xb77b55, roughness: 0.62 });
  const jacket = new THREE.MeshStandardMaterial({ color: config.jacket, roughness: 0.78 });
  const pants = new THREE.MeshStandardMaterial({ color: config.pants, roughness: 0.74 });
  const hair = new THREE.MeshStandardMaterial({ color: config.hair ?? 0x17120f, roughness: 0.7 });

  if (config.style === "voxel") {
    addVoxelVisitorParts(visitor, { skin, jacket, pants, hair });
  } else if (visitor.species === "tall-being") {
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.16, 1.05, 8, 14), jacket, [0, 1.42, 0], [0, 0, 0], [0.82, 1.2, 0.62]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.08, 0.52, 7, 12), skin, [0, 2.22, 0], [0, 0, 0], [0.72, 1, 0.72]);
    addVisitorPart(visitor, new THREE.SphereGeometry(0.16, 18, 12), skin, [0, 2.57, 0], [0, 0, 0], [1, 1.15, 1]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.045, 0.72, 6, 10), jacket, [-0.28, 1.58, 0], [0.35, 0, -0.55], [1, 1, 1]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.045, 0.72, 6, 10), jacket, [0.28, 1.58, 0], [0.35, 0, 0.55], [1, 1, 1]);
    visitor.coverPartIndexes = [3, 4];
  } else if (visitor.species === "round-being") {
    addVisitorPart(visitor, new THREE.SphereGeometry(0.38, 24, 16), jacket, [0, 1.28, 0], [0, 0, 0], [1.08, 0.95, 1.08]);
    addVisitorPart(visitor, new THREE.SphereGeometry(0.12, 16, 10), skin, [-0.16, 1.42, 0.32], [0, 0, 0], [1, 1, 1]);
    addVisitorPart(visitor, new THREE.SphereGeometry(0.12, 16, 10), skin, [0.16, 1.42, 0.32], [0, 0, 0], [1, 1, 1]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.052, 0.42, 6, 10), pants, [-0.18, 0.76, 0], [0, 0, 0.12], [1, 1, 1]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.052, 0.42, 6, 10), pants, [0.18, 0.76, 0], [0, 0, -0.12], [1, 1, 1]);
    visitor.coverPartIndexes = [1, 2];
  } else {
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.2, 0.64, 7, 14), jacket, [0, 1.36, 0], [0, 0, 0], [1.05, 1, 0.75]);
    addVisitorPart(visitor, new THREE.SphereGeometry(0.18, 20, 14), skin, [0, 1.92, 0], [0, 0, 0], [0.92, 1.08, 0.92]);
    addVisitorPart(visitor, new THREE.SphereGeometry(0.185, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, [0, 2.02, -0.01], [0, 0, 0], [1, 0.72, 1]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.055, 0.56, 6, 10), jacket, [-0.25, 1.36, 0], [0.15, 0, -0.28], [1, 1, 1]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.055, 0.56, 6, 10), jacket, [0.25, 1.36, 0], [0.15, 0, 0.28], [1, 1, 1]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.07, 0.66, 6, 10), pants, [-0.1, 0.72, 0], [0, 0, 0.05], [1, 1, 1]);
    addVisitorPart(visitor, new THREE.CapsuleGeometry(0.07, 0.66, 6, 10), pants, [0.1, 0.72, 0], [0, 0, -0.05], [1, 1, 1]);
    visitor.coverPartIndexes = [3, 4];
  }

  if (visitor.role === "staff") {
    addStaffUniformDetails(visitor);
  }

  if (config.modelPath && config.style !== "voxel") {
    loadVisitorModel(config, visitor);
  }

  return visitor;
}

function addVoxelVisitorParts(visitor, materials) {
  const { skin, jacket, pants, hair } = materials;
  const isTall = visitor.species === "tall-being";
  const isRound = visitor.species === "round-being";
  const isFemale = visitor.gender === "female";
  const heightBoost = isTall ? 1.12 : isRound ? 0.88 : 1;
  const widthBoost = (isRound ? 1.14 : 1) * (isFemale ? 0.92 : 1.04);
  const torsoHeight = isFemale ? 0.68 : 0.72;
  const headWidth = isFemale ? 0.4 : 0.42;

  addVisitorPart(
    visitor,
    new THREE.BoxGeometry(0.48, torsoHeight, 0.26),
    jacket,
    [0, 1.3 * heightBoost, 0],
    [0, 0, 0],
    [widthBoost, heightBoost, 1]
  );
  addVisitorPart(
    visitor,
    new THREE.BoxGeometry(headWidth, 0.42, 0.42),
    skin,
    [0, 1.92 * heightBoost, 0],
    [0, 0, 0],
    [widthBoost, 1, 1]
  );
  addVisitorPart(
    visitor,
    new THREE.BoxGeometry(isFemale ? 0.44 : 0.46, isFemale ? 0.24 : 0.18, 0.44),
    hair,
    [0, (isFemale ? 2.11 : 2.15) * heightBoost, -0.01],
    [0, 0, 0],
    [widthBoost, 1, 1]
  );
  if (isFemale) {
    const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 0.14), hair);
    backHair.position.set(0, -0.1, -0.27);
    backHair.scale.set(widthBoost, 1, 1);
    backHair.castShadow = true;
    visitor.parts[1]?.add(backHair);
  }
  addVisitorPart(
    visitor,
    new THREE.BoxGeometry(0.16, 0.66, 0.18),
    jacket,
    [-0.35 * widthBoost, 1.24 * heightBoost, 0],
    [0.08, 0, -0.12],
    [1, heightBoost, 1]
  );
  addVisitorPart(
    visitor,
    new THREE.BoxGeometry(0.16, 0.66, 0.18),
    jacket,
    [0.35 * widthBoost, 1.24 * heightBoost, 0],
    [0.08, 0, 0.12],
    [1, heightBoost, 1]
  );
  addVisitorPart(
    visitor,
    new THREE.BoxGeometry(0.18, 0.7, 0.2),
    pants,
    [-0.13 * widthBoost, 0.62 * heightBoost, 0],
    [0, 0, 0.04],
    [1, heightBoost, 1]
  );
  addVisitorPart(
    visitor,
    new THREE.BoxGeometry(0.18, 0.7, 0.2),
    pants,
    [0.13 * widthBoost, 0.62 * heightBoost, 0],
    [0, 0, -0.04],
    [1, heightBoost, 1]
  );
  addVoxelFace(visitor);
  visitor.coverPartIndexes = [3, 4];
}

function addVoxelFace(visitor) {
  const head = visitor.parts[1];
  if (!head) return;
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x2d2a3f });
  const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x6f3428 });
  for (const x of [-0.09, 0.09]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.012), eyeMaterial);
    eye.position.set(x, 0.045, 0.217);
    head.add(eye);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.012), mouthMaterial);
  mouth.position.set(0, -0.09, 0.218);
  head.add(mouth);
}

function addStaffUniformDetails(visitor) {
  const badgeTexture = makeStaffBadgeTexture();
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.14),
    new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true, side: THREE.DoubleSide })
  );
  badge.position.set(0, 0.07, 0.205);
  badge.rotation.set(0, 0, 0);
  const torso = visitor.parts[0];
  if (torso) {
    torso.add(badge);
  } else {
    badge.position.set(0, 1.54 * visitor.visualScale, 0.18 * visitor.visualScale);
    visitor.group.add(badge);
  }

  const capMaterial = new THREE.MeshStandardMaterial({ color: 0x153b5c, roughness: 0.72 });
  const head = visitor.parts[1];
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.3), capMaterial);
  cap.position.set(0, 0.18, 0);
  cap.castShadow = true;
  cap.userData.originalPosition = cap.position.clone();
  cap.userData.originalRotation = cap.rotation.clone();
  cap.userData.originalScale = cap.scale.clone();

  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.18), capMaterial);
  brim.position.set(0, 0.13, 0.18);
  brim.castShadow = true;
  brim.userData.originalPosition = brim.position.clone();
  brim.userData.originalRotation = brim.rotation.clone();
  brim.userData.originalScale = brim.scale.clone();
  if (head) {
    head.add(cap);
    head.add(brim);
  } else {
    cap.position.set(0, 2.08 * visitor.visualScale, 0);
    brim.position.set(0, 2.05 * visitor.visualScale, 0.21 * visitor.visualScale);
    cap.scale.setScalar(visitor.visualScale);
    brim.scale.setScalar(visitor.visualScale);
    visitor.group.add(cap);
    visitor.group.add(brim);
  }

  const clipboardMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d1bd, roughness: 0.66 });
  const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.025), clipboardMaterial);
  clipboard.position.set(0, -0.08, 0.14);
  clipboard.rotation.set(0.28, -0.18, -0.12);
  clipboard.castShadow = true;
  clipboard.userData.originalPosition = clipboard.position.clone();
  clipboard.userData.originalRotation = clipboard.rotation.clone();
  clipboard.userData.originalScale = clipboard.scale.clone();
  const clipboardArm = visitor.parts[3];
  if (clipboardArm) {
    clipboardArm.add(clipboard);
  } else {
    clipboard.position.set(-0.34 * visitor.visualScale, 1.34 * visitor.visualScale, 0.16 * visitor.visualScale);
    clipboard.rotation.set(0.5, -0.35, -0.3);
    clipboard.scale.setScalar(visitor.visualScale);
    visitor.group.add(clipboard);
  }
}

function makeStaffBadgeTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#f6f2dc";
  ctx.fillRect(16, 28, c.width - 32, c.height - 56);
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 28, c.width - 32, c.height - 56);
  ctx.fillStyle = "#111827";
  ctx.font = "900 92px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("stuff", c.width / 2, c.height / 2 + 4);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return pixelTexture(texture);
}

function loadVisitorModel(config, visitor) {
  loadConfiguredModel(
    config.modelPath,
    (gltf) => {
      const previousParts = visitor.parts.slice();
      previousParts.forEach((part) => {
        unregisterShootTarget(part);
        visitor.group.remove(part);
        part.geometry?.dispose();
        part.material?.dispose();
      });

      const model = gltf.scene;
      model.name = config.id;
      const targetHeight = config.modelHeight ?? (visitor.species === "tall-being" ? 2.45 : visitor.species === "round-being" ? 1.55 : 2.05);
      const visualScale = visitor.visualScale ?? 1;
      normalizeModelToBox(model, new THREE.Vector3(0.85 * visualScale, targetHeight * visualScale, 0.85 * visualScale), { anchorY: 0 });
      visitor.parts = registerModelMeshes(model, "visitor", visitor);
      visitor.coverPartIndexes = [];
      visitor.model = model;
      visitor.group.add(model);
      prepareVisitorSkeletonAnimation(gltf, model, visitor, config);
      alignVisitorModelToFloor(visitor);
      addDialogue("System", `${config.id} GLB loaded.`);
    },
    () => addDialogue("System", `${config.id} GLB failed to load; using fallback visitor.`)
  );
}

function chooseVisitorWanderTarget(visitor) {
  const radius = 3.2 + Math.random() * 4.2;
  const angle = Math.random() * Math.PI * 2;
  visitor.wanderTarget.set(
    THREE.MathUtils.clamp(visitor.home.x + Math.cos(angle) * radius, player.bounds.minX + 0.8, player.bounds.maxX - 0.8),
    WORLD_FLOOR_Y,
    THREE.MathUtils.clamp(visitor.home.z + Math.sin(angle) * radius, player.bounds.minZ + 0.8, player.bounds.maxZ - 0.8)
  );
}

function chooseStaffBusyTarget(visitor) {
  const radius = visitor.workRadius * (0.35 + Math.random() * 0.65);
  const angle = Math.random() * Math.PI * 2;
  visitor.busyTarget.set(
    THREE.MathUtils.clamp(visitor.home.x + Math.cos(angle) * radius, player.bounds.minX + 0.8, player.bounds.maxX - 0.8),
    WORLD_FLOOR_Y,
    THREE.MathUtils.clamp(visitor.home.z + Math.sin(angle) * radius, player.bounds.minZ + 0.8, player.bounds.maxZ - 0.8)
  );
  const poses = ["inspect", "crouch", "clipboard", "adjust"];
  visitor.busyPose = poses[Math.floor(Math.random() * poses.length)];
}

function chooseVisitorHideTarget(visitor, threatPosition) {
  let bestSpot = VISITOR_HIDE_SPOTS[0];
  let bestScore = -Infinity;
  VISITOR_HIDE_SPOTS.forEach((spot) => {
    const distanceFromThreat = spot.distanceTo(threatPosition);
    const distanceFromVisitor = spot.distanceTo(visitor.group.position);
    const score = distanceFromThreat * 1.35 - distanceFromVisitor * 0.38 + Math.random() * 0.45;
    if (score > bestScore) {
      bestScore = score;
      bestSpot = spot;
    }
  });
  visitor.hideTarget.copy(bestSpot);
  visitor.hideTarget.x = THREE.MathUtils.clamp(visitor.hideTarget.x, player.bounds.minX + 0.55, player.bounds.maxX - 0.55);
  visitor.hideTarget.z = THREE.MathUtils.clamp(visitor.hideTarget.z, player.bounds.minZ + 0.55, player.bounds.maxZ - 0.55);
}

function alignVisitorModelToFloor(visitor) {
  const target = visitor.model ?? visitor.group;
  target.updateMatrixWorld(true);
  visitorFloorBox.makeEmpty();
  visitorFloorBox.setFromObject(target);
  if (visitorFloorBox.isEmpty()) return;

  const lift = WORLD_FLOOR_Y - visitorFloorBox.min.y;
  if (!Number.isFinite(lift) || Math.abs(lift) < 0.002) return;

  if (visitor.model) {
    visitor.model.position.y += lift;
    return;
  }

  visitor.parts.forEach((part) => {
    part.position.y += lift;
    if (part.userData.originalPosition) {
      part.userData.originalPosition.y += lift;
    }
  });
}

function prepareVisitorSkeletonAnimation(gltf, model, visitor, config) {
  visitor.animationMixer = null;
  visitor.animationActions.length = 0;
  visitor.bones = {};
  model.traverse((child) => {
    if (child.isBone) {
      visitor.bones[child.name] = child;
    }
  });

  const boneCount = Object.keys(visitor.bones).length;
  if (!gltf.animations || gltf.animations.length === 0) {
    addDialogue("System", `${config.id} skeleton has ${boneCount} bones and no embedded animation.`);
    return;
  }

  visitor.animationMixer = new THREE.AnimationMixer(model);
  const walkClip =
    gltf.animations.find((clip) => /walk|mixamo|layer0/i.test(clip.name)) ??
    gltf.animations[0];
  const action = visitor.animationMixer.clipAction(walkClip);
  action.reset();
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.enabled = true;
  action.play();
  visitor.animationActions.push(action);
  visitor.usesSkeletonAnimation = true;
  addDialogue("System", `${config.id} skeleton has ${boneCount} bones; playing ${walkClip.name || "walk"}.`);
}

function addVisitorPart(visitor, geometry, material, position, rotation, scale) {
  const part = new THREE.Mesh(geometry, material);
  const visualScale = visitor.visualScale ?? 1;
  part.position.set(position[0] * visualScale, position[1] * visualScale, position[2] * visualScale);
  part.rotation.set(...rotation);
  part.scale.set(scale[0] * visualScale, scale[1] * visualScale, scale[2] * visualScale);
  part.castShadow = true;
  part.receiveShadow = true;
  part.userData.originalPosition = part.position.clone();
  part.userData.originalRotation = part.rotation.clone();
  part.userData.originalScale = part.scale.clone();
  registerShootTarget(part, "visitor", visitor);
  visitor.parts.push(part);
  visitor.group.add(part);
  return part;
}

function makeWeapon() {
  weapon = new THREE.Group();
  weaponBasePosition = new THREE.Vector3(0.26, -0.56, -0.94);
  weapon.position.copy(weaponBasePosition);
  weapon.rotation.set(-0.08, -0.035, 0.015);
  weapon.scale.setScalar(0.82 * (WEAPON.scale ?? 1));

  const dark = new THREE.MeshStandardMaterial({ color: 0x343a31, metalness: 0.42, roughness: 0.4 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1d221c, roughness: 0.7 });
  const camo = new THREE.MeshStandardMaterial({ map: makeCamoTexture(), roughness: 0.82 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xb97845, roughness: 0.55 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x26302c,
    emissive: 0x101f18,
    roughness: 0.18,
    metalness: 0.15,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 1.76), dark);
  body.position.set(0, 0.04, -0.16);
  body.castShadow = true;
  weapon.add(body);

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 1.55), rubber);
  topRail.position.set(0, 0.18, -0.22);
  weapon.add(topRail);

  for (let i = 0; i < 9; i += 1) {
    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.045), rubber);
    notch.position.set(0, 0.23, -0.88 + i * 0.16);
    weapon.add(notch);
  }

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.38, 22), dark);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.08, -1.23);
  weapon.add(barrel);

  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.22, 22), dark);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.08, -2.0);
  weapon.add(muzzle);

  const scope = new THREE.Group();
  scope.position.set(0, 0.42, -0.64);
  const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.58, 28), glass);
  scopeTube.rotation.x = Math.PI / 2;
  scope.add(scopeTube);
  const scopeRingA = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 28), dark);
  scopeRingA.rotation.x = Math.PI / 2;
  scopeRingA.position.z = -0.32;
  scope.add(scopeRingA);
  const scopeRingB = scopeRingA.clone();
  scopeRingB.position.z = 0.32;
  scope.add(scopeRingB);
  const scopeMount = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.18), dark);
  scopeMount.position.y = -0.19;
  scope.add(scopeMount);
  weapon.add(scope);

  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.08), rubber);
  rearSight.position.set(0, 0.3, 0.48);
  weapon.add(rearSight);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.46, 0.2), rubber);
  handle.position.set(0.12, -0.27, 0.35);
  handle.rotation.x = -0.34;
  weapon.add(handle);

  const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.58, 0.18), dark);
  magazine.position.set(-0.04, -0.33, 0.0);
  magazine.rotation.x = 0.1;
  weapon.add(magazine);

  addArm(-0.34, -0.48, -0.52, 0.22, camo, skin);
  addArm(0.32, -0.5, 0.18, -0.24, camo, skin);

  const fallbackWeaponParts = weapon.children.slice();
  if (WEAPON.modelPath) {
    loadWeaponModel(fallbackWeaponParts);
  }

  muzzleFlash = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.72, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffc25a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.set(0, 0.08, -2.16);
  weapon.add(muzzleFlash);

  muzzleLight = new THREE.PointLight(0xffb14f, 0, 5.5, 2);
  muzzleLight.position.copy(muzzleFlash.position);
  weapon.add(muzzleLight);

  weapon.visible = false;
  camera.add(weapon);
  scene.add(camera);
}

function makeEmptyHand() {
  emptyHand = new THREE.Group();
  emptyHand.position.set(0.18, -0.72, -0.62);
  emptyHand.rotation.set(-0.55, 0.16, -0.18);

  const skin = new THREE.MeshStandardMaterial({ color: 0xb97845, roughness: 0.58 });
  const sleeve = new THREE.MeshStandardMaterial({ color: 0x52663f, roughness: 0.78 });
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.56, 8, 14), sleeve);
  forearm.rotation.x = Math.PI / 2.2;
  emptyHand.add(forearm);

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.24), skin);
  palm.position.set(0.02, 0.05, -0.32);
  palm.rotation.x = -0.28;
  emptyHand.add(palm);

  for (let i = 0; i < 4; i += 1) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.16, 5, 8), skin);
    finger.position.set(-0.066 + i * 0.044, 0.11, -0.46);
    finger.rotation.x = Math.PI / 2.5;
    emptyHand.add(finger);
  }

  camera.add(emptyHand);
}

function makeWeaponPickup() {
  weaponPickup = new THREE.Group();
  const pickupScale = WEAPON.scale ?? 1;
  const spots = [
    [-4.8, WORLD_FLOOR_Y, 10.6],
    [4.6, WORLD_FLOOR_Y, 9.2],
    [-5.2, WORLD_FLOOR_Y, 4.6],
    [5.0, WORLD_FLOOR_Y, 3.8],
    [0.8, WORLD_FLOOR_Y, -1.4],
    [-2.8, WORLD_FLOOR_Y, -3.8],
  ];
  weaponPickup.position.set(...spots[Math.floor(Math.random() * spots.length)]);
  weaponPickup.rotation.set(-Math.PI / 2, 0.72, 0.08);
  weaponPickup.scale.setScalar(pickupScale);

  const dark = new THREE.MeshStandardMaterial({ color: 0x30362f, metalness: 0.36, roughness: 0.42 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x151a14, roughness: 0.72 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.9), dark);
  body.castShadow = true;
  weaponPickup.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.62, 16), dark);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = -0.62;
  barrel.castShadow = true;
  weaponPickup.add(barrel);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.12), grip);
  handle.position.set(0.07, -0.2, 0.18);
  handle.rotation.x = -0.25;
  handle.castShadow = true;
  weaponPickup.add(handle);
  const glow = new THREE.PointLight(0xffdc7a, 0.85, 2.4, 2);
  glow.position.y = 0.35;
  weaponPickup.add(glow);

  settlePickupOnFloor(weaponPickup, 0.018);
  registerPickupTarget(weaponPickup, "weapon", 1.35 * pickupScale);
  scene.add(weaponPickup);
}

function loadWeaponModel(fallbackParts) {
  loadConfiguredModel(
    WEAPON.modelPath,
    (gltf) => {
      fallbackParts.forEach((part) => {
        weapon.remove(part);
        part.traverse?.((child) => {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material?.dispose();
          }
        });
      });

      const model = gltf.scene;
      model.name = WEAPON.id;
      normalizeModelToBox(model, new THREE.Vector3(0.7, 0.7, 2.35), { centerY: true });
      model.position.add(new THREE.Vector3(...(WEAPON.position ?? [0, 0, 0])));
      model.rotation.set(...(WEAPON.rotation ?? [0, 0, 0]));
      weapon.add(model);
      addDialogue("System", "Weapon GLB loaded.");
    },
    () => addDialogue("System", "Weapon GLB failed to load; using fallback weapon.")
  );
}

function addArm(x, y, z, rotZ, sleeveMaterial, skinMaterial) {
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.15, 0.86, 18), sleeveMaterial);
  sleeve.position.set(x, y, z);
  sleeve.rotation.set(Math.PI / 2.45, 0.12, rotZ);
  sleeve.castShadow = true;
  weapon.add(sleeve);

  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.28), skinMaterial);
  hand.position.set(x * 0.62, y + 0.09, z - 0.28);
  hand.rotation.set(-0.18, 0.1, rotZ * 0.8);
  hand.castShadow = true;
  weapon.add(hand);
}

function shoot() {
  if (shotCooldown > 0) return;
  shotCooldown = 0.12;
  playGunshot();
  muzzleFlash.material.opacity = 1;
  muzzleLight.intensity = 18;
  applyWeaponRecoil();
  alertVisitors(camera.position, { radius: 22, heardGunshot: true });

  const shotPointer = getShotPointer();
  raycaster.setFromCamera(shotPointer, camera);
  const hits = raycaster.intersectObjects(shootTargets, false);
  const muzzleWorld = new THREE.Vector3();
  muzzleFlash.getWorldPosition(muzzleWorld);
  const shotEnd = hits.length > 0 ? hits[0].point : raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 38);
  spawnBulletTrail(muzzleWorld, shotEnd);
  spawnCasing(muzzleWorld);
  spawnMuzzleSmoke(muzzleWorld);
  if (hits.length === 0) return;

  const hit = hits[0];
  const normal = getHitNormal(hit);
  if (hit.object.userData.shootType === "visitor") {
    reactVisitor(hit.object.userData.owner, hit.point, normal);
    return;
  }

  spawnBulletHole(hit.point, normal, hit.object);

  if (hit.object.userData.shootType === "destructible") {
    damageGalleryDestructible(hit.object.userData.owner, hit.point, normal);
  }
  if (hit.object.userData.shootType === "gallery-target") {
    damageGalleryTarget(hit.object.userData.owner, hit.point, normal);
  }
}

function getShotPointer() {
  const recoilSpread = weaponRecoilRotation.length() * 0.55 + Math.abs(recoilPitchVelocity) * 0.08;
  const bodySpread = bodyVelocity.length() * 0.0025;
  const visionSpread = hasGlasses ? 0.0025 : THREE.MathUtils.clamp(currentVisionBlur / 120, 0.004, 0.055);
  const spread = THREE.MathUtils.clamp(visionSpread + recoilSpread + bodySpread, 0.0025, 0.08);
  return new THREE.Vector2(
    pointer.x + aimRecoilOffset.x + (Math.random() + Math.random() - 1) * spread,
    pointer.y + aimRecoilOffset.y + (Math.random() + Math.random() - 1) * spread
  );
}

function applyWeaponRecoil() {
  const lateral = (Math.random() - 0.5) * 0.0385;
  weaponKickVelocity.x += lateral;
  weaponKickVelocity.y -= 0.03 + Math.random() * 0.018;
  weaponKickVelocity.z += 0.32 + Math.random() * 0.1;
  weaponAngularVelocity.x -= 0.328 + Math.random() * 0.109;
  weaponAngularVelocity.y += (Math.random() - 0.5) * 0.132;
  weaponAngularVelocity.z += (Math.random() - 0.5) * 0.099;

  const yawKick = (Math.random() - 0.5) * 0.0715;
  const pitchKick = 0.0936 + Math.random() * 0.0351;
  recoilPitchVelocity += pitchKick;
  recoilYawVelocity += yawKick;
  aimRecoilVelocity.y += pitchKick * 0.18;
  aimRecoilVelocity.x += yawKick * 0.22;
  targetPitch = THREE.MathUtils.clamp(targetPitch + 0.0273 + Math.random() * 0.0109, -1.22, 1.1);
  targetYaw += yawKick * 0.308;
}

function updateWeaponPhysics(delta) {
  if (!weapon?.visible) return;
  const stiffness = 48;
  const damping = 8.5;
  weaponKickVelocity.addScaledVector(weaponRecoilPosition, -stiffness * delta);
  weaponKickVelocity.multiplyScalar(Math.exp(-damping * delta));
  weaponRecoilPosition.addScaledVector(weaponKickVelocity, delta);

  weaponAngularVelocity.addScaledVector(weaponRecoilRotation, -stiffness * delta);
  weaponAngularVelocity.multiplyScalar(Math.exp(-damping * delta));
  weaponRecoilRotation.addScaledVector(weaponAngularVelocity, delta);

  weapon.position.copy(weaponBasePosition).add(weaponRecoilPosition);
  weapon.rotation.set(
    -0.08 + weaponRecoilRotation.x,
    -0.035 + weaponRecoilRotation.y,
    0.015 + weaponRecoilRotation.z
  );
}

function raiseEmptyHand() {
  emptyHandLiftVelocity += 8.8;
  addDialogue("System", "You do not have a weapon yet.");
}

function updateEmptyHand(delta) {
  if (!emptyHand) return;
  emptyHandLiftVelocity += (0 - emptyHandLift) * 42 * delta;
  emptyHandLiftVelocity *= Math.exp(-9 * delta);
  emptyHandLift += emptyHandLiftVelocity * delta;
  emptyHandLift = THREE.MathUtils.clamp(emptyHandLift, 0, 1);
  emptyHand.position.set(0.18, -0.72 + emptyHandLift * 0.33, -0.62 - emptyHandLift * 0.08);
  emptyHand.rotation.set(-0.55 - emptyHandLift * 0.62, 0.16, -0.18 + emptyHandLift * 0.12);
  emptyHand.visible = !hasWeapon || emptyHandLift > 0.02;
}

function pixelTexture(texture) {
  return texture;
}

function updatePlayerAim(delta) {
  recoilPitchVelocity *= Math.exp(-1.35 * delta);
  recoilYawVelocity *= Math.exp(-1.65 * delta);
  targetPitch = THREE.MathUtils.clamp(targetPitch + recoilPitchVelocity * delta, -1.22, 1.1);
  targetYaw += recoilYawVelocity * delta;

  aimRecoilVelocity.addScaledVector(aimRecoilOffset, -18 * delta);
  aimRecoilVelocity.multiplyScalar(Math.exp(-3.6 * delta));
  aimRecoilOffset.addScaledVector(aimRecoilVelocity, delta);
  aimRecoilOffset.x = THREE.MathUtils.clamp(aimRecoilOffset.x, -0.16, 0.16);
  aimRecoilOffset.y = THREE.MathUtils.clamp(aimRecoilOffset.y, -0.04, 0.22);
  const pxX = aimRecoilOffset.x * window.innerWidth * 0.5;
  const pxY = -aimRecoilOffset.y * window.innerHeight * 0.5;
  crosshairEl.style.setProperty("--recoil-x", `${pxX.toFixed(1)}px`);
  crosshairEl.style.setProperty("--recoil-y", `${pxY.toFixed(1)}px`);

  const response = 4.1;
  yaw = THREE.MathUtils.lerp(yaw, targetYaw, 1 - Math.exp(-response * delta));
  pitch = THREE.MathUtils.lerp(pitch, targetPitch, 1 - Math.exp(-response * 0.82 * delta));

  const instability = hasGlasses ? 0.0012 : 0.0024;
  const fatigue = 1 + THREE.MathUtils.clamp((100 - playerHp) / 100, 0, 0.8);
  yaw += Math.sin(clock.elapsedTime * 1.9) * instability * fatigue;
  pitch += Math.sin(clock.elapsedTime * 2.35 + 1.1) * instability * 0.72 * fatigue;
  pitch = THREE.MathUtils.clamp(pitch, -1.22, 1.1);
}

function damageGalleryDestructible(target, point, normal) {
  if (!target || target.destroyed) return;
  target.health = Math.max(0, target.health - 1);
  target.damage = 1 - target.health / target.maxHealth;
  spawnImpact(point, normal);
  showHitMarker();

  applyGalleryDestructibleDamage(target);
  if (target.id?.toLowerCase() === "as01") updateTargetHud();

  if (target.health > 0) {
    addDialogue("System", `${target.id} damaged ${target.maxHealth - target.health}/${target.maxHealth}.`);
    return;
  }

  target.destroyed = true;
  removeBulletHolesForDestructible(target);
  target.meshes.forEach((mesh) => {
    unregisterShootTarget(mesh);
    mesh.visible = false;
  });
  unregisterGalleryColliders(target);
  spawnGalleryDestructibleBreakup(target, point);
  target.object.visible = false;
  addDialogue("System", `${target.id} fully destroyed.`);
  if (target.id?.toLowerCase() === "as01") finishGame();
}

function applyGalleryDestructibleDamage(target) {
  const damage = target.damage;
  const wobble = 0.025 + damage * 0.075;
  const shrink = Math.max(0.72, 1 - damage * 0.18);
  const originalRotation = target.object.userData.originalRotation;
  const originalScale = target.object.userData.originalScale;
  target.object.rotation.set(
    originalRotation.x + (Math.random() - 0.5) * wobble,
    originalRotation.y + (Math.random() - 0.5) * wobble * 0.45,
    originalRotation.z + (Math.random() - 0.5) * wobble
  );
  target.object.scale.set(
    originalScale.x * (shrink + Math.random() * damage * 0.025),
    originalScale.y * Math.max(0.58, shrink - damage * 0.08),
    originalScale.z * (shrink + Math.random() * damage * 0.025)
  );

  target.meshes.forEach((mesh, index) => {
    const materialList = normalizeMaterialArray(mesh.material);
    materialList.forEach((material) => {
      if (!material) return;
      if (material.color) {
        const originalColor = material.userData.originalDamageColor ?? material.color;
        material.color.copy(originalColor).lerp(new THREE.Color(0x1d1711), 0.12 + damage * 0.18);
      }
      material.transparent = true;
      material.opacity = THREE.MathUtils.clamp(1 - damage * 0.34, 0.38, 1);
      material.needsUpdate = true;
    });

    const originalPosition = mesh.userData.originalPosition;
    const originalRotation = mesh.userData.originalRotation;
    const jitter = damage * 0.035;
    mesh.position.set(
      originalPosition.x + (Math.random() - 0.5) * jitter,
      originalPosition.y + Math.random() * jitter * 0.45,
      originalPosition.z + (Math.random() - 0.5) * jitter
    );
    mesh.rotation.set(
      originalRotation.x + Math.sin(index + damage * 6.2) * damage * 0.04,
      originalRotation.y,
      originalRotation.z + Math.cos(index * 1.7 + damage * 5.1) * damage * 0.04
    );
  });

  updateGalleryDestructibleColliders(target);
}

function updateGalleryDestructibleColliders(target) {
  target.object.updateMatrixWorld(true);
  target.colliders.forEach((collider) => {
    updateColliderBox(collider);
  });
}

function unregisterGalleryColliders(target) {
  for (const collider of target.colliders) {
    const index = galleryColliders.indexOf(collider);
    if (index >= 0) galleryColliders.splice(index, 1);
  }
  target.colliders.length = 0;
}

function removeBulletHolesForDestructible(target) {
  for (let i = bulletHoles.length - 1; i >= 0; i -= 1) {
    const hole = bulletHoles[i];
    if (hole.userData.destructibleOwner !== target) continue;
    scene.remove(hole);
    hole.traverse((child) => {
      child.geometry?.dispose();
      child.material?.dispose();
    });
    bulletHoles.splice(i, 1);
  }
}

function damageGalleryTarget(target, point, normal) {
  if (!target || target.destroyed) return;
  target.health = Math.max(0, target.health - 1);
  spawnImpact(point, normal);
  showHitMarker();
  updateTargetHud();

  const materialList = normalizeMaterialArray(target.mesh.material);
  materialList.forEach((material) => {
    if (!material) return;
    if (!target.mesh.userData.targetOriginalMaterial) {
      target.mesh.userData.targetOriginalMaterial = target.mesh.material;
    }
    material.opacity = THREE.MathUtils.clamp(0.35 + target.health / target.maxHealth, 0.35, 1);
    material.transparent = true;
    material.needsUpdate = true;
  });

  if (target.health > 0) {
    addDialogue("System", "as.008 damaged.");
    return;
  }

  target.destroyed = true;
  unregisterShootTarget(target.mesh);
  target.mesh.visible = false;
  addDialogue("System", "as.008 destroyed.");
}

function spawnGalleryDestructibleBreakup(target, point) {
  const object = target.object;
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const materialColor = getGalleryDestructibleColor(target);
  const material = new THREE.MeshBasicMaterial({ color: materialColor, transparent: true, opacity: 0.86 });
  const shardCount = THREE.MathUtils.clamp(Math.round(24 + Math.max(size.x, size.y, size.z) * 10), 28, 72);

  for (let i = 0; i < shardCount; i += 1) {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.045 + Math.random() * 0.12,
        0.035 + Math.random() * 0.11,
        0.045 + Math.random() * 0.12
      ),
      material.clone()
    );
    shard.position.set(
      THREE.MathUtils.lerp(box.min.x, box.max.x, Math.random()),
      THREE.MathUtils.lerp(box.min.y, box.max.y, Math.random()),
      THREE.MathUtils.lerp(box.min.z, box.max.z, Math.random())
    );
    const outward = shard.position.clone().sub(center);
    if (outward.lengthSq() < 0.01) outward.copy(point).sub(center);
    if (outward.lengthSq() < 0.01) outward.set(Math.random() - 0.5, Math.random(), Math.random() - 0.5);
    outward.normalize();
    shard.userData.velocity = outward
      .multiplyScalar(1.6 + Math.random() * 2.6)
      .add(new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 1.6, (Math.random() - 0.5) * 1.2));
    shard.userData.life = 0.85 + Math.random() * 0.75;
    shard.scale.multiplyScalar(THREE.MathUtils.clamp(Math.max(size.x, size.y, size.z) * 0.12, 0.65, 1.6));
    bullets.push(shard);
    scene.add(shard);
  }
}

function getGalleryDestructibleColor(target) {
  for (const mesh of target.meshes) {
    const color = getMaterialColor(mesh.material);
    if (color) return color;
  }
  return 0xffdf6d;
}

function getMaterialColor(material) {
  const first = Array.isArray(material) ? material.find((item) => item?.color) : material;
  return first?.color?.getHex?.() ?? 0xffdf6d;
}

function reactVisitor(visitor, point, normal) {
  if (!visitor || visitor.destroyed) return;
  if (visitor.state === "down") {
    damageDownedVisitor(visitor, point, normal);
    return;
  }
  visitor.hp = Math.max(0, visitor.hp - 1);
  spawnBloodSpray(point, normal);
  if (visitor.hp <= 0) {
    downVisitor(visitor, point);
  }
  alertVisitors(visitor.group.position);
  spawnVisitorHitCue(point, normal);
  showHitMarker();
}

function damageDownedVisitor(visitor, point, normal) {
  visitor.downDamage += 1;
  visitor.group.position.y = WORLD_FLOOR_Y;
  visitor.parts.forEach((part, index) => {
    part.rotation.x += (Math.random() - 0.5) * 0.18;
    part.rotation.z += visitor.downTilt * 0.08 + (Math.random() - 0.5) * 0.12;
    part.scale.multiplyScalar(0.96 - (index % 2) * 0.015);
  });
  spawnBloodSpray(point, normal);
  spawnImpact(point, normal);
  showHitMarker();
  if (visitor.downDamage >= 4) {
    destroyVisitor(visitor, point);
  }
}

function destroyVisitor(visitor, point) {
  visitor.destroyed = true;
  visitor.state = "destroyed";
  spawnAbstractBreakup(visitor, point);
  visitor.parts.forEach((part) => {
    unregisterShootTarget(part);
    part.visible = false;
  });
  addDialogue("System", "Downed figure destroyed.");
}

function unregisterShootTarget(mesh) {
  const index = shootTargets.indexOf(mesh);
  if (index >= 0) shootTargets.splice(index, 1);
}

function spawnAbstractBreakup(visitor, point) {
  const materials = [
    new THREE.MeshBasicMaterial({ color: 0x161616, transparent: true, opacity: 0.92 }),
    new THREE.MeshBasicMaterial({ color: 0x8a1010, transparent: true, opacity: 0.72 }),
    new THREE.MeshBasicMaterial({ color: 0x3a2d24, transparent: true, opacity: 0.78 }),
  ];
  for (let i = 0; i < 26; i += 1) {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 + Math.random() * 0.08, 0.025 + Math.random() * 0.06, 0.04 + Math.random() * 0.08),
      materials[i % materials.length].clone()
    );
    shard.position.copy(point).add(new THREE.Vector3((Math.random() - 0.5) * 0.7, Math.random() * 0.5, (Math.random() - 0.5) * 0.7));
    shard.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 2.8, 0.8 + Math.random() * 1.6, (Math.random() - 0.5) * 2.8);
    shard.userData.life = 0.8 + Math.random() * 0.65;
    bullets.push(shard);
    scene.add(shard);
  }
}

function downVisitor(visitor, point) {
  visitor.state = "down";
  visitor.panic = 0;
  visitor.wobble = 0;
  visitor.velocity.set(0, 0, 0);
  visitor.group.rotation.x = 0;
  visitor.group.rotation.z = visitor.downTilt * (Math.PI / 2.55);
  visitor.group.position.y = WORLD_FLOOR_Y + 0.18;
  visitor.parts.forEach((part, index) => {
    const originalRotation = part.userData.originalRotation;
    part.rotation.x = originalRotation.x + (index % 2 === 0 ? 0.2 : -0.15);
    part.rotation.z = originalRotation.z + visitor.downTilt * 0.16;
  });
  addDialogue("Visitor", "Someone is down!");
}

function alertVisitors(origin, options = {}) {
  const radius = options.radius ?? 9;
  const heardGunshot = options.heardGunshot ?? false;
  visitors.forEach((other) => {
    if (other.state === "down" || other.state === "destroyed") return;
    const distance = other.group.position.distanceTo(origin);
    if (distance > radius) return;
    const towardPlayer = camera.position.clone().sub(other.group.position);
    towardPlayer.y = 0;
    if (other.behavior === "aggressive") {
      other.velocity.copy(towardPlayer.normalize().multiplyScalar(1.35));
      other.state = "hostile";
      other.panic = heardGunshot ? 7.2 : 4.2;
      other.wobble = 0.45;
    } else {
      if (heardGunshot) {
        chooseVisitorHideTarget(other, origin);
        const toHide = other.hideTarget.clone().sub(other.group.position);
        toHide.y = 0;
        if (toHide.lengthSq() < 0.01) toHide.set(Math.random() - 0.5, 0, Math.random() - 0.5);
        other.velocity.copy(toHide.normalize().multiplyScalar(2.85));
        other.state = "hide";
        other.panic = 7.5;
        other.wobble = 0.62;
      } else {
        const away = towardPlayer.multiplyScalar(-1);
        if (away.lengthSq() < 0.01) away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
        other.velocity.copy(away.normalize().multiplyScalar(3.0));
        other.state = "flee";
        other.panic = 3.6;
        other.wobble = 0.55;
      }
    }
  });
}

function spawnBloodSpray(point, normal) {
  const material = new THREE.MeshBasicMaterial({ color: 0x9b1010, transparent: true, opacity: 0.88 });
  for (let i = 0; i < 18; i += 1) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.018 + Math.random() * 0.018, 8, 6), material.clone());
    drop.position.copy(point).addScaledVector(normal, 0.025);
    const scatter = new THREE.Vector3(
      (Math.random() - 0.5) * 2.1,
      Math.random() * 1.5,
      (Math.random() - 0.5) * 2.1
    );
    drop.userData.velocity = scatter.addScaledVector(normal, 1.2 + Math.random() * 1.4);
    drop.userData.life = 0.42 + Math.random() * 0.28;
    bullets.push(drop);
    scene.add(drop);
  }
}

function makeVisitorAttack(visitor) {
  visitor.attackCooldown = 0.8;
  visitor.wobble = 0.55;
  damagePlayer(9);
  addDialogue("Visitor", "Step back!");
}

function damagePlayer(amount) {
  const armorBlock = Math.min(playerArmor, Math.ceil(amount * 0.55));
  playerArmor -= armorBlock;
  playerHp = Math.max(0, playerHp - (amount - armorBlock));
  damageOverlay.classList.add("damageOverlay--show");
  setTimeout(() => damageOverlay.classList.remove("damageOverlay--show"), 140);
  if (playerHp <= 0) {
    gameOver();
  }
}

function gameOver() {
  document.exitPointerLock?.();
  endTitle.textContent = "Player down";
  endMessage.textContent = "You were forced out of the gallery.";
  endPanel.classList.remove("panel--hidden");
}

function setTickerText(text) {
  visionTickerLines.forEach((line) => {
    line.textContent = text;
  });
}

function restoreDefaultTicker() {
  visionTicker?.classList.remove("statusBar--system");
  setTickerText(DEFAULT_TICKER_TEXT);
}

function showSystemTicker(text) {
  if (!visionTicker) return;
  window.clearTimeout(systemTickerTimer);
  visionTicker.classList.add("statusBar--system");
  setTickerText(`SYSTEM - ${text}`);
  systemTickerTimer = window.setTimeout(restoreDefaultTicker, 7000);
}

function addDialogue(speaker, text) {
  if (speaker === "System") {
    showSystemTicker(text);
    return;
  }
  const line = document.createElement("div");
  line.className = "dialogueLog__line";
  line.textContent = `${speaker}: ${text}`;
  dialogueLog.append(line);
  while (dialogueLog.children.length > 5) {
    dialogueLog.firstElementChild?.remove();
  }
  window.setTimeout(() => line.remove(), 9000);
}

function maybeVisitorTalk(delta) {
  chatterCooldown -= delta;
  if (chatterCooldown > 0) return;
  const calm = visitors.filter((visitor) => visitor.state === "calm" && !visitor.destroyed);
  if (calm.length < 2) return;
  chatterCooldown = 3.5 + Math.random() * 3.5;
  const staffNearby = calm.filter((visitor) => visitor.role === "staff");
  if (staffNearby.length > 0 && Math.random() < 0.46) {
    const staffLines = [
      "Check the sightline from the entrance before we lock the plinth.",
      "The label height is fighting the sculpture; lower it by two centimeters.",
      "Keep the cable run invisible, but leave access for the media player.",
      "This work needs more negative space, otherwise the provocation gets muddy.",
      "Light spill on the floor is too loud. Flag it before opening.",
    ];
    addDialogue("stuff", staffLines[Math.floor(Math.random() * staffLines.length)]);
    return;
  }
  const visitorLines = [
    "I kind of like it, but I can see why a pro-China politician would hate it.",
    "Is the work mocking nationalism, or just letting it embarrass itself?",
    "This is provocative in a very specific direction.",
    "The pink tone feels cute until the politics catches up.",
    "I came in amused, then realized the joke has teeth.",
    "Someone very loyal to Beijing would probably call this disrespectful.",
  ];
  addDialogue("Visitor", visitorLines[Math.floor(Math.random() * visitorLines.length)]);
}

function spawnVisitorHitCue(point, normal) {
  const cue = new THREE.Mesh(
    new THREE.RingGeometry(0.09, 0.16, 26),
    new THREE.MeshBasicMaterial({
      color: 0xffdf6d,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  cue.position.copy(point).addScaledVector(normal, 0.025);
  cue.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  cue.userData.life = 0.24;
  bullets.push(cue);
  scene.add(cue);
}

function getHitNormal(hit) {
  if (!hit.face) return camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-1);
  const normal = hit.face.normal.clone();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  return normal.applyNormalMatrix(normalMatrix).normalize();
}

function finishGame() {
  document.exitPointerLock?.();
  endTitle.textContent = "Target work destroyed";
  endMessage.textContent = "If the browser blocks auto-close, close this tab manually.";
  endPanel.classList.remove("panel--hidden");
  setTimeout(() => {
    window.close();
  }, 650);
}

function spawnImpact(point, normal = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-1)) {
  const material = new THREE.MeshBasicMaterial({ color: 0xffe1a0, transparent: true, opacity: 0.95 });
  for (let i = 0; i < 14; i += 1) {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.045), material.clone());
    chip.position.copy(point).addScaledVector(normal, 0.025);
    const scatter = new THREE.Vector3(
      (Math.random() - 0.5) * 2.7,
      Math.random() * 1.55,
      (Math.random() - 0.5) * 2.7
    );
    chip.userData.velocity = scatter.addScaledVector(normal, 0.9 + Math.random() * 0.7);
    chip.userData.life = 0.55 + Math.random() * 0.28;
    bullets.push(chip);
    scene.add(chip);
  }
}

function spawnAirLeak(point, normal, collapse) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xeef7ff,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const count = 12 + Math.round(collapse * 18);
  for (let i = 0; i < count; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.025 + Math.random() * 0.045, 10, 8), material.clone());
    puff.position.copy(point).addScaledVector(normal, 0.04);
    puff.userData.velocity = normal
      .clone()
      .multiplyScalar(1.8 + Math.random() * 2.5)
      .add(new THREE.Vector3((Math.random() - 0.5) * 0.7, Math.random() * 0.35, (Math.random() - 0.5) * 0.7));
    puff.userData.life = 0.45 + Math.random() * 0.35;
    bullets.push(puff);
    scene.add(puff);
  }
}

function spawnBulletHole(point, normal, hitObject = null) {
  const hole = new THREE.Group();
  hole.position.copy(point).addScaledVector(normal, 0.018);
  hole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  hole.rotateZ(Math.random() * Math.PI * 2);
  if (hitObject?.userData.shootType === "destructible") {
    hole.userData.destructibleOwner = hitObject.userData.owner;
  }

  const radius = 0.025 + Math.random() * 0.016;
  const center = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 22),
    new THREE.MeshBasicMaterial({
      color: 0x080604,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  hole.add(center);

  const rim = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.82, radius * 1.75, 24),
    new THREE.MeshBasicMaterial({
      color: 0x2f251d,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  rim.position.z = 0.001;
  hole.add(rim);

  const crackMaterial = new THREE.LineBasicMaterial({ color: 0x160f0b, transparent: true, opacity: 0.62 });
  for (let i = 0; i < 4; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const length = radius * (1.8 + Math.random() * 1.6);
    const points = [
      new THREE.Vector3(Math.cos(angle) * radius * 0.25, Math.sin(angle) * radius * 0.25, 0.002),
      new THREE.Vector3(Math.cos(angle) * length, Math.sin(angle) * length, 0.002),
    ];
    hole.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), crackMaterial.clone()));
  }

  bulletHoles.push(hole);
  scene.add(hole);
  if (bulletHoles.length > MAX_BULLET_HOLES) {
    const old = bulletHoles.shift();
    scene.remove(old);
    old.traverse((child) => {
      child.geometry?.dispose();
      child.material?.dispose();
    });
  }
}

function spawnBulletTrail(from, to) {
  const midpoint = from.clone().lerp(to, 0.5);
  const direction = to.clone().sub(from);
  const length = Math.max(0.1, direction.length());
  const trail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.004, length, 8, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffd37a,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  trail.position.copy(midpoint);
  trail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  trail.userData.life = 0.08;
  bulletTrails.push(trail);
  scene.add(trail);
}

function spawnCasing(muzzleWorld) {
  const casingMaterial = new THREE.MeshStandardMaterial({
    color: 0xc48b3c,
    metalness: 0.65,
    roughness: 0.28,
  });
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.13, 14), casingMaterial);
  const side = new THREE.Vector3(1, -0.15, 0.08).applyQuaternion(camera.quaternion).normalize();
  casing.position.copy(muzzleWorld).addScaledVector(side, 0.28);
  casing.rotation.set(Math.random(), Math.random(), Math.random());
  casing.userData.velocity = side.multiplyScalar(2.2).add(new THREE.Vector3(0, 1.35, 0));
  casing.userData.spin = new THREE.Vector3(12 + Math.random() * 8, 8 + Math.random() * 7, 4);
  casing.userData.life = 1.15;
  casings.push(casing);
  scene.add(casing);
}

function spawnMuzzleSmoke(muzzleWorld) {
  const smokeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc9c0a8,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  for (let i = 0; i < 5; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.035 + Math.random() * 0.035, 10, 8), smokeMaterial.clone());
    puff.position.copy(muzzleWorld);
    puff.userData.velocity = camera
      .getWorldDirection(new THREE.Vector3())
      .multiplyScalar(0.8 + Math.random() * 0.6)
      .add(new THREE.Vector3((Math.random() - 0.5) * 0.55, Math.random() * 0.28, (Math.random() - 0.5) * 0.55));
    puff.userData.life = 0.45 + Math.random() * 0.25;
    bullets.push(puff);
    scene.add(puff);
  }
}

function showHitMarker() {
  hitMarker.classList.add("hitMarker--show");
  setTimeout(() => hitMarker.classList.remove("hitMarker--show"), 110);
}

function updateTargetHud() {
  if (!targetEntity) {
    targetNameEl.textContent = "Unassigned";
    targetHealthEl.textContent = "Integrity --";
    return;
  }
  targetNameEl.textContent = targetEntity.name;
  const percent = Math.round((targetEntity.getHealth() / targetEntity.getMaxHealth()) * 100);
  targetHealthEl.textContent = `Integrity ${percent}%`;
}

function onMouseMove(event) {
  if (!isPointerLocked) return;
  targetYaw -= event.movementX * 0.0022;
  targetPitch -= event.movementY * 0.0022;
  targetPitch = THREE.MathUtils.clamp(targetPitch, -1.22, 1.1);
}

function movePlayer(delta) {
  if ((keys.has("Space") || keys.has("KeyX")) && isGrounded) {
    playerVelocityY = 4.2;
    isGrounded = false;
  }
  const crouching = keys.has("ControlLeft") || keys.has("ControlRight") || keys.has("KeyC");
  targetEyeHeight = crouching ? PLAYER.eyeHeight * 0.58 : PLAYER.eyeHeight;
  eyeHeight = THREE.MathUtils.lerp(eyeHeight, targetEyeHeight, 12 * delta);

  const baseSpeed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? player.sprintSpeed : player.walkSpeed;
  const speed = crouching ? baseSpeed * 0.48 : baseSpeed;
  const forward = Number(keys.has("KeyW")) - Number(keys.has("KeyS"));
  const side = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
  const inputDir = new THREE.Vector3(side, 0, -forward);
  const desiredVelocity = new THREE.Vector3();
  if (inputDir.lengthSq() > 0) {
    inputDir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    desiredVelocity.copy(inputDir).multiplyScalar(speed * 0.72);
  }
  bodyVelocity.lerp(desiredVelocity, 3.2 * delta);
  camera.position.addScaledVector(bodyVelocity, delta);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, player.bounds.minX, player.bounds.maxX);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, player.bounds.minZ, player.bounds.maxZ);
  resolvePlayerWallCollisions();
  bodySway += bodyVelocity.length() * delta * 4.5;
  playerVelocityY -= 13.5 * delta;
  camera.position.y += playerVelocityY * delta;
  const standingEyeY = WORLD_FLOOR_Y + eyeHeight;
  if (camera.position.y <= standingEyeY) {
    camera.position.y = standingEyeY;
    playerVelocityY = 0;
    isGrounded = true;
  }
  if (isGrounded) {
    const swayAmount = THREE.MathUtils.clamp(bodyVelocity.length() / player.walkSpeed, 0, 1) * 0.035;
    camera.position.y += Math.abs(Math.sin(bodySway)) * swayAmount;
    camera.rotation.z = Math.sin(bodySway * 0.5) * swayAmount * 0.45;
  } else {
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, 8 * delta);
  }
  player.group.position.x = camera.position.x;
  player.group.position.y = WORLD_FLOOR_Y;
  player.group.position.z = camera.position.z;
}

function resolvePlayerWallCollisions() {
  const radius = player.radius;
  const bodyMinY = camera.position.y - eyeHeight + 0.15;
  const bodyMaxY = camera.position.y + 0.2;

  for (const collider of galleryColliders) {
    const box = collider.box;
    if (box.max.y < bodyMinY || box.min.y > bodyMaxY) continue;

    const minX = box.min.x - radius;
    const maxX = box.max.x + radius;
    const minZ = box.min.z - radius;
    const maxZ = box.max.z + radius;
    const x = camera.position.x;
    const z = camera.position.z;
    if (x < minX || x > maxX || z < minZ || z > maxZ) continue;

    const pushLeft = Math.abs(x - minX);
    const pushRight = Math.abs(maxX - x);
    const pushBack = Math.abs(z - minZ);
    const pushForward = Math.abs(maxZ - z);
    const minPush = Math.min(pushLeft, pushRight, pushBack, pushForward);

    if (minPush === pushLeft) {
      camera.position.x = minX;
      bodyVelocity.x = Math.min(0, bodyVelocity.x);
    } else if (minPush === pushRight) {
      camera.position.x = maxX;
      bodyVelocity.x = Math.max(0, bodyVelocity.x);
    } else if (minPush === pushBack) {
      camera.position.z = minZ;
      bodyVelocity.z = Math.min(0, bodyVelocity.z);
    } else {
      camera.position.z = maxZ;
      bodyVelocity.z = Math.max(0, bodyVelocity.z);
    }
  }

  camera.position.x = THREE.MathUtils.clamp(camera.position.x, player.bounds.minX, player.bounds.maxX);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, player.bounds.minZ, player.bounds.maxZ);
}

function updatePickups(delta) {
  for (let i = pickupTargets.length - 1; i >= 0; i -= 1) {
    const pickup = pickupTargets[i];
    if (Number.isFinite(pickup.userData.groundY)) {
      pickup.position.y = pickup.userData.groundY;
    }
    const distance = Math.hypot(pickup.position.x - camera.position.x, pickup.position.z - camera.position.z);
    if (distance > pickup.userData.radius) continue;
    if (pickup.userData.pickupType === "glasses") {
      collectGlasses(pickup);
      pickupTargets.splice(i, 1);
    }
    if (pickup.userData.pickupType === "weapon") {
      collectWeapon(pickup);
      pickupTargets.splice(i, 1);
    }
  }
}

function collectWeapon(pickup) {
  if (hasWeapon) return;
  hasWeapon = true;
  weapon.visible = true;
  emptyHand.visible = false;
  scene.remove(pickup);
  if (weaponPickup === pickup) weaponPickup = null;
  pickup.traverse((child) => {
    child.geometry?.dispose();
    child.material?.dispose();
  });
  addDialogue("System", "Weapon acquired.");
}

function collectGlasses(pickup) {
  if (hasGlasses) return;
  hasGlasses = true;
  gameEl.classList.add("vision-clear");
  gameEl.classList.remove("no-glasses");
  scene.remove(pickup);
  if (glassesPickup === pickup) glassesPickup = null;
  pickup.traverse((child) => {
    child.geometry?.dispose();
    child.material?.dispose();
  });
  addDialogue("System", "Glasses acquired.");
}

function updateRadar() {
  updateRadarDot(radarGlassesDot, glassesPickup, !hasGlasses);
  updateRadarDot(radarWeaponDot, weaponPickup, !hasWeapon);
  updateRadarDot(radarGoalDot, goalTarget?.mesh, !goalTarget?.destroyed);
}

function updateRadarDot(dot, target, visible = true) {
  if (!dot || !target || !visible) {
    if (dot) dot.style.opacity = "0";
    return;
  }

  const targetPosition = new THREE.Vector3();
  target.getWorldPosition?.(targetPosition);
  if (!target.getWorldPosition) targetPosition.copy(target.position);

  const offset = targetPosition.sub(camera.position);
  offset.y = 0;
  const distance = offset.length();
  const radarRange = 18;
  const normalizedDistance = THREE.MathUtils.clamp(distance / radarRange, 0, 1);
  const angle = Math.atan2(offset.x, offset.z) - yaw;
  const x = Math.sin(angle) * normalizedDistance * 44;
  const y = -Math.cos(angle) * normalizedDistance * 44;

  dot.style.left = `${50 + x}%`;
  dot.style.top = `${50 + y}%`;
  dot.style.opacity = "1";
}

function updateVisitorSpawner(delta) {
  if (!entrance) return;
  const activeCount = visitors.filter((visitor) => visitor.role !== "staff" && visitor.state !== "down" && !visitor.destroyed).length;
  if (activeCount >= 9) return;
  visitorSpawnCooldown -= delta;
  if (visitorSpawnCooldown > 0) return;
  visitorSpawnCooldown = 5.2 + Math.random() * 4.2;
  spawnVisitorFromEntrance();
}

function spawnVisitorFromEntrance() {
  if (!VISITOR_ENTRY_POSITION) return;
  const species = ["human", "tall-being", "round-being"][Math.floor(Math.random() * 3)];
  const behavior = Math.random() < 0.42 ? "aggressive" : "coward";
  const gender = spawnedVisitorCount % 2 === 0 ? "male" : "female";
  const palette = [
    [0x5f756f, 0x3f4656, 0x3a2c24],
    [0x7b8064, 0x5d4a42, 0x6d4a35],
    [0x66705a, 0x30383c, 0x332820],
    [0x7a6371, 0x3b353c, 0x2d211c],
    [0x8a8065, 0x342f2c, 0x3f2a1f],
  ][spawnedVisitorCount % 5];
  const config = {
    id: `spawned-${spawnedVisitorCount}`,
    style: "voxel",
    gender,
    species,
    behavior,
    position: [
      VISITOR_ENTRY_POSITION[0] + (Math.random() - 0.5) * 0.9,
      WORLD_FLOOR_Y,
      VISITOR_ENTRY_POSITION[2] - 0.34,
    ],
    rotationY: Math.PI,
    jacket: palette[0],
    pants: palette[1],
    hair: palette[2],
  };
  spawnedVisitorCount += 1;
  const visitor = createVisitor(config, visitors.length);
  visitor.state = "entering";
  visitor.panic = 2.8;
  visitor.velocity.set((Math.random() - 0.5) * 0.45, 0, -1.05);
  visitors.push(visitor);
  scene.add(visitor.group);
  addDialogue("Entrance", behavior === "aggressive" ? "A tense visitor enters the gallery." : "A hurried visitor enters the gallery.");
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  shotCooldown = Math.max(0, shotCooldown - delta);
  if (muzzleFlash) muzzleFlash.material.opacity = Math.max(0, muzzleFlash.material.opacity - delta * 10);
  if (muzzleLight) muzzleLight.intensity = Math.max(0, muzzleLight.intensity - delta * 120);
  updateWeaponPhysics(delta);
  updateEmptyHand(delta);

  camera.rotation.order = "YXZ";
  updatePlayerAim(delta);
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  movePlayer(delta);
  updateVisionFocus();
  updatePickups(delta);
  updateRadar();
  updateVisitorSpawner(delta);
  updateVisitors(delta);
  maybeVisitorTalk(delta);
  syncGalleryVideos(delta);
  updateGalleryMorphAnimations(delta);
  updateParticles(delta);
  updateBulletTrails(delta);
  updateCasings(delta);

  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCamera);
}

function updateVisionFocus() {
  if (hasGlasses) {
    currentVisionBlur = 0;
    presbyopiaMaterial.uniforms.enabled.value = 0;
    return;
  }
  focusRaycaster.setFromCamera(pointer, camera);
  const focusTargets = shootTargets.concat(pickupTargets);
  const hits = focusRaycaster.intersectObjects(focusTargets, true);
  const focusDistance = hits.length > 0 ? hits[0].distance : 14;
  const nearBlur = THREE.MathUtils.clamp((6.5 - focusDistance) / 5.5, 0, 1);
  currentVisionBlur = 0.3 + nearBlur * nearBlur * 6.5;
  presbyopiaMaterial.uniforms.enabled.value = 1;
  presbyopiaMaterial.uniforms.blurStrength.value = 0.77 + nearBlur * 1.05;
  presbyopiaMaterial.uniforms.distortion.value = 0.018 + nearBlur * 0.05;
}

function updateGalleryMorphAnimations(delta) {
  galleryMorphAnimations.forEach((animation) => {
    const influences = animation.mesh.morphTargetInfluences;
    if (!influences) return;
    if (animation.target.destroyed || !animation.mesh.visible) {
      influences[animation.influenceIndex] = 0;
      return;
    }
    influences[animation.influenceIndex] = updateMorphHoldCycle(animation, delta);
  });
}

function updateMorphHoldCycle(animation, delta) {
  const now = clock.elapsedTime;
  const step = ((animation.high - animation.low) / animation.transitionDuration) * delta;
  if (animation.state === "hold-low") {
    animation.value = animation.low;
    if (now >= animation.holdUntil) animation.state = "rising";
  } else if (animation.state === "rising") {
    animation.value = Math.min(animation.high, animation.value + step);
    if (animation.value >= animation.high) {
      animation.state = "hold-high";
      animation.holdUntil = now + animation.holdHighDuration;
    }
  } else if (animation.state === "hold-high") {
    animation.value = animation.high;
    if (now >= animation.holdUntil) animation.state = "falling";
  } else if (animation.state === "falling") {
    animation.value = Math.max(animation.low, animation.value - step);
    if (animation.value <= animation.low) {
      animation.state = "hold-low";
      animation.holdUntil = now + animation.holdLowDuration;
    }
  }
  return animation.value;
}

function lerpAngle(from, to, alpha) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * alpha;
}

function updateVisitors(delta) {
  visitors.forEach((visitor, index) => {
    visitor.animationMixer?.update(delta);
    alignVisitorModelToFloor(visitor);
    if (visitor.state === "down") {
      visitor.group.position.y = THREE.MathUtils.lerp(visitor.group.position.y, WORLD_FLOOR_Y + 0.1, 8 * delta);
      visitor.group.rotation.z = THREE.MathUtils.lerp(visitor.group.rotation.z, visitor.downTilt * (Math.PI / 2.55), 8 * delta);
      return;
    }
    if (visitor.state === "destroyed") return;

    if (visitor.state === "entering") {
      visitor.panic = Math.max(0, visitor.panic - delta);
      visitor.group.position.addScaledVector(visitor.velocity, delta);
      visitor.group.position.y = WORLD_FLOOR_Y;
      visitor.group.position.x = THREE.MathUtils.clamp(visitor.group.position.x, player.bounds.minX, player.bounds.maxX);
      visitor.group.position.z = THREE.MathUtils.clamp(visitor.group.position.z, player.bounds.minZ, player.bounds.maxZ);
      visitor.group.rotation.y = Math.atan2(visitor.velocity.x, visitor.velocity.z);
      if (visitor.panic <= 0 || visitor.group.position.z < 11.6) {
        visitor.state = "calm";
        visitor.velocity.set(0, 0, 0);
      }
    } else if (visitor.state === "hostile") {
      visitor.panic = Math.max(0, visitor.panic - delta * 0.35);
      visitor.attackCooldown = Math.max(0, visitor.attackCooldown - delta);
      visitor.wobble = Math.max(0.12, visitor.wobble - delta * 0.4);

      const towardPlayer = camera.position.clone().sub(visitor.group.position);
      towardPlayer.y = 0;
      const distance = towardPlayer.length();
      if (distance > 0.001) {
        towardPlayer.normalize();
        visitor.velocity.lerp(towardPlayer.multiplyScalar(distance > 1.15 ? 1.85 : 0), 5 * delta);
        visitor.group.rotation.y = Math.atan2(visitor.velocity.x || towardPlayer.x, visitor.velocity.z || towardPlayer.z);
      }
      visitor.group.position.addScaledVector(visitor.velocity, delta);
      visitor.group.position.y = WORLD_FLOOR_Y;
      visitor.group.position.x = THREE.MathUtils.clamp(visitor.group.position.x, player.bounds.minX, player.bounds.maxX);
      visitor.group.position.z = THREE.MathUtils.clamp(visitor.group.position.z, player.bounds.minZ, player.bounds.maxZ);

      if (distance < 1.2 && visitor.attackCooldown <= 0 && playerHp > 0) {
        makeVisitorAttack(visitor);
      }
    } else if (visitor.state === "flee") {
      visitor.panic = Math.max(0, visitor.panic - delta);
      visitor.wobble = Math.max(0.08, visitor.wobble - delta * 1.4);
      visitor.group.position.addScaledVector(visitor.velocity, delta);
      visitor.group.position.y = WORLD_FLOOR_Y;
      visitor.group.position.x = THREE.MathUtils.clamp(visitor.group.position.x, player.bounds.minX, player.bounds.maxX);
      visitor.group.position.z = THREE.MathUtils.clamp(visitor.group.position.z, player.bounds.minZ, player.bounds.maxZ);
      if (visitor.velocity.lengthSq() > 0.001) {
        visitor.group.rotation.y = Math.atan2(visitor.velocity.x, visitor.velocity.z);
      }
      visitor.velocity.multiplyScalar(Math.pow(0.55, delta));
      if (visitor.panic <= 0) visitor.state = "calm";
    } else if (visitor.state === "hide") {
      visitor.panic = Math.max(0, visitor.panic - delta * 0.38);
      visitor.wobble = Math.max(0.12, visitor.wobble - delta * 0.7);
      const toHide = visitor.hideTarget.clone().sub(visitor.group.position);
      toHide.y = 0;
      const distance = toHide.length();
      if (distance > 0.38) {
        const hideSpeed = visitor.role === "staff" ? 2.35 : 2.75;
        visitor.velocity.lerp(toHide.normalize().multiplyScalar(hideSpeed), 5.5 * delta);
        visitor.group.position.addScaledVector(visitor.velocity, delta);
        visitor.group.rotation.y = Math.atan2(visitor.velocity.x, visitor.velocity.z);
      } else {
        visitor.velocity.multiplyScalar(Math.pow(0.1, delta));
        const lookAway = visitor.group.position.clone().sub(camera.position);
        lookAway.y = 0;
        if (lookAway.lengthSq() > 0.01) {
          visitor.group.rotation.y = lerpAngle(visitor.group.rotation.y, Math.atan2(lookAway.x, lookAway.z), 1 - Math.exp(-6 * delta));
        }
      }
      visitor.group.position.y = WORLD_FLOOR_Y;
      visitor.group.position.x = THREE.MathUtils.clamp(visitor.group.position.x, player.bounds.minX, player.bounds.maxX);
      visitor.group.position.z = THREE.MathUtils.clamp(visitor.group.position.z, player.bounds.minZ, player.bounds.maxZ);
      if (visitor.panic <= 0) visitor.state = "calm";
    } else if (visitor.role === "staff") {
      visitor.busyTimer -= delta;
      const toTarget = visitor.busyTarget.clone().sub(visitor.group.position);
      toTarget.y = 0;
      const distance = toTarget.length();
      if (visitor.busyTimer <= 0 || distance < 0.22) {
        chooseStaffBusyTarget(visitor);
        visitor.busyTimer = 2.4 + Math.random() * 4.2;
      }
      if (distance > 0.22) {
        visitor.isMovingToWork = true;
        const direction = toTarget.normalize();
        visitor.velocity.lerp(direction.multiplyScalar(0.32), 3.2 * delta);
        visitor.group.position.addScaledVector(visitor.velocity, delta);
        visitor.group.rotation.y = Math.atan2(visitor.velocity.x, visitor.velocity.z);
      } else {
        visitor.isMovingToWork = false;
        visitor.velocity.multiplyScalar(Math.pow(0.18, delta));
        const lookAtWork = visitor.home.clone().sub(visitor.group.position);
        lookAtWork.y = 0;
        if (lookAtWork.lengthSq() > 0.01) {
          const targetRotation = Math.atan2(lookAtWork.x, lookAtWork.z);
          visitor.group.rotation.y = lerpAngle(visitor.group.rotation.y, targetRotation, 1 - Math.exp(-3.8 * delta));
        }
      }
      visitor.wobble = THREE.MathUtils.lerp(visitor.wobble, 0.045, 5 * delta);
      visitor.group.position.y = WORLD_FLOOR_Y;
      visitor.group.position.x = THREE.MathUtils.clamp(visitor.group.position.x, player.bounds.minX, player.bounds.maxX);
      visitor.group.position.z = THREE.MathUtils.clamp(visitor.group.position.z, player.bounds.minZ, player.bounds.maxZ);
    } else if (visitor.behavior === "patrol" && visitor.patrolPoints.length > 1) {
      visitor.patrolPause = Math.max(0, visitor.patrolPause - delta);
      const target = visitor.patrolPoints[visitor.patrolTargetIndex];
      const toTarget = target.clone().sub(visitor.group.position);
      toTarget.y = 0;
      const distance = toTarget.length();
      if (distance < 0.35) {
        visitor.patrolTargetIndex = (visitor.patrolTargetIndex + 1) % visitor.patrolPoints.length;
        visitor.patrolPause = 1.1 + Math.random() * 0.8;
        visitor.velocity.multiplyScalar(0.2);
      } else if (visitor.patrolPause > 0) {
        visitor.velocity.multiplyScalar(Math.pow(0.25, delta));
      } else {
        const direction = toTarget.normalize();
        visitor.velocity.lerp(direction.multiplyScalar(1.05), 4 * delta);
        visitor.group.position.addScaledVector(visitor.velocity, delta);
        visitor.group.position.y = WORLD_FLOOR_Y;
        visitor.group.rotation.y = Math.atan2(visitor.velocity.x, visitor.velocity.z);
      }
      visitor.group.position.x = THREE.MathUtils.clamp(visitor.group.position.x, player.bounds.minX, player.bounds.maxX);
      visitor.group.position.z = THREE.MathUtils.clamp(visitor.group.position.z, player.bounds.minZ, player.bounds.maxZ);
    } else {
      visitor.wanderPause = Math.max(0, visitor.wanderPause - delta);
      const toTarget = visitor.wanderTarget.clone().sub(visitor.group.position);
      toTarget.y = 0;
      const distance = toTarget.length();
      if (distance < 0.45 || visitor.wanderPause > 0) {
        visitor.velocity.multiplyScalar(Math.pow(0.35, delta));
        if (distance < 0.45 && visitor.wanderPause <= 0) {
          visitor.wanderPause = 1.2 + Math.random() * 2.4;
          chooseVisitorWanderTarget(visitor);
        }
        const idle = Math.sin(clock.elapsedTime * 0.8 + visitor.wanderOffset) * 0.18;
        visitor.group.rotation.y += idle * delta * 0.08;
      } else {
        const direction = toTarget.normalize();
        const walkSpeed = visitor.species === "round-being" ? 0.52 : visitor.species === "tall-being" ? 0.72 : 0.64;
        visitor.velocity.lerp(direction.multiplyScalar(walkSpeed), 2.8 * delta);
        visitor.wobble = THREE.MathUtils.lerp(visitor.wobble, 0.18, 4 * delta);
        visitor.group.position.addScaledVector(visitor.velocity, delta);
        visitor.group.position.y = WORLD_FLOOR_Y;
        visitor.group.rotation.y = Math.atan2(visitor.velocity.x, visitor.velocity.z);
      }
      visitor.group.position.x = THREE.MathUtils.clamp(visitor.group.position.x, player.bounds.minX, player.bounds.maxX);
      visitor.group.position.z = THREE.MathUtils.clamp(visitor.group.position.z, player.bounds.minZ, player.bounds.maxZ);
    }

    const crouch = visitor.state === "hide" ? 0.72 : visitor.state === "flee" ? 0.86 : 1;
    const attackLean = visitor.state === "hostile" ? 0.18 : 0;
    const coverHead = visitor.state === "flee" || visitor.state === "hide";
    const panicWave = Math.sin(clock.elapsedTime * 16 + index) * visitor.wobble;
    const isWorkingStaff = visitor.role === "staff" && visitor.state === "calm";
    const workWave = Math.sin(clock.elapsedTime * 2.1 + visitor.busyPhase);
    if (visitor.usesSkeletonAnimation) return;
    visitor.parts.forEach((part, partIndex) => {
      const originalPosition = part.userData.originalPosition;
      const originalRotation = part.userData.originalRotation;
      const originalScale = part.userData.originalScale;
      if (isWorkingStaff) {
        applyStaffWorkPose(visitor, part, partIndex, originalPosition, originalRotation, originalScale, workWave);
      } else {
        part.position.x = originalPosition.x + panicWave * 0.025 * (partIndex % 2 === 0 ? 1 : -1);
        part.position.y = originalPosition.y * (0.82 + crouch * 0.18) + Math.abs(panicWave) * 0.015;
        part.rotation.x = originalRotation.x + panicWave * 0.08 + attackLean;
        part.rotation.z = originalRotation.z + panicWave * 0.18;
        part.scale.y = originalScale.y * (0.82 + crouch * 0.18);
      }
      if (coverHead && visitor.coverPartIndexes.includes(partIndex)) {
        part.position.y = originalPosition.y + 0.42 + Math.abs(panicWave) * 0.02;
        part.position.x = originalPosition.x * 0.42;
        part.rotation.x = -1.05 + panicWave * 0.04;
        part.rotation.z = partIndex === 3 ? 0.95 : -0.95;
      }
    });
  });
}

function applyStaffWorkPose(visitor, part, partIndex, originalPosition, originalRotation, originalScale, workWave) {
  const pose = visitor.isMovingToWork ? "walk" : visitor.busyPose ?? "inspect";
  const isCrouching = pose === "crouch" || pose === "adjust";
  const crouchDrop = isCrouching ? 0.28 : 0;
  const lean = pose === "inspect" ? 0.16 : pose === "adjust" ? 0.28 : pose === "clipboard" ? 0.05 : 0.1;

  const walkSwing = pose === "walk" ? Math.sin(clock.elapsedTime * 7.2 + visitor.busyPhase) : workWave;
  part.position.x = originalPosition.x + workWave * 0.004 * (partIndex % 2 === 0 ? 1 : -1);
  part.position.y = originalPosition.y - crouchDrop + Math.abs(workWave) * 0.004;
  part.rotation.x = originalRotation.x + lean;
  part.rotation.z = originalRotation.z;
  part.scale.copy(originalScale);

  if (partIndex === 0) {
    part.rotation.x = originalRotation.x + lean * 0.72;
  } else if (partIndex === 1 || partIndex === 2) {
    part.rotation.x = originalRotation.x + lean * 0.45;
  } else if (partIndex === 3) {
    part.rotation.x = pose === "walk" ? originalRotation.x + walkSwing * 0.28 : pose === "clipboard" ? -0.72 : pose === "adjust" ? -0.95 : -0.35;
    part.rotation.z = originalRotation.z - (pose === "clipboard" ? 0.2 : 0.42);
    part.position.y = originalPosition.y - crouchDrop * 0.72 + Math.max(0, workWave) * 0.02;
  } else if (partIndex === 4) {
    part.rotation.x = pose === "walk" ? originalRotation.x - walkSwing * 0.28 : pose === "inspect" ? -0.28 : pose === "adjust" ? -1.05 : -0.48;
    part.rotation.z = originalRotation.z + (pose === "clipboard" ? 0.18 : 0.42);
    part.position.y = originalPosition.y - crouchDrop * 0.72 + Math.max(0, -workWave) * 0.02;
  } else if (partIndex === 5 || partIndex === 6) {
    part.position.y = originalPosition.y - crouchDrop * 0.55;
    part.rotation.x = originalRotation.x + (pose === "walk" ? (partIndex === 5 ? -walkSwing : walkSwing) * 0.22 : isCrouching ? 0.5 : 0.04 * workWave);
    part.rotation.z = originalRotation.z + (partIndex === 5 ? -0.08 : 0.08) * (isCrouching ? 1 : 0.25);
    part.scale.y = originalScale.y * (isCrouching ? 0.82 : 1);
  }
}

function updateParticles(delta) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const chip = bullets[i];
    chip.userData.life -= delta;
    if (chip.userData.velocity) {
      chip.userData.velocity.y -= 3.2 * delta;
      chip.position.addScaledVector(chip.userData.velocity, delta);
    }
    if (chip.geometry.type === "SphereGeometry") {
      chip.scale.addScalar(delta * 1.4);
      chip.material.opacity = Math.max(0, chip.userData.life * 0.45);
    } else {
      chip.material.opacity = Math.max(0, Math.min(0.95, chip.userData.life * 2));
    }
    if (chip.userData.life <= 0) {
      scene.remove(chip);
      chip.geometry.dispose();
      chip.material.dispose();
      bullets.splice(i, 1);
    }
  }
}

function updateBulletTrails(delta) {
  for (let i = bulletTrails.length - 1; i >= 0; i -= 1) {
    const trail = bulletTrails[i];
    trail.userData.life -= delta;
    trail.material.opacity = Math.max(0, trail.userData.life * 12);
    if (trail.userData.life <= 0) {
      scene.remove(trail);
      trail.geometry.dispose();
      trail.material.dispose();
      bulletTrails.splice(i, 1);
    }
  }
}

function updateCasings(delta) {
  for (let i = casings.length - 1; i >= 0; i -= 1) {
    const casing = casings[i];
    casing.userData.life -= delta;
    casing.userData.velocity.y -= 5.6 * delta;
    casing.position.addScaledVector(casing.userData.velocity, delta);
    casing.rotation.x += casing.userData.spin.x * delta;
    casing.rotation.y += casing.userData.spin.y * delta;
    casing.rotation.z += casing.userData.spin.z * delta;
    if (casing.position.y < 0.08) {
      casing.position.y = 0.08;
      casing.userData.velocity.multiplyScalar(0.35);
      casing.userData.velocity.y = Math.abs(casing.userData.velocity.y) * 0.22;
    }
    if (casing.userData.life <= 0) {
      scene.remove(casing);
      casing.geometry.dispose();
      casing.material.dispose();
      casings.splice(i, 1);
    }
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderTarget.setSize(window.innerWidth, window.innerHeight);
  renderTarget.depthTexture.dispose();
  renderTarget.depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
  renderTarget.depthTexture.type = THREE.UnsignedShortType;
  presbyopiaMaterial.uniforms.tDepth.value = renderTarget.depthTexture;
  presbyopiaMaterial.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
}

function makeFloorTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#b99b68";
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 42) {
    for (let x = 0; x < 512; x += 128) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.05})`;
      ctx.fillRect(x + (y % 84), y, 118, 38);
      ctx.strokeStyle = "rgba(72,48,24,0.18)";
      ctx.strokeRect(x + (y % 84), y, 118, 38);
    }
  }
  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7);
  texture.colorSpace = THREE.SRGBColorSpace;
  return pixelTexture(texture);
}

function makeCamoTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#17231a";
  ctx.fillRect(0, 0, 256, 256);

  const colors = ["#31452e", "#6a7449", "#d3bd82", "#0d1611"];
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = colors[i % colors.length];
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 10 + Math.random() * 34;
    const h = 5 + Math.random() * 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.8);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return pixelTexture(texture);
}

function makeWallTextTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 720;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d4d0c3";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#57534c";
  ctx.font = "700 34px sans-serif";
  ctx.fillText("On preservation", 48, 72);
  ctx.font = "18px sans-serif";
  for (let i = 0; i < 22; i += 1) {
    const width = 270 + Math.sin(i) * 80;
    ctx.fillRect(48, 120 + i * 22, width, 5);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return pixelTexture(texture);
}

function makeEntranceSignTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(8, 12, 14, 0.86)";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#6fd6ff";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  ctx.fillStyle = "#dff8ff";
  ctx.font = "700 42px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ENTRANCE", c.width / 2, 55);
  ctx.font = "700 30px sans-serif";
  ctx.fillText("GALLERY ACCESS", c.width / 2, 94);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return pixelTexture(texture);
}
