const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const MATERIALS = {
  skin: color(0xb77b55),
  skinLight: color(0xc68a63),
  hair: color(0x17120f),
  black: color(0x101218),
  shoe: color(0x151515),
  lens: color(0x96c6d8, 0.45),
  playerSuit: color(0x202632),
  playerVest: color(0x4d5b52),
  playerGlove: color(0x161a20),
  weaponDark: color(0x343a31),
  weaponRubber: color(0x1d221c),
  weaponGlass: color(0x26302c),
  sleeveCamo: color(0x4b5a3d),
  galleryFloor: color(0x9c8f78),
  galleryWall: color(0xd4d0c4),
  galleryTrim: color(0x5d5a50),
  galleryColumn: color(0x8d8a82),
  galleryGlass: color(0xa9c5cf, 0.35),
  galleryDisplay: color(0xb8ad96),
  galleryDark: color(0x33342f),
};

const VISITORS = [
  {
    file: "assets/visitors/visitor-01.glb",
    name: "visitor-01",
    kind: "human",
    jacket: 0x3b4d5f,
    pants: 0x1d2430,
    skin: 0xb77b55,
  },
  {
    file: "assets/visitors/visitor-02.glb",
    name: "visitor-02",
    kind: "human",
    jacket: 0x7a4d39,
    pants: 0x25251f,
    skin: 0xc28664,
  },
  {
    file: "assets/visitors/visitor-03.glb",
    name: "visitor-03",
    kind: "tall",
    jacket: 0x546b48,
    pants: 0x293238,
    skin: 0xb77b55,
  },
  {
    file: "assets/visitors/visitor-04.glb",
    name: "visitor-04",
    kind: "round",
    jacket: 0xb9a36f,
    pants: 0x302a26,
    skin: 0xc18a66,
  },
];

main();

function main() {
  writeModel("assets/gallery/current-gallery.glb", "current-gallery", makeFloorplanGalleryParts());
  writeModel("assets/player/player.glb", "player-01", makePlayerParts());
  writeModel("assets/weapons/first-person-rifle.glb", "first-person-rifle", makeWeaponParts());

  for (const visitor of VISITORS) {
    const parts = makeVisitorParts(visitor);
    writeModel(visitor.file, visitor.name, parts);
  }
}

function writeModel(relativeFile, modelName, parts) {
  const destination = path.join(ROOT, relativeFile);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, makeGlb(modelName, parts));
  const size = fs.statSync(destination).size;
  console.log(`${relativeFile} ${Math.round(size / 1024)}KB`);
}

