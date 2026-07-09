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
    { id: "visitor-01", category: "visitor", style: "voxel", gender: "male", species: "human", behavior: "coward", position: [-2.6, 0, 9.2], rotationY: 2.6, scale: 0.56, jacket: 0x5f756f, pants: 0x3f4656, hair: 0x3a2c24 },
    { id: "visitor-02", category: "visitor", style: "voxel", gender: "female", species: "human", behavior: "aggressive", position: [2.8, 0, 8.4], rotationY: -2.55, scale: 0.56, jacket: 0x7b8064, pants: 0x5d4a42, hair: 0x6d4a35 },
    { id: "visitor-03", category: "visitor", style: "voxel", gender: "female", species: "tall-being", behavior: "coward", position: [-3.4, 0, 5.6], rotationY: 1.35, scale: 0.56, jacket: 0x66705a, pants: 0x30383c, hair: 0x332820 },
    { id: "visitor-04", category: "visitor", style: "voxel", gender: "male", species: "round-being", behavior: "aggressive", position: [3.8, 0, 5.8], rotationY: -1.55, scale: 0.56, jacket: 0x8a8065, pants: 0x342f2c, hair: 0x1f1814 },
    { id: "staff-01", category: "visitor", style: "voxel", gender: "male", role: "staff", species: "human", behavior: "staff", position: [-1.25, 0, -1.85], rotationY: 0.45, scale: 0.58, jacket: 0x3f5e6a, pants: 0x1f2730, hair: 0x2f2118, workRadius: 1.15 },
    { id: "staff-02", category: "visitor", style: "voxel", gender: "female", role: "staff", species: "human", behavior: "staff", position: [2.65, 0, -3.35], rotationY: -0.9, scale: 0.58, jacket: 0x3f5e6a, pants: 0x1f2730, hair: 0x4a3528, workRadius: 1.25 },
    { id: "staff-03", category: "visitor", style: "voxel", gender: "female", role: "staff", species: "human", behavior: "staff", position: [-4.15, 0, 2.35], rotationY: 1.65, scale: 0.58, jacket: 0x3f5e6a, pants: 0x1f2730, hair: 0x3a251b, workRadius: 1.05 },
  ],
};

export const GALLERY_MODEL = GALLERY_SPACE.model;
export const PLAYER = PLAYER_ASSETS.player;
export const WEAPON = PLAYER_ASSETS.weapon;
export const VISITORS = VISITOR_ASSETS.visitors;
export const VISITOR_ENTRY_POSITION = VISITOR_ASSETS.entryPosition;
