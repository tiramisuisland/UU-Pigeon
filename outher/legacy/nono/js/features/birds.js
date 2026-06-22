import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { assets, flightArea, tauntPhrases } from "../config.js";

export function createBirdSystem(core, hud, audioGate) {
    const loader = new GLTFLoader();
    const audioLoader = new THREE.AudioLoader();
    const birds = [];
    const signs = [];
    const signTemplates = [];
    const raycaster = new THREE.Raycaster();
    const clickPoint = new THREE.Vector2();
    const pointer = new THREE.Vector2();
    const pointerWorld = new THREE.Vector3();
    let lastPointerAt = -999;
    let template = null;
    let clips = [];
    let animationLibrary = {};
    let wingBuffer = null;
    let cooBuffer = null;
    let audioUnlocked = false;
    let nextId = 1;
    let nextSpawnAt = 0;

    function resize() {
        const aspect = innerWidth / innerHeight;
        flightArea.width = 28 + aspect * 10;
        flightArea.height = 18 + Math.max(0, 4 / aspect);
        flightArea.depth = 22 + aspect * 6;
    }
    function randomTarget(bird) {
        bird.target.set(
            THREE.MathUtils.randFloatSpread(flightArea.width * 1.7),
            THREE.MathUtils.randFloat(5, flightArea.centerY + flightArea.height * .95),
            THREE.MathUtils.randFloat(flightArea.centerZ - flightArea.depth, flightArea.centerZ + flightArea.depth * .55)
        );
    }
    function playAction(bird, name, fade = .18, once = false, force = false) {
        const action = bird.actions[name];
        if (!action || (bird.currentAction === name && !force)) return;
        const previous = bird.actions[bird.currentAction];
        bird.currentAction = name;
        if (previous && previous !== action) previous.fadeOut(fade);
        action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
        action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
        action.clampWhenFinished = once;
        action.fadeIn(fade).play();
    }
    function setupAnimation(bird) {
        if (!clips.length) return;
        bird.mixer = new THREE.AnimationMixer(bird.visual);
        Object.entries(animationLibrary).forEach(([name, clip]) => {
            if (clip) bird.actions[name] = bird.mixer.clipAction(clip);
        });
        playAction(bird, "idle", 0);
    }
    function setupAudio(bird) {
        bird.wingAudio ||= new THREE.Audio(core.listener);
        bird.cooAudio ||= new THREE.Audio(core.listener);
        if (wingBuffer && bird.wingAudio.buffer !== wingBuffer) {
            bird.wingAudio.setBuffer(wingBuffer); bird.wingAudio.setLoop(true); bird.wingAudio.setVolume(.22);
        }
        if (cooBuffer && bird.cooAudio.buffer !== cooBuffer) {
            bird.cooAudio.setBuffer(cooBuffer); bird.cooAudio.setLoop(false); bird.cooAudio.setVolume(.5);
        }
    }
    function startWings(bird) {
        if (audioUnlocked && bird.wingAudio?.buffer && !bird.wingAudio.isPlaying && !bird.grounded) bird.wingAudio.play();
    }
    function stopWings(bird) {
        if (bird.wingAudio?.isPlaying) bird.wingAudio.stop();
    }
    function coo(bird) {
        if (!audioUnlocked || !bird.cooAudio?.buffer) return;
        if (bird.cooAudio.isPlaying) bird.cooAudio.stop();
        bird.cooAudio.play();
    }
    function dropSign(bird, phrase) {
        if (!signTemplates.length) return;
        const object = clone(signTemplates[Math.floor(Math.random() * signTemplates.length)]);
        object.position.copy(bird.root.localToWorld(new THREE.Vector3(0, -.8, 2.1)));
        object.rotation.copy(bird.root.rotation);
        core.scene.add(object);
        signs.push({ object, velocity: new THREE.Vector3(THREE.MathUtils.randFloatSpread(1.2), -3.5, THREE.MathUtils.randFloatSpread(1.2)), spin: THREE.MathUtils.randFloatSpread(1.2), grounded: false });
    }
    function spawn(elapsed = 0) {
        if (!template) return;
        const bird = {
            id: nextId++, root: new THREE.Group(), visual: clone(template),
            velocity: new THREE.Vector3(THREE.MathUtils.randFloatSpread(6), THREE.MathUtils.randFloat(-.6, 1.2), THREE.MathUtils.randFloatSpread(6)),
            target: new THREE.Vector3(), flightTarget: new THREE.Vector3(), lookTarget: new THREE.Vector3(),
            wander: new THREE.Vector3(THREE.MathUtils.randFloatSpread(10), THREE.MathUtils.randFloatSpread(6), THREE.MathUtils.randFloatSpread(10)),
            seed: Math.random() * 1000, speed: THREE.MathUtils.randFloat(7.5, 12.5),
            scareRadius: THREE.MathUtils.randFloat(13, 20), scareStrength: THREE.MathUtils.randFloat(18, 30),
            crashed: false, grounded: false, reviveAt: -1, actionUntil: 0, actions: {}, currentAction: null,
            nextPoopAt: elapsed + THREE.MathUtils.randFloat(24, 36)
        };
        bird.root.add(bird.visual);
        bird.root.traverse((child) => { child.userData.birdId = bird.id; });
        const edge = Math.floor(Math.random() * 4);
        bird.root.position.set(
            edge === 0 ? -flightArea.width - 18 : edge === 1 ? flightArea.width + 18 : THREE.MathUtils.randFloatSpread(flightArea.width * 1.6),
            THREE.MathUtils.randFloat(8, flightArea.centerY + flightArea.height * .7),
            edge === 2 ? flightArea.centerZ - flightArea.depth - 20 : edge === 3 ? flightArea.centerZ + flightArea.depth + 14 : flightArea.centerZ + THREE.MathUtils.randFloatSpread(flightArea.depth * 1.2)
        );
        randomTarget(bird); setupAnimation(bird); setupAudio(bird); startWings(bird);
        core.scene.add(bird.root); birds.push(bird);
        nextSpawnAt = elapsed + THREE.MathUtils.randFloat(10, 15);
        hud.innerHTML = `有 ${birds.filter((item) => !item.grounded).length} 隻鴿子在飛<br>每 10~15 秒會再飛進來一隻`;
    }
    function revive(bird, elapsed) {
        bird.crashed = bird.grounded = false;
        bird.reviveAt = -1;
        bird.root.position.y = 1.5;
        bird.root.rotation.set(0, bird.root.rotation.y, 0);
        bird.velocity.set(THREE.MathUtils.randFloatSpread(4), THREE.MathUtils.randFloat(7, 11), THREE.MathUtils.randFloatSpread(4));
        bird.nextPoopAt = elapsed + THREE.MathUtils.randFloat(24, 36);
        randomTarget(bird); playAction(bird, "idle", 0, false, true); startWings(bird);
    }
    function updateSigns(delta) {
        signs.forEach((sign) => {
            if (sign.grounded) return;
            sign.velocity.y -= 10 * delta;
            sign.object.position.addScaledVector(sign.velocity, delta);
            sign.object.rotation.y += sign.spin * .35 * delta;
            sign.object.rotation.z += sign.spin * delta;
            if (sign.object.position.y <= 1.1) {
                sign.object.position.y = 1.1; sign.velocity.set(0, 0, 0); sign.grounded = true;
                sign.object.rotation.x = Math.PI / 2;
            }
        });
    }
    function updateFlyingBird(bird, delta, elapsed, pointerActive) {
        if (elapsed >= bird.nextPoopAt) {
            const phrase = tauntPhrases[Math.floor(Math.random() * tauntPhrases.length)];
            dropSign(bird, phrase); bird.nextPoopAt = elapsed + THREE.MathUtils.randFloat(24, 36);
            playAction(bird, "poop", .12, true, true); bird.actionUntil = elapsed + 1.6;
            hud.innerHTML = `鴿子丟下標語：${phrase}<br>牠還在畫面裡亂飛`;
        }
        if (bird.root.position.distanceTo(bird.target) < 3.5) randomTarget(bird);
        bird.flightTarget.copy(bird.target);
        bird.flightTarget.x += Math.sin(elapsed * .8 + bird.seed) * bird.wander.x;
        bird.flightTarget.y += Math.cos(elapsed * 1.1 + bird.seed * .7) * bird.wander.y;
        bird.flightTarget.z += Math.sin(elapsed * .65 + bird.seed * 1.3) * bird.wander.z;
        let evading = false;
        if (pointerActive) {
            const away = new THREE.Vector3().subVectors(bird.root.position, pointerWorld);
            const distance = away.length();
            if (distance < bird.scareRadius) {
                const strength = (1 - distance / bird.scareRadius) * bird.scareStrength;
                bird.flightTarget.add(away.normalize().multiplyScalar(strength));
                bird.flightTarget.y += strength * .6; evading = true;
            }
        }
        bird.speed = THREE.MathUtils.lerp(bird.speed, evading ? 15 : 9.5, evading ? .08 : .03);
        if (elapsed >= bird.actionUntil) playAction(bird, evading ? "evade" : "idle", evading ? .1 : .2);
        bird.flightTarget.y = THREE.MathUtils.clamp(bird.flightTarget.y, 5, flightArea.centerY + flightArea.height);
        bird.flightTarget.x = THREE.MathUtils.clamp(bird.flightTarget.x, -flightArea.width - 8, flightArea.width + 8);
        bird.flightTarget.z = THREE.MathUtils.clamp(bird.flightTarget.z, flightArea.centerZ - flightArea.depth - 8, flightArea.centerZ + flightArea.depth * .75);
        const desired = new THREE.Vector3().subVectors(bird.flightTarget, bird.root.position).normalize().multiplyScalar(bird.speed);
        bird.velocity.lerp(desired, .05);
        bird.root.position.addScaledVector(bird.velocity, delta);
        bird.lookTarget.copy(bird.root.position).add(bird.velocity);
        bird.root.lookAt(bird.lookTarget);
    }
    function update(delta, elapsed) {
        if (template && elapsed >= nextSpawnAt) spawn(elapsed);
        updateSigns(delta);
        const pointerActive = elapsed - lastPointerAt < 4;
        if (pointerActive) pointerWorld.set(pointer.x * flightArea.width, flightArea.centerY + pointer.y * flightArea.height, flightArea.centerZ + pointer.x * 10 - pointer.y * flightArea.depth * .9);
        birds.forEach((bird) => {
            if (bird.mixer && !bird.grounded) bird.mixer.update(delta);
            if (!bird.crashed) updateFlyingBird(bird, delta, elapsed, pointerActive);
            else if (!bird.grounded) {
                stopWings(bird); bird.velocity.multiplyScalar(.985); bird.root.position.addScaledVector(bird.velocity, delta);
                bird.root.position.y -= (bird.fallSpeed = (bird.fallSpeed || 0) + 16 * delta) * delta;
                bird.root.rotation.x = THREE.MathUtils.lerp(bird.root.rotation.x, Math.PI / 2, .06);
                if (bird.root.position.y <= 1.2) {
                    bird.root.position.y = 1.2; bird.root.rotation.x = Math.PI / 2; bird.grounded = true; bird.reviveAt = elapsed + 5;
                    hud.innerHTML = "有鴿子被打下來了<br>5 秒後有機率自動復活";
                }
            } else if (elapsed >= bird.reviveAt && bird.reviveAt > 0) {
                bird.reviveAt = -1;
                if (Math.random() < .1) { revive(bird, elapsed); hud.innerHTML = "有一隻鴿子自動復活了"; }
                else hud.innerHTML = "有一隻鴿子沒有復活<br>牠繼續躺在地上";
            }
        });
    }
    function pointerMove(event, elapsed) {
        pointer.set(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight * 2 - 1));
        lastPointerAt = elapsed;
    }
    function click(event, elapsed) {
        const roots = birds.filter((bird) => !bird.crashed).map((bird) => bird.root);
        clickPoint.set(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight * 2 - 1));
        raycaster.setFromCamera(clickPoint, core.camera);
        const hit = raycaster.intersectObjects(roots, true)[0];
        let node = hit?.object;
        while (node && !node.userData.birdId) node = node.parent;
        const bird = birds.find((item) => item.id === node?.userData.birdId);
        if (!bird) return;
        if (Math.random() < .25) {
            randomTarget(bird); playAction(bird, "evade", .08, false, true); bird.actionUntil = elapsed + .8; coo(bird);
            hud.innerHTML = "命中一隻鴿子<br>牠閃過去了，沒有墜落";
            return;
        }
        bird.crashed = true; bird.fallSpeed = 0; dropSign(bird, "幹麻打我"); coo(bird); stopWings(bird);
        playAction(bird, "hit", .05, true, true); bird.actionUntil = elapsed + 1.2;
        hud.innerHTML = "命中一隻鴿子<br>牠丟下「幹麻打我」後墜落";
    }
    function unlockAudio() {
        audioUnlocked = true; audioGate.classList.add("is-hidden");
        birds.filter((bird) => !bird.crashed && !bird.grounded).forEach(startWings);
    }
    function load() {
        assets.signs.forEach((path) => loader.load(path, (gltf) => {
            const object = gltf.scene;
            const box = new THREE.Box3().setFromObject(object); const size = new THREE.Vector3(); const center = new THREE.Vector3();
            box.getSize(size); box.getCenter(center); object.position.sub(center); object.scale.setScalar(5 / (Math.max(size.x, size.y, size.z) || 1));
            signTemplates.push(object);
        }, undefined, console.error));
        audioLoader.load(assets.wingAudio, (buffer) => { wingBuffer = buffer; birds.forEach(setupAudio); }, undefined, console.error);
        audioLoader.load(assets.cooAudio, (buffer) => { cooBuffer = buffer; birds.forEach(setupAudio); }, undefined, console.error);
        loader.load(assets.bird, (gltf) => {
            template = gltf.scene; clips = gltf.animations;
            animationLibrary = {
                idle: clips.find((clip) => clip.name.includes("基本") && !clip.name.includes("拉")),
                evade: clips.find((clip) => clip.name.includes("閃避")), hit: clips.find((clip) => clip.name.includes("擊中")),
                poop: clips.find((clip) => clip.name.includes("拉"))
            };
            const box = new THREE.Box3().setFromObject(template); const size = new THREE.Vector3(); const center = new THREE.Vector3();
            box.getSize(size); box.getCenter(center); template.position.sub(center); template.scale.setScalar(4 / (Math.max(size.x, size.y, size.z) || 1));
            spawn(0);
        }, undefined, (error) => { console.error(error); hud.innerHTML = "模型載入失敗<br>請確認 action.glb 存在"; });
    }
    resize();
    return { load, resize, update, pointerMove, click, unlockAudio };
}
