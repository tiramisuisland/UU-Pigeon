import * as THREE from "three";
import { assets } from "../config.js";

export function createVideoPopup(hud) {
    let opened = false;
    function shuffle(items) {
        return [...items].sort(() => Math.random() - .5);
    }
    function open() {
        if (opened) return;
        opened = true;
        const videos = shuffle(assets.videos);
        const width = Math.min(screen.availWidth * .72, 960);
        const height = Math.min(width * 9 / 16, screen.availHeight * .72, 720);
        const features = ["popup=yes", `width=${Math.round(width)}`, `height=${Math.round(height)}`,
            `left=${THREE.MathUtils.randInt(0, Math.max(0, screen.availWidth - width))}`,
            `top=${THREE.MathUtils.randInt(0, Math.max(0, screen.availHeight - height))}`,
            "menubar=no", "toolbar=no", "location=no", "status=no", "resizable=yes", "scrollbars=no"].join(",");
        const url = new URL("./video-popup.html", location.href);
        url.searchParams.set("label", "投票影片");
        url.searchParams.set("video", new URL(videos[0], location.href).href);
        url.searchParams.set("playlist", videos.map((src) => new URL(src, location.href).href).join("|"));
        url.searchParams.set("interval", "20");
        const popup = window.open(url, "button_model_popup", features);
        if (!popup) {
            opened = false;
            hud.innerHTML = "影片小視窗被瀏覽器擋下<br>請允許彈出式視窗";
        } else popup.focus();
    }
    return { open };
}