function makeFloorplanGalleryParts() {
  const parts = [];
  const wallHeight = 4.1;
  const wallY = wallHeight / 2;
  const wall = 0.16;
  const lowWallHeight = 1.12;

  addBox("main_floor", 0, -0.04, -0.35, 17.8, 0.08, 20.8, "galleryFloor");
  addBox("right_room_floor", 6.65, -0.035, 0.15, 3.7, 0.07, 6.35, "galleryFloor");
  addBox("entrance_floor", 4.05, -0.03, 10.75, 1.35, 0.06, 1.9, "galleryFloor");
  addBox("ceiling", 0, 4.15, -0.35, 17.8, 0.08, 20.8, "galleryWall");
  addBox("right_room_ceiling", 6.65, 4.12, 0.15, 3.7, 0.07, 6.35, "galleryWall");

  addWallX("north_wall", 0, -10.75, 17.8, wallHeight);
  addWallZ("west_wall_upper", -8.9, -7.65, 6.2, wallHeight);
  addWallZ("west_wall_mid", -8.9, 0.0, 5.3, wallHeight);
  addWallZ("west_wall_lower", -8.9, 7.15, 5.25, wallHeight);
  addWallZ("east_wall_upper", 8.9, -7.0, 7.5, wallHeight);
  addWallZ("east_wall_right_room", 8.5, 0.0, 6.2, wallHeight);
  addWallX("south_wall_left", -3.0, 10.05, 11.8, wallHeight);
  addWallX("south_wall_right", 6.9, 10.05, 3.2, wallHeight);
  addWallZ("entrance_left_jamb", 3.35, 10.85, 1.65, wallHeight);
  addWallZ("entrance_right_jamb", 4.75, 10.85, 1.65, wallHeight);
  addWallX("entrance_front_left", 3.68, 11.68, 0.65, wallHeight);
  addWallX("entrance_front_right", 4.42, 11.68, 0.65, wallHeight);

  addWallX("middle_long_wall_left", -6.25, -3.25, 5.0, 2.65);
  addWallX("middle_long_wall_right", 4.15, -3.25, 7.2, 2.65);
  addWallX("right_room_top_wall", 6.65, -3.15, 3.7, wallHeight);
  addWallX("right_room_bottom_wall", 6.65, 3.42, 3.7, wallHeight);
  addWallZ("right_room_left_wall", 4.8, 0.55, 5.75, wallHeight);
  addWallZ("right_lower_return", 5.15, 7.1, 5.9, wallHeight);
  addWallX("lower_right_step", 6.55, 8.95, 2.8, wallHeight);

  addBox("central_pod_body", -1.0, 1.05, -4.95, 4.65, 2.1, 1.62, "galleryWall");
  addBox("central_pod_lower_body", -1.0, 0.72, -2.95, 5.3, 1.44, 0.5, "galleryDisplay");
  addBox("central_pod_inner_counter", -1.0, 1.2, -4.95, 1.15, 0.22, 2.3, "galleryDisplay");
  addBox("central_pod_slats", -1.0, 1.46, -4.95, 0.9, 0.42, 1.15, "galleryDark");
  addCylinderY("central_pod_left_round", -3.38, 1.06, -4.95, 0.85, 2.12, "galleryWall");
  addCylinderY("central_pod_right_round", 1.38, 1.06, -4.95, 0.85, 2.12, "galleryWall");
  addCylinderY("pod_left_column", -2.95, 1.05, -4.28, 0.28, 2.1, "galleryColumn");
  addCylinderY("pod_right_column", 0.95, 1.05, -4.28, 0.28, 2.1, "galleryColumn");

  addBox("lower_gallery_room_wall_top", 1.8, 2.05, 7.05, 3.6, 4.1, wall);
  addWallZ("lower_gallery_room_wall_right", 3.6, 8.55, 3.0, wallHeight);
  addBox("round_stair_outer", 2.45, 0.55, 8.25, 1.18, 1.1, 1.18, "galleryDisplay");
  addCylinderY("round_stair_center", 2.45, 0.7, 8.25, 0.42, 1.4, "galleryFloor");

  const columnPositions = [
    [-6.4, -8.25], [-3.85, -8.25], [0.1, -8.25], [2.5, -8.25], [4.55, -8.25], [6.55, -8.25],
    [-8.2, 1.85], [-5.7, 1.85], [-3.45, 1.85], [-1.12, 1.85], [1.25, 1.85], [3.72, 1.85],
    [4.15, 10.0], [6.8, 2.55],
  ];
  columnPositions.forEach(([x, z], index) => addCylinderY(`round_column_${index + 1}`, x, 2.05, z, 0.24, 4.1, "galleryColumn"));

  addBox("right_room_display_top", 6.6, 1.0, -2.55, 2.1, 0.55, 0.22, "galleryDisplay");
  addBox("right_room_display_left", 5.05, 1.0, 1.15, 0.22, 0.55, 2.1, "galleryDisplay");
  addBox("right_room_display_bottom", 6.05, 1.0, 3.1, 1.25, 0.55, 0.22, "galleryDisplay");
  addBox("long_bench", -1.2, 0.38, 5.75, 2.9, 0.26, 0.62, "galleryDisplay");
  addBox("dashed_plan_platform", -2.0, 0.12, 8.05, 2.7, 0.24, 0.42, "galleryTrim");

  addBox("north_track", -1.5, 3.92, -7.6, 6.1, 0.08, 0.08, "galleryDark");
  addBox("middle_track_left", -5.8, 3.9, -3.2, 5.1, 0.08, 0.08, "galleryDark");
  addBox("middle_track_right", 3.95, 3.9, -3.2, 7.4, 0.08, 0.08, "galleryDark");
  addBox("right_room_track", 6.75, 3.88, -2.45, 2.25, 0.08, 0.08, "galleryDark");

  return parts;

  function addWallX(name, x, z, length, height) {
    addBox(name, x, height / 2, z, length, height, wall, "galleryWall");
    addBox(`${name}_base`, x, 0.12, z + 0.02, length, 0.16, 0.08, "galleryTrim");
  }

  function addWallZ(name, x, z, length, height) {
    addBox(name, x, height / 2, z, wall, height, length, "galleryWall");
    addBox(`${name}_base`, x + 0.02, 0.12, z, 0.08, 0.16, length, "galleryTrim");
  }

  function addBox(name, x, y, z, sx, sy, sz, material = "galleryWall") {
    parts.push(part(name, "box", material, [x, y, z], [0, 0, 0], [sx, sy, sz]));
  }

  function addCylinderY(name, x, y, z, radius, height, material = "galleryColumn") {
    parts.push(part(name, "cylinderY", material, [x, y, z], [0, 0, 0], [radius, height, radius]));
  }
}

