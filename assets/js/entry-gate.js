const explosionPopupStorageKey = "explosionPopupAccessReady";
const explosionCloseSignalKey = "uuPigeonExplosionCloseMain";
let mainPageAudioContext = null;

window.unlockUUPigeonSound = async function unlockUUPigeonSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return true;
    }

    mainPageAudioContext ||= new AudioContextClass();
    const oscillator = mainPageAudioContext.createOscillator();
    const gain = mainPageAudioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 440;
    gain.gain.setValueAtTime(0.001, mainPageAudioContext.currentTime);
    oscillator.connect(gain);
    gain.connect(mainPageAudioContext.destination);
    oscillator.start();
    oscillator.stop(mainPageAudioContext.currentTime + 0.035);

    await mainPageAudioContext.resume();
    return mainPageAudioContext.state === "running";
};

window.completeExplosionPermission = function completeExplosionPermission() {
    const permissionFrame = document.querySelector(".popup-permission-frame");
    const frontPageFrame = document.querySelector(".front-page-frame");
    if (!frontPageFrame) {
        return;
    }

    permissionFrame?.setAttribute("hidden", "");
    frontPageFrame.removeAttribute("hidden");
    if (!frontPageFrame.getAttribute("src")) {
        frontPageFrame.src = frontPageFrame.dataset.src;
    }
};

window.closeUUPigeonMainPageAfterExplosion = function closeUUPigeonMainPageAfterExplosion() {
    document.body.innerHTML = "";
    document.body.style.background = "#000";
    document.documentElement.style.background = "#000";
    document.title = "";
    try {
        window.open("", "_self");
    } catch (error) {
        // Some browsers disallow this close workaround.
    }
    window.close();
    window.setTimeout(() => {
        if (!window.closed) {
            window.location.replace("about:blank");
        }
    }, 180);
};

window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) {
        return;
    }

    if (event.data?.type === "close-uu-pigeon-main-after-explosion") {
        window.closeUUPigeonMainPageAfterExplosion();
    }
});

window.addEventListener("storage", (event) => {
    if (event.key === explosionCloseSignalKey && event.newValue) {
        window.closeUUPigeonMainPageAfterExplosion();
    }
});
