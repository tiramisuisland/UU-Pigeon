export const ASSET_ROOTS = {
  gallery: "./assets/gallery/",
  visitors: "./assets/visitors/",
  weapons: "./assets/weapons/",
  player: "./assets/player/",
  textures: "./assets/textures/",
  videos: "./assets/video/",
};

export const GALLERY_VIDEOS = [
  { nodeName: "FV02", videoPath: `${ASSET_ROOTS.videos}曼德拉FULLs.mp4`, brightness: 1.15 },
  { nodeName: "FV01", videoPath: `${ASSET_ROOTS.videos}曼德拉FULLs.mp4`, brightness: 1.15 },
  { nodeName: "NVs", videoPath: `${ASSET_ROOTS.videos}NVs.mp4` },
  { nodeName: "NV2", videoPath: `${ASSET_ROOTS.videos}NV2.mp4` },
  { nodeName: "NV3", videoPath: `${ASSET_ROOTS.videos}NV3.mp4` },
  { nodeName: "NV4", videoPath: `${ASSET_ROOTS.videos}NV4.mp4` },
];

export const GALLERY_SPACE = {
  model: {
    id: "space-gallery",
    label: "space.glb 展場",
    category: "gallery-space",
    modelPath: `${ASSET_ROOTS.gallery}space.glb`,
    fallback: true,
    scale: 0.5,
    position: [-36.48, 0.64, -74.37],
    rotationY: 0,
    playerBounds: {
      minX: -10.1,
      maxX: 10.1,
      minZ: -14.9,
      maxZ: 14.9,
    },
  },
};

export const PLAYER_ASSETS = {
  player: {
    id: "player-01",
    label: "第一人稱玩家",
    category: "player",
    modelPath: `${ASSET_ROOTS.player}player.glb`,
    spawn: [-4.6344, 0.80325, 10.6035],
    eyeHeight: 0.80325,
    radius: 0.1701,
    modelWidth: 0.378,
    walkSpeed: 4.5,
    sprintSpeed: 7.2,
    bounds: {
      minX: -10.1,
      maxX: 10.1,
      minZ: -14.9,
      maxZ: 14.9,
    },
  },
  weapon: {
    id: "first-person-rifle",
    label: "第一人稱武器",
    category: "player",
    modelPath: `${ASSET_ROOTS.weapons}first-person-rifle.glb`,
    fallback: true,
    scale: 0.8,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
};

export const VISITOR_ASSETS = {
  entryPosition: [-4.6344, 0, 11.9535],
  visitors: [
    { id: "visitor-01", category: "visitor", modelPath: `${ASSET_ROOTS.visitors}visitor-01.glb`, species: "human", behavior: "coward", position: [-2.6, 0, 9.2], rotationY: 2.6, scale: 0.56, jacket: 0x3b4d5f, pants: 0x1d2430 },
    { id: "visitor-02", category: "visitor", modelPath: `${ASSET_ROOTS.visitors}visitor-02.glb`, species: "human", behavior: "aggressive", position: [2.8, 0, 8.4], rotationY: -2.55, scale: 0.56, jacket: 0x7a4d39, pants: 0x25251f },
    { id: "visitor-03", category: "visitor", modelPath: `${ASSET_ROOTS.visitors}visitor-03.glb`, species: "tall-being", behavior: "coward", position: [-3.4, 0, 5.6], rotationY: 1.35, scale: 0.56, jacket: 0x546b48, pants: 0x293238 },
    { id: "visitor-04", category: "visitor", modelPath: `${ASSET_ROOTS.visitors}visitor-04.glb`, species: "round-being", behavior: "aggressive", position: [3.8, 0, 5.8], rotationY: -1.55, scale: 0.56, jacket: 0xb9a36f, pants: 0x302a26 },
  ],
};

export const GALLERY_MODEL = GALLERY_SPACE.model;
export const PLAYER = PLAYER_ASSETS.player;
export const WEAPON = PLAYER_ASSETS.weapon;
export const VISITORS = VISITOR_ASSETS.visitors;
export const VISITOR_ENTRY_POSITION = VISITOR_ASSETS.entryPosition;