function makePlayerParts() {
  return [
    part("player_torso", "sphere", "playerSuit", [0, 1.08, 0], [0, 0, 0], [0.25, 0.48, 0.17]),
    part("player_vest", "sphere", "playerVest", [0, 1.15, 0.035], [0, 0, 0], [0.26, 0.38, 0.08]),
    part("player_head", "sphere", "skinLight", [0, 1.62, 0], [0, 0, 0], [0.17, 0.2, 0.16]),
    part("player_hair", "sphere", "hair", [0, 1.76, -0.02], [0.08, 0, 0], [0.18, 0.09, 0.16]),
    part("player_left_lens", "sphere", "lens", [-0.06, 1.64, 0.142], [0, 0, 0], [0.048, 0.028, 0.01]),
    part("player_right_lens", "sphere", "lens", [0.06, 1.64, 0.142], [0, 0, 0], [0.048, 0.028, 0.01]),
    part("player_left_arm", "sphere", "playerSuit", [-0.31, 1.12, 0.02], [0.12, 0, -0.22], [0.065, 0.43, 0.06]),
    part("player_right_arm", "sphere", "playerSuit", [0.31, 1.12, 0.02], [0.12, 0, 0.22], [0.065, 0.43, 0.06]),
    part("player_left_hand", "sphere", "playerGlove", [-0.38, 0.75, 0.08], [0, 0, 0], [0.07, 0.065, 0.06]),
    part("player_right_hand", "sphere", "playerGlove", [0.38, 0.75, 0.08], [0, 0, 0], [0.07, 0.065, 0.06]),
    part("player_left_leg", "sphere", "black", [-0.11, 0.51, 0], [0, 0, 0.04], [0.085, 0.5, 0.075]),
    part("player_right_leg", "sphere", "black", [0.11, 0.51, 0], [0, 0, -0.04], [0.085, 0.5, 0.075]),
    part("player_left_boot", "sphere", "shoe", [-0.11, 0.08, 0.055], [0, 0, 0], [0.095, 0.06, 0.15]),
    part("player_right_boot", "sphere", "shoe", [0.11, 0.08, 0.055], [0, 0, 0], [0.095, 0.06, 0.15]),
  ];
}

