import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { assets } from "../config.js";

export function createEnvironment(core, hud) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const ground = new THREE.Mesh(
        new THREE.CircleGeometry(48, 64),
        new THREE.MeshStandardMaterial({ map: texture, transparent: true, opacity: .9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -18);
    core.scene.add(ground);

    const clouds = new THREE.Group();
    core.scene.add(clouds);
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xcfe8bf, emissive: 0xb9d9ab, emissiveIntensity: .18,
        transparent: true, opacity: .76, roughness: 1
    });
    function addCloud(x, y, z, scale) {
        const cloud = new THREE.Group();
        [[0,0,1.2],[1.6,.2,1],[-1.5,.1,.9],[.4,.7,.95]].forEach(([px, py, size]) => {
            const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 24), cloudMaterial);
            puff.position.set(px, py, 0);
            cloud.add(puff);
        });
        cloud.position.set(x, y, z);
        cloud.scale.setScalar(scale);
        clouds.add(cloud);
    }
    [[-18,10,-24,1.8],[12,16,-36,2.2],[28,9,-50,2.8],[-30,18,-58,2.3],[2,6,-18,1.3]]
        .forEach((values) => addCloud(...values));

    function drawGround(elapsed = 0) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, "#b77079");
        gradient.addColorStop(.48, "#d48a69");
        gradient.addColorStop(1, "#f29a3d");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (let row = 0; row < 14; row++) {
            ctx.beginPath();
            for (let x = -20; x <= 532; x += 8) {
                const y = 82 + row * 28 + Math.sin(x * .025 + elapsed * 1.8 + row * .7) * 5 + Math.sin(x * .055 - elapsed * 1.15 + row) * 2;
                x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(255,232,178,${.08 + row * .006})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
        texture.needsUpdate = true;
    }

    const pmrem = new THREE.PMREMGenerator(core.renderer);
    pmrem.compileEquirectangularShader();
    let environmentMap = null;
    new RGBELoader().load(assets.environment, (source) => {
        environmentMap = pmrem.fromEquirectangular(source).texture;
        core.scene.environment = core.overlayScene.environment = environmentMap;
        source.dispose();
        pmrem.dispose();
    }, undefined, (error) => {
        console.error(error);
        hud.innerHTML = "HDR 環境光載入失敗<br>請確認環境檔案存在";
    });

    drawGround();
    return {
        get environmentMap() { return environmentMap; },
        update(elapsed) {
            drawGround(elapsed);
            clouds.children.forEach((cloud, index) => {
                cloud.position.x += .01 + index * .002;
                if (cloud.position.x > 36) cloud.position.x = -36;
            });
        }
    };
}
