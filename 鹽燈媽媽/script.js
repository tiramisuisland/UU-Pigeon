const popupItems = [
  { title: "SM", file: "SM.mp4", slot: "center" },
  { title: "SB Left", file: "SB.mp4", slot: "left" },
  { title: "SB Right", file: "SB.mp4", slot: "right" },
];

const fallbackSize = { width: 560, height: 360 };
const measuredSizes = popupItems.map(() => ({ ...fallbackSize }));
const gap = 40;
let launcherPopupWindows = [];
let launcherPopupMonitor = 0;
let launcherPopupClosing = false;

function getScreenBounds() {
  const screenLeft = window.screen.availLeft || 0;
  const screenTop = window.screen.availTop || 0;
  const screenWidth = window.screen.availWidth || window.screen.width;
  const screenHeight = window.screen.availHeight || window.screen.height;

  return { screenLeft, screenTop, screenWidth, screenHeight };
}

function clampPlacement(left, top, width, height) {
  const { screenLeft, screenTop, screenWidth, screenHeight } = getScreenBounds();
  const maxLeft = screenLeft + screenWidth - width;
  const maxTop = screenTop + screenHeight - height;

  return {
    left: Math.max(screenLeft, Math.min(maxLeft, Math.round(left))),
    top: Math.max(screenTop, Math.min(maxTop, Math.round(top))),
  };
}

function getPlacement(index, width, height) {
  const item = popupItems[index] || popupItems[0];
  const centerSize = measuredSizes[0] || fallbackSize;
  const { screenLeft, screenTop, screenWidth, screenHeight } = getScreenBounds();
  const centerLeft = screenLeft + (screenWidth - centerSize.width) / 2;
  const centerTop = screenTop + (screenHeight - centerSize.height) / 2;

  if (item.slot === "center") {
    return clampPlacement(
      screenLeft + (screenWidth - width) / 2,
      screenTop + (screenHeight - height) / 2,
      width,
      height
    );
  }

  if (item.slot === "left") {
    return clampPlacement(centerLeft - width - gap, centerTop, width, height);
  }

  return clampPlacement(centerLeft + centerSize.width + gap, centerTop, width, height);
}

function syncPopupToVideo(index, video) {
  if (!video.videoWidth || !video.videoHeight) return;

  const chromeWidth = Math.max(0, window.outerWidth - window.innerWidth);
  const chromeHeight = Math.max(0, window.outerHeight - window.innerHeight);
  const outerWidth = video.videoWidth + chromeWidth;
  const outerHeight = video.videoHeight + chromeHeight;
  const { left, top } = getPlacement(index, outerWidth, outerHeight);

  window.resizeTo(outerWidth, outerHeight);
  window.moveTo(left, top);
}

function startVideo(video) {
  video.muted = false;
  video.volume = 1;
  const playRequest = video.play();

  if (playRequest) {
    playRequest.catch(() => {
      video.muted = true;
      video.volume = 0;
      video.play().catch(() => {
        video.setAttribute("controls", "");
      });
    });
  }
}

function unmuteAndPlay(video) {
  video.muted = false;
  video.volume = 1;
  video.play().catch(() => {});
}

function setupPopupPage() {
  const params = new URLSearchParams(window.location.search);
  const index = Number(params.get("video") || 0);
  const item = popupItems[index] || popupItems[0];
  const video = document.querySelector("#popupVideo");

  document.title = item.title;
  video.loop = item.file === "SB.mp4";
  video.src = item.file;
  video.addEventListener("loadedmetadata", () => {
    measuredSizes[index] = {
      width: video.videoWidth,
      height: video.videoHeight,
    };
    syncPopupToVideo(index, video);
    startVideo(video);
  });
  window.addEventListener("pointerdown", () => unmuteAndPlay(video));
  window.addEventListener("focus", () => unmuteAndPlay(video));
  window.addEventListener("resize", () => syncPopupToVideo(index, video));
  window.addEventListener("focus", () => syncPopupToVideo(index, video));
}

function preloadVideoSizes() {
  popupItems.forEach((item, index) => {
    const probe = document.createElement("video");

    probe.preload = "metadata";
    probe.src = item.file;
    probe.addEventListener("loadedmetadata", () => {
      if (probe.videoWidth && probe.videoHeight) {
        measuredSizes[index] = {
          width: probe.videoWidth,
          height: probe.videoHeight,
        };
      }
    }, { once: true });
  });
}

function getPopupFeatures(index) {
  const { width, height } = measuredSizes[index] || fallbackSize;
  const { left, top } = getPlacement(index, width, height);

  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "popup=yes",
    "resizable=yes",
    "scrollbars=no",
  ].join(",");
}

function openBlankPopup(index) {
  return window.open("about:blank", `sm-sb-popup-${index}`, getPopupFeatures(index));
}

function closeLauncherPopups() {
  if (launcherPopupClosing) return;

  launcherPopupClosing = true;
  window.clearInterval(launcherPopupMonitor);
  launcherPopupMonitor = 0;

  launcherPopupWindows.forEach((popup) => {
    if (popup && !popup.closed) {
      popup.close();
    }
  });

  launcherPopupWindows = [];
  window.setTimeout(() => {
    launcherPopupClosing = false;
  }, 500);
}

function monitorLauncherPopups(onClosed) {
  window.clearInterval(launcherPopupMonitor);
  launcherPopupMonitor = window.setInterval(() => {
    if (!launcherPopupWindows.length) {
      window.clearInterval(launcherPopupMonitor);
      launcherPopupMonitor = 0;
      return;
    }

    if (launcherPopupWindows.some((popup) => !popup || popup.closed)) {
      closeLauncherPopups();
      onClosed?.();
    }
  }, 300);
}

function setupLauncherPage() {
  const button = document.querySelector("#launchButton");
  const status = document.querySelector("#launchStatus");

  preloadVideoSizes();

  button.addEventListener("click", () => {
    button.disabled = true;
    status.textContent = "Opening popup windows...";
    closeLauncherPopups();
    launcherPopupClosing = false;

    const openedPopups = [];
    const blockedItems = [];

    popupItems.forEach((item, index) => {
      const popup = openBlankPopup(index);

      if (popup) {
        popup.location.href = `popup.html?video=${index}`;
        openedPopups.push(popup);
      } else {
        blockedItems.push(item);
      }
    });

    if (blockedItems.length) {
      openedPopups.forEach((popup) => {
        if (popup && !popup.closed) {
          popup.close();
        }
      });
      const names = blockedItems.map((item) => item.title).join(", ");
      status.textContent = `Still missing: ${names}. Allow popups, then click again.`;
      button.textContent = "Open Popups";
      button.disabled = false;
      return;
    }

    launcherPopupWindows = openedPopups;
    monitorLauncherPopups(() => {
      status.textContent = "One popup was closed, so all popup windows were closed.";
      button.disabled = false;
    });
    status.textContent = "All popup windows are open.";
    button.textContent = "Open Popups";
    button.disabled = false;
  });

  window.addEventListener("beforeunload", closeLauncherPopups);
}

if (document.body.classList.contains("popup-page")) {
  setupPopupPage();
} else {
  setupLauncherPage();
}