function makeWeaponParts() {
  const railNotches = [];
  for (let i = 0; i < 9; i += 1) {
    railNotches.push(part(`rail_notch_${i + 1}`, "box", "weaponRubber", [0, 0.23, -0.88 + i * 0.16], [0, 0, 0], [0.34, 0.045, 0.045]));
  }

  return [
    part("rifle_body", "box", "weaponDark", [0, 0.04, -0.16], [0, 0, 0], [0.36, 0.2, 1.76]),
    part("top_rail", "box", "weaponRubber", [0, 0.18, -0.22], [0, 0, 0], [0.28, 0.055, 1.55]),
    ...railNotches,
    part("barrel", "cylinderZ", "weaponDark", [0, 0.08, -1.23], [0, 0, 0], [0.055, 0.055, 1.38]),
    part("muzzle", "cylinderZ", "weaponDark", [0, 0.08, -2.0], [0, 0, 0], [0.085, 0.085, 0.22]),
    part("scope_tube", "cylinderZ", "weaponGlass", [0, 0.42, -0.64], [0, 0, 0], [0.15, 0.15, 0.58]),
    part("scope_front_ring", "cylinderZ", "weaponDark", [0, 0.42, -0.96], [0, 0, 0], [0.18, 0.18, 0.06]),
    part("scope_rear_ring", "cylinderZ", "weaponDark", [0, 0.42, -0.32], [0, 0, 0], [0.18, 0.18, 0.06]),
    part("scope_mount", "box", "weaponDark", [0, 0.23, -0.64], [0, 0, 0], [0.12, 0.22, 0.18]),
    part("rear_sight", "box", "weaponRubber", [0, 0.3, 0.48], [0, 0, 0], [0.22, 0.18, 0.08]),
    part("grip", "box", "weaponRubber", [0.12, -0.27, 0.35], [-0.34, 0, 0], [0.16, 0.46, 0.2]),
    part("magazine", "box", "weaponDark", [-0.04, -0.33, 0.0], [0.1, 0, 0], [0.24, 0.58, 0.18]),
    part("left_sleeve", "cylinderZ", "sleeveCamo", [-0.34, -0.48, -0.52], [Math.PI / 2.45, 0.12, 0.22], [0.13, 0.13, 0.86]),
    part("right_sleeve", "cylinderZ", "sleeveCamo", [0.32, -0.5, 0.18], [Math.PI / 2.45, 0.12, -0.24], [0.13, 0.13, 0.86]),
    part("left_hand", "box", "skin", [-0.21, -0.39, -0.8], [-0.18, 0.1, 0.18], [0.22, 0.16, 0.28]),
    part("right_hand", "box", "skin", [0.2, -0.41, -0.1], [-0.18, 0.1, -0.19], [0.22, 0.16, 0.28]),
  ];
}

