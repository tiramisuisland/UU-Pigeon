import * as THREE from "three";

export function createScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd99870, 34, 128);

    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 300);
    camera.position.set(0, 9, 26);
    camera.lookAt(0, 12, -18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .3;
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);

    const overlayScene = new THREE.Scene();
    const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 20);
    overlayCamera.position.z = 10;

    const listener = new THREE.AudioListener();
    camera.add(listener);

    [scene, overlayScene].forEach((target) => {
        target.add(new THREE.HemisphereLight(0xffd2b0, 0xc77b4f, 1.9));
        const sun = new THREE.DirectionalLight(0xffc38b, 2.8);
        sun.position.set(-22, 16, 18);
        target.add(sun);
    });

    function resize() {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        const aspect = innerWidth / innerHeight;
        Object.assign(overlayCamera, { left: -aspect, right: aspect, top: 1, bottom: -1 });
        overlayCamera.updateProjectionMatrix();
    }

    function render() {
        renderer.clear();
        renderer.render(scene, camera);
        renderer.clearDepth();
        renderer.render(overlayScene, overlayCamera);
    }

    resize();
    return { scene, camera, renderer, overlayScene, overlayCamera, listener, resize, render };
}
