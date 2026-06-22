import * as THREE from "three";

export const assets = {
    environment: "./belfast_sunset_2k.hdr",
    bird: "./action.glb",
    readMan: "./read_man1.glb",
    wingAudio: "./翅膀拍動的聲音2.mp3",
    cooAudio: "./鴿子的叫聲.mp3",
    digitFolder: "./數字/",
    videos: ["./video1.mp4", "./video2.mp4", "./video3.mp4"],
    signs: Array.from({ length: 22 }, (_, index) =>
        `./鴿子拉屎的文字/文字${index ? `_${String(index).padStart(3, "0")}` : ""}.glb`
    )
};

export const endpoints = {
    agree: "https://macn8n.tiramisu-island.com/webhook/get_agree",
    disagree: "https://macn8n.tiramisu-island.com/webhook/get_disagree"
};

export const flightArea = { width: 34, height: 18, depth: 22, centerY: 14, centerZ: -18 };
export const readManPlacement = {
    displaySize: .70, rightMargin: .08, bottomMargin: .6, sinkOffset: .32,
    fadeStart: -.36, fadeEnd: .08, fadeColor: new THREE.Color(0xf29a3d),
    fadeMinOpacity: .03, floatAmplitude: .01, floatSpeed: 1.45,
    animationSpeed: 1, animationPauseSeconds: 2, mirrorX: false,
    rotationX: THREE.MathUtils.degToRad(20),
    rotationY: THREE.MathUtils.degToRad(-110),
    rotationZ: THREE.MathUtils.degToRad(20), mobileScale: .78
};

export const counterPlacement = {
    left: { x: -60, y: -130, scale: .78, rotation: 8 },
    right: { x: 120, y: -110, scale: .78, rotation: 8 },
    mobileScale: .78
};

export const tauntPhrases = ["點個贊呀！！！", "我先走嘍 ~ 掰掰", "贊助一下呀", "投票一下拉"];
