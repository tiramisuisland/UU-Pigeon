import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assets, readManPlacement as place } from "../config.js";

export function createReadMan(core, getEnvironmentMap) {
    let anchor = null;
    let model = null;
    let mixer = null;
    let actions = [];
    let cycleEnd = -1;
    let resumeAt = -1;
    let environmentApplied = false;

    function addFade(material) {
        if (material.userData.hasReadManFade) return;
        material.userData.hasReadManFade = true;
        material.transparent = true;
        material.onBeforeCompile = (shader) => {
            shader.uniforms.fadeBottom = { value: -1 };
            shader.uniforms.fadeTop = { value: 0 };
            shader.uniforms.fadeColor = { value: place.fadeColor };
            shader.uniforms.fadeOpacity = { value: place.fadeMinOpacity };
            shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vReadWorld;")
                .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvReadWorld = worldPosition.xyz;");
            shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform float fadeBottom; uniform float fadeTop; uniform vec3 fadeColor; uniform float fadeOpacity; varying vec3 vReadWorld;")
                .replace("#include <dithering_fragment>", "float f=smoothstep(fadeBottom,fadeTop,vReadWorld.y); gl_FragColor.rgb=mix(gl_FragColor.rgb,fadeColor,(1.0-f)*0.92); gl_FragColor.a*=mix(fadeOpacity,1.0,f); #include <dithering_fragment>");
            material.userData.fadeShader = shader;
            updateFade();
        };
        material.needsUpdate = true;
    }
    function updateFade() {
        if (!anchor || !model) return;
        model.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => {
                const shader = material.userData.fadeShader;
                if (!shader) return;
                shader.uniforms.fadeBottom.value = anchor.position.y + place.fadeStart;
                shader.uniforms.fadeTop.value = anchor.position.y + place.fadeEnd;
            });
        });
    }
    function applyMaterials() {
        if (!model) return;
        const environmentMap = getEnvironmentMap();
        model.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => {
                addFade(material);
                if (environmentMap && "envMap" in material) material.envMap = environmentMap;
                if ("envMapIntensity" in material) material.envMapIntensity = 1.25;
                material.needsUpdate = true;
            });
        });
        environmentApplied = Boolean(environmentMap);
    }
    function resize() {
        if (!anchor || !model) return;
        const responsive = innerWidth < 720 ? place.mobileScale : 1;
        const size = place.displaySize * responsive;
        anchor.position.set(core.overlayCamera.right - place.rightMargin - size / 2,
            core.overlayCamera.bottom + place.bottomMargin + size / 2 - place.sinkOffset, 0);
        anchor.userData.baseY = anchor.position.y;
        const scale = model.userData.baseScale * size;
        model.scale.set(place.mirrorX ? -scale : scale, scale, scale);
        model.position.copy(model.userData.center).multiplyScalar(-scale);
        anchor.rotation.set(place.rotationX, place.rotationY, place.rotationZ);
        updateFade();
    }
    function startCycle(elapsed = 0) {
        if (!mixer || !actions.length) return;
        const speed = Math.abs(place.animationSpeed);
        mixer.timeScale = place.animationSpeed;
        resumeAt = -1;
        cycleEnd = speed ? elapsed + Math.max(...actions.map((action) => action.getClip().duration)) / speed : Infinity;
        actions.forEach((action) => action.reset().play());
    }
    function load() {
        new GLTFLoader().load(assets.readMan, (gltf) => {
            model = gltf.scene;
            anchor = new THREE.Group();
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size); box.getCenter(center);
            model.userData.baseScale = 1 / (Math.max(size.x, size.y, size.z) || 1);
            model.userData.center = center;
            anchor.add(model);
            core.overlayScene.add(anchor);
            if (gltf.animations.length) {
                mixer = new THREE.AnimationMixer(model);
                actions = gltf.animations.map((clip) => {
                    const action = mixer.clipAction(clip);
                    action.setLoop(THREE.LoopOnce, 1);
                    action.clampWhenFinished = true;
                    return action;
                });
                startCycle();
            }
            applyMaterials(); resize();
        }, undefined, console.error);
    }
    function update(delta, elapsed) {
        if (!anchor) return;
        if (mixer && resumeAt > 0 && elapsed >= resumeAt) startCycle(elapsed);
        else if (mixer && resumeAt < 0) {
            mixer.update(delta);
            if (elapsed >= cycleEnd) { cycleEnd = -1; resumeAt = elapsed + place.animationPauseSeconds; }
        }
        anchor.position.y = anchor.userData.baseY + Math.sin(elapsed * place.floatSpeed) * place.floatAmplitude;
        anchor.rotation.x = place.rotationX + Math.sin(elapsed * place.floatSpeed * .8) * .025;
        if (!environmentApplied && getEnvironmentMap()) applyMaterials();
        updateFade();
    }
    return { load, resize, update, get anchor() { return anchor; } };
}