function makeVisitorParts(visitor) {
  const palette = {
    skin: color(visitor.skin),
    jacket: color(visitor.jacket),
    pants: color(visitor.pants),
    hair: MATERIALS.hair,
    shoe: MATERIALS.shoe,
  };

  if (visitor.kind === "tall") {
    return [
      part("torso", "sphere", "jacket", [0, 1.39, 0], [0, 0, 0], [0.18, 0.74, 0.13]),
      part("neck", "sphere", "skin", [0, 2.07, 0], [0, 0, 0], [0.095, 0.22, 0.085]),
      part("head", "sphere", "skin", [0, 2.38, 0.02], [0, 0, 0], [0.16, 0.2, 0.15]),
      part("hair", "sphere", "hair", [0, 2.52, -0.02], [0, 0, 0], [0.165, 0.08, 0.14]),
      part("left_arm", "sphere", "jacket", [-0.29, 1.48, 0.01], [0.22, 0, -0.5], [0.055, 0.49, 0.05]),
      part("right_arm", "sphere", "jacket", [0.29, 1.48, 0.01], [0.22, 0, 0.5], [0.055, 0.49, 0.05]),
      part("left_leg", "sphere", "pants", [-0.095, 0.63, 0], [0, 0, 0.03], [0.065, 0.67, 0.06]),
      part("right_leg", "sphere", "pants", [0.095, 0.63, 0], [0, 0, -0.03], [0.065, 0.67, 0.06]),
      part("left_shoe", "sphere", "shoe", [-0.1, 0.07, 0.055], [0, 0, 0], [0.08, 0.045, 0.13]),
      part("right_shoe", "sphere", "shoe", [0.1, 0.07, 0.055], [0, 0, 0], [0.08, 0.045, 0.13]),
    ].map((p) => ({ ...p, materials: palette }));
  }

  if (visitor.kind === "round") {
    return [
      part("round_body", "sphere", "jacket", [0, 1.16, 0], [0, 0, 0], [0.44, 0.48, 0.38]),
      part("left_cheek", "sphere", "skin", [-0.16, 1.42, 0.31], [0, 0, 0], [0.13, 0.13, 0.08]),
      part("right_cheek", "sphere", "skin", [0.16, 1.42, 0.31], [0, 0, 0], [0.13, 0.13, 0.08]),
      part("cap", "sphere", "hair", [0, 1.58, -0.02], [0.12, 0, 0], [0.27, 0.08, 0.21]),
      part("left_leg", "sphere", "pants", [-0.18, 0.58, 0], [0, 0, 0.12], [0.06, 0.34, 0.055]),
      part("right_leg", "sphere", "pants", [0.18, 0.58, 0], [0, 0, -0.12], [0.06, 0.34, 0.055]),
      part("left_shoe", "sphere", "shoe", [-0.18, 0.28, 0.055], [0, 0, 0], [0.08, 0.045, 0.13]),
      part("right_shoe", "sphere", "shoe", [0.18, 0.28, 0.055], [0, 0, 0], [0.08, 0.045, 0.13]),
    ].map((p) => ({ ...p, materials: palette }));
  }

  return [
    part("torso", "sphere", "jacket", [0, 1.21, 0], [0, 0, 0], [0.23, 0.49, 0.17]),
    part("head", "sphere", "skin", [0, 1.76, 0.02], [0, 0, 0], [0.18, 0.21, 0.165]),
    part("hair", "sphere", "hair", [0, 1.9, -0.02], [0.08, 0, 0], [0.19, 0.085, 0.15]),
    part("left_arm", "sphere", "jacket", [-0.29, 1.22, 0.015], [0.15, 0, -0.28], [0.06, 0.4, 0.055]),
    part("right_arm", "sphere", "jacket", [0.29, 1.22, 0.015], [0.15, 0, 0.28], [0.06, 0.4, 0.055]),
    part("left_hand", "sphere", "skin", [-0.35, 0.89, 0.055], [0, 0, 0], [0.065, 0.06, 0.055]),
    part("right_hand", "sphere", "skin", [0.35, 0.89, 0.055], [0, 0, 0], [0.065, 0.06, 0.055]),
    part("left_leg", "sphere", "pants", [-0.105, 0.57, 0], [0, 0, 0.05], [0.075, 0.52, 0.065]),
    part("right_leg", "sphere", "pants", [0.105, 0.57, 0], [0, 0, -0.05], [0.075, 0.52, 0.065]),
    part("left_shoe", "sphere", "shoe", [-0.11, 0.08, 0.055], [0, 0, 0], [0.09, 0.05, 0.14]),
    part("right_shoe", "sphere", "shoe", [0.11, 0.08, 0.055], [0, 0, 0], [0.09, 0.05, 0.14]),
  ].map((p) => ({ ...p, materials: palette }));
}

function part(name, geometry, material, translation, rotation, scale) {
  return { name, geometry, material, translation, rotation, scale };
}

