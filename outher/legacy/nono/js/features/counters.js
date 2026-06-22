import * as THREE from "three";
import { assets, counterPlacement, endpoints } from "../config.js";

export function createCounters(overlayCamera, getAnchor, hud) {
    const elements = {
        agree: document.querySelector("#agreeCounter"),
        disagree: document.querySelector("#disagreeCounter")
    };
    const sprites = new Map();
    const values = { agree: "00000", disagree: "00000" };
    const screenPosition = new THREE.Vector3();

    function numberText(value) {
        return (String(value ?? "").match(/\d+/)?.[0] ?? "0").padStart(5, "0");
    }
    function neonDigit(digit) {
        const canvas = document.createElement("canvas");
        canvas.className = "readman-digit";
        canvas.width = 10;
        canvas.height = 16;
        canvas.setAttribute("aria-label", digit);
        const image = sprites.get(digit);
        if (!image) return canvas;
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, 10, 16);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const dark = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3 < 180;
            imageData.data[i] = 255;
            imageData.data[i + 1] = 232;
            imageData.data[i + 2] = 164;
            imageData.data[i + 3] = dark ? 255 : 0;
        }
        context.putImageData(imageData, 0, 0);
        return canvas;
    }
    function render(name) {
        const digits = numberText(values[name]);
        elements[name].replaceChildren(...Array.from(digits, neonDigit));
        elements[name].setAttribute("aria-label", `目前數字 ${digits}`);
    }
    async function fetchValue(name) {
        try {
            const response = await fetch(endpoints[name], { cache: "no-store" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            values[name] = data.content ?? data.point;
            render(name);
        } catch (error) {
            console.error(`${name} point 讀取失敗`, error);
        }
    }
    function updatePosition() {
        const anchor = getAnchor();
        if (!anchor) {
            Object.values(elements).forEach((element) => element.classList.remove("is-visible"));
            return;
        }
        anchor.getWorldPosition(screenPosition);
        screenPosition.project(overlayCamera);
        const x = (screenPosition.x * .5 + .5) * innerWidth;
        const y = (-screenPosition.y * .5 + .5) * innerHeight;
        const responsive = innerWidth < 720 ? counterPlacement.mobileScale : 1;
        [[elements.agree, counterPlacement.left], [elements.disagree, counterPlacement.right]].forEach(([element, place]) => {
            element.style.left = `${x + place.x * responsive}px`;
            element.style.top = `${y + place.y * responsive}px`;
            element.style.transform = `translate(-50%, -50%) rotate(${place.rotation}deg) scale(${place.scale * responsive})`;
            element.classList.add("is-visible");
        });
    }
    async function start() {
        try {
            await Promise.all(Array.from({ length: 10 }, (_, digit) => new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => { sprites.set(String(digit), image); resolve(); };
                image.onerror = reject;
                image.src = `${assets.digitFolder}${digit}.bmp`;
            })));
            Object.keys(elements).forEach(render);
            Object.keys(elements).forEach(fetchValue);
            setInterval(() => Object.keys(elements).forEach(fetchValue), 10000);
        } catch (error) {
            console.error(error);
            hud.innerHTML = "數字貼圖載入失敗<br>請確認數字資料夾存在";
        }
    }
    return { start, updatePosition };
}
