import * as THREE from "three";
import { createScene } from "./core/scene.js";
import { createEnvironment } from "./features/environment.js";
import { createReadMan } from "./features/read-man.js";
import { createCounters } from "./features/counters.js";
import { createVideoPopup } from "./features/video-popup.js";
import { createBirdSystem } from "./features/birds.js";

const hud = document.querySelector(".hud");
const audioGate = document.querySelector(".audio-gate");
const audioButton = document.querySelector(".audio-button");
const core = createScene();
const environment = createEnvironment(core, hud);
const readMan = createReadMan(core, () => environment.environmentMap);
const counters = createCounters(core.overlayCamera, () => readMan.anchor, hud);
const popup = createVideoPopup(hud);
const birds = createBirdSystem(core, hud, audioGate);
const clock = new THREE.Clock();

readMan.load();
counters.start();
birds.load();

function resize() {
    core.resize();
    birds.resize();
    readMan.resize();
    counters.updatePosition();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;
    environment.update(elapsed);
    birds.update(delta, elapsed);
    readMan.update(delta, elapsed);
    counters.updatePosition();
    core.render();
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => birds.pointerMove(event, clock.elapsedTime));
window.addEventListener("click", (event) => birds.click(event, clock.elapsedTime));
audioButton.addEventListener("click", () => { birds.unlockAudio(); popup.open(); });

animate();