function makeGlb(modelName, parts) {
  const buffers = [];
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];
  const materialMap = new Map();
  const materials = [];
  const geometryMap = new Map();

  for (const piece of parts) {
    const localMaterials = piece.materials ?? MATERIALS;
    const materialKey = piece.material;
    const material = localMaterials[materialKey] ?? MATERIALS[materialKey];
    const materialIndex = getMaterial(materialKey, material);
    const geometryAccessors = getGeometryAccessors(piece.geometry);
    const meshIndex = meshes.length;

    meshes.push({
      name: piece.name,
      primitives: [
        {
          attributes: {
            POSITION: geometryAccessors.position,
            NORMAL: geometryAccessors.normal,
          },
          indices: geometryAccessors.indices,
          material: materialIndex,
        },
      ],
    });

    nodes.push({
      name: piece.name,
      mesh: meshIndex,
      translation: piece.translation,
      rotation: eulerToQuaternion(piece.rotation),
      scale: piece.scale,
    });
  }

  const binChunk = Buffer.concat(buffers);
  const gltf = {
    asset: {
      version: "2.0",
      generator: "CS Gallery character GLB generator",
    },
    scene: 0,
    scenes: [{ name: modelName, nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binChunk.length }],
  };

  return packGlb(gltf, binChunk);

  function getGeometryAccessors(type) {
    if (geometryMap.has(type)) return geometryMap.get(type);
    const geometry = type === "box"
      ? makeBox()
      : type === "cylinderZ"
        ? makeCylinderZ(24)
        : type === "cylinderY"
          ? makeCylinderY(24)
          : makeSphere(18, 12);
    const geometryAccessors = addGeometry(geometry);
    geometryMap.set(type, geometryAccessors);
    return geometryAccessors;
  }

  function addGeometry(geometry) {
    const indexView = pushBuffer(uint16Buffer(geometry.indices), 34963);
    const positionView = pushBuffer(floatBuffer(geometry.positions), 34962);
    const normalView = pushBuffer(floatBuffer(geometry.normals), 34962);

    const indices = accessors.length;
    accessors.push({
      bufferView: indexView,
      componentType: 5123,
      count: geometry.indices.length,
      type: "SCALAR",
    });

    const position = accessors.length;
    accessors.push({
      bufferView: positionView,
      componentType: 5126,
      count: geometry.positions.length / 3,
      type: "VEC3",
      min: geometry.bounds.min,
      max: geometry.bounds.max,
    });

    const normal = accessors.length;
    accessors.push({
      bufferView: normalView,
      componentType: 5126,
      count: geometry.normals.length / 3,
      type: "VEC3",
    });

    return { indices, position, normal };
  }

  function pushBuffer(buffer, target) {
    const byteOffset = buffers.reduce((sum, item) => sum + item.length, 0);
    const padded = padBuffer(buffer, 4);
    buffers.push(padded);
    const viewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: buffer.length,
      target,
    });
    return viewIndex;
  }

  function getMaterial(key, material) {
    const cacheKey = `${key}:${material.join(",")}`;
    if (materialMap.has(cacheKey)) return materialMap.get(cacheKey);

    const index = materials.length;
    const alpha = material[3] ?? 1;
    materials.push({
      name: key,
      pbrMetallicRoughness: {
        baseColorFactor: material,
        metallicFactor: 0,
        roughnessFactor: key === "lens" ? 0.18 : 0.72,
      },
      alphaMode: alpha < 1 ? "BLEND" : "OPAQUE",
      doubleSided: true,
    });
    materialMap.set(cacheKey, index);
    return index;
  }
}

function makeBox() {
  const p = [
    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5],
    [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5],
    [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5],
    [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5],
    [-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5],
  ];
  const n = [
    [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1],
    [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1],
    [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
    [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0],
    [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
    [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0],
  ];
  const indices = [];
  for (let face = 0; face < 6; face += 1) {
    const offset = face * 4;
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  return {
    positions: p.flat(),
    normals: n.flat(),
    indices,
    bounds: {
      min: [-0.5, -0.5, -0.5],
      max: [0.5, 0.5, 0.5],
    },
  };
}

function makeCylinderZ(segments) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, -0.5, x, y, 0.5);
    normals.push(x, y, 0, x, y, 0);
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }

  const frontCenter = positions.length / 3;
  positions.push(0, 0, 0.5);
  normals.push(0, 0, 1);
  const backCenter = positions.length / 3;
  positions.push(0, 0, -0.5);
  normals.push(0, 0, -1);

  for (let i = 0; i < segments; i += 1) {
    const currentFront = i * 2 + 1;
    const nextFront = (i + 1) * 2 + 1;
    const currentBack = i * 2;
    const nextBack = (i + 1) * 2;
    indices.push(frontCenter, currentFront, nextFront);
    indices.push(backCenter, nextBack, currentBack);
  }

  return {
    positions,
    normals,
    indices,
    bounds: {
      min: [-1, -1, -0.5],
      max: [1, 1, 0.5],
    },
  };
}

function makeCylinderY(segments) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    positions.push(x, -0.5, z, x, 0.5, z);
    normals.push(x, 0, z, x, 0, z);
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  const topCenter = positions.length / 3;
  positions.push(0, 0.5, 0);
  normals.push(0, 1, 0);
  const bottomCenter = positions.length / 3;
  positions.push(0, -0.5, 0);
  normals.push(0, -1, 0);

  for (let i = 0; i < segments; i += 1) {
    const currentTop = i * 2 + 1;
    const nextTop = (i + 1) * 2 + 1;
    const currentBottom = i * 2;
    const nextBottom = (i + 1) * 2;
    indices.push(topCenter, nextTop, currentTop);
    indices.push(bottomCenter, currentBottom, nextBottom);
  }

  return {
    positions,
    normals,
    indices,
    bounds: {
      min: [-1, -0.5, -1],
      max: [1, 0.5, 1],
    },
  };
}

function makeSphere(segments, rings) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let y = 0; y <= rings; y += 1) {
    const v = y / rings;
    const theta = v * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let x = 0; x <= segments; x += 1) {
      const u = x / segments;
      const phi = u * Math.PI * 2;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const px = sinTheta * sinPhi;
      const py = cosTheta;
      const pz = sinTheta * cosPhi;
      positions.push(px, py, pz);
      normals.push(px, py, pz);
    }
  }

  for (let y = 0; y < rings; y += 1) {
    for (let x = 0; x < segments; x += 1) {
      const a = y * (segments + 1) + x;
      const b = a + segments + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return {
    positions,
    normals,
    indices,
    bounds: {
      min: [-1, -1, -1],
      max: [1, 1, 1],
    },
  };
}

function packGlb(gltf, binChunk) {
  const jsonChunk = padBuffer(Buffer.from(JSON.stringify(gltf), "utf8"), 4, 0x20);
  const paddedBin = padBuffer(binChunk, 4);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + paddedBin.length;
  const glb = Buffer.alloc(totalLength);
  let offset = 0;

  glb.writeUInt32LE(0x46546c67, offset);
  offset += 4;
  glb.writeUInt32LE(2, offset);
  offset += 4;
  glb.writeUInt32LE(totalLength, offset);
  offset += 4;

  glb.writeUInt32LE(jsonChunk.length, offset);
  offset += 4;
  glb.writeUInt32LE(0x4e4f534a, offset);
  offset += 4;
  jsonChunk.copy(glb, offset);
  offset += jsonChunk.length;

  glb.writeUInt32LE(paddedBin.length, offset);
  offset += 4;
  glb.writeUInt32LE(0x004e4942, offset);
  offset += 4;
  paddedBin.copy(glb, offset);

  return glb;
}

function padBuffer(buffer, multiple, fill = 0) {
  const remainder = buffer.length % multiple;
  if (remainder === 0) return buffer;
  const padded = Buffer.alloc(buffer.length + multiple - remainder, fill);
  buffer.copy(padded);
  return padded;
}

function floatBuffer(values) {
  const buffer = Buffer.alloc(values.length * 4);
  values.forEach((value, index) => buffer.writeFloatLE(value, index * 4));
  return buffer;
}

function uint16Buffer(values) {
  const buffer = Buffer.alloc(values.length * 2);
  values.forEach((value, index) => buffer.writeUInt16LE(value, index * 2));
  return buffer;
}

function color(hex, alpha = 1) {
  return [
    ((hex >> 16) & 255) / 255,
    ((hex >> 8) & 255) / 255,
    (hex & 255) / 255,
    alpha,
  ];
}

function eulerToQuaternion([x, y, z]) {
  const cx = Math.cos(x / 2);
  const sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2);
  const sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2);
  const sz = Math.sin(z / 2);

  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}
