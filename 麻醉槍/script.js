const videos = [
  { title: "Sing F", file: "Sing F.mp4" },
  { title: "Sing ppl", file: "Sing ppl.mp4" },
  { title: "Sing D", file: "Sing D.mp4" },
  { title: "Sing S", file: "Sing S.mp4" },
  { title: "Sing U", file: "Sing U.mp4" },
  { title: "Sing N", file: "Sing N.mp4" },
];

const channel = "BroadcastChannel" in window ? new BroadcastChannel("popup-video-unlock") : null;
const unlockKey = "popupVideoUnlock";
const popupMargin = 36;
const popupPositionKey = "popupVideoPositions";
const maxOverlapArea = 100 * 200;
const fallbackSize = { width: 560, height: 360 };
const measuredSizes = videos.map(() => ({ ...fallbackSize }));
let metadataReady = Promise.resolve(measuredSizes);
let unlocked = false;
let launcherPopupWindows = [];
let launcherPopupMonitor = 0;
let launcherPopupClosing = false;

function fitVideoSizeToScreen(width, height, maxRatio = 0.72) {
  const { screenWidth, screenHeight } = getScreenBounds();
  const maxWidth = Math.max(1, Math.floor((screenWidth - popupMargin * 2) * maxRatio));
  const maxHeight = Math.max(1, Math.floor((screenHeight - popupMargin * 2) * maxRatio));
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function broadcastUnlock() {
  channel?.postMessage({ type: "unlock" });
  localStorage.setItem(unlockKey, String(Date.now()));
}

function playVideo(video) {
  video.currentTime = 0;
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

function autoplayMutedVideo(video) {
  video.muted = true;
  video.volume = 0;
  video.play().catch(() => {});
}

function unlockPopup({ broadcast = true } = {}) {
  const video = document.querySelector("video");

  if (unlocked || !video) return;

  unlocked = true;
  document.body.classList.add("is-unlocked");
  playVideo(video);

  if (broadcast) {
    broadcastUnlock();
  }
}

function setupPopupPage() {
  const params = new URLSearchParams(window.location.search);
  const index = Number(params.get("video") || 0);
  const run = params.get("run") || "";
  const lockPlacement = params.get("lockPlacement") === "1";
  const item = videos[index] || videos[0];
  const video = document.querySelector("#popupVideo");
  const overlay = document.querySelector(".warning-overlay");

  document.title = item.title;
  video.src = item.file;
  video.addEventListener("loadeddata", () => autoplayMutedVideo(video), { once: true });
  autoplayMutedVideo(video);
  if (!lockPlacement) {
    video.addEventListener("loadedmetadata", () => syncPopupToVideo(index, video, run));
    window.addEventListener("resize", () => syncPopupToVideo(index, video, run));
    window.addEventListener("focus", () => syncPopupToVideo(index, video, run));
  }
  overlay.addEventListener("click", () => unlockPopup());

  channel?.addEventListener("message", (event) => {
    if (event.data?.type === "unlock") {
      unlockPopup({ broadcast: false });
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === unlockKey && event.newValue) {
      unlockPopup({ broadcast: false });
    }
  });
}

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

function getPlacementFromRatio(index, width, height, run) {
  const positions = readPopupPositions(run);
  const position = positions[index];
  const { screenLeft, screenTop, screenWidth, screenHeight } = getScreenBounds();
  const availableWidth = Math.max(0, screenWidth - width - popupMargin * 2);
  const availableHeight = Math.max(0, screenHeight - height - popupMargin * 2);

  if (!position) {
    return makeRandomPlacement(width, height);
  }

  return clampPlacement(
    screenLeft + popupMargin + availableWidth * position.x,
    screenTop + popupMargin + availableHeight * position.y,
    width,
    height
  );
}

function getCenteredPlacement(width, height) {
  const { screenLeft, screenTop, screenWidth, screenHeight } = getScreenBounds();

  return clampPlacement(
    screenLeft + (screenWidth - width) / 2,
    screenTop + (screenHeight - height) / 2,
    width,
    height
  );
}

function getOverlapArea(rectA, rectB) {
  const width = Math.max(
    0,
    Math.min(rectA.left + rectA.width, rectB.left + rectB.width) - Math.max(rectA.left, rectB.left)
  );
  const height = Math.max(
    0,
    Math.min(rectA.top + rectA.height, rectB.top + rectB.height) - Math.max(rectA.top, rectB.top)
  );

  return width * height;
}

function makeRandomPlacement(width, height, existing = []) {
  const { screenLeft, screenTop, screenWidth, screenHeight } = getScreenBounds();
  const maxLeft = Math.max(screenLeft + popupMargin, screenLeft + screenWidth - width - popupMargin);
  const maxTop = Math.max(screenTop + popupMargin, screenTop + screenHeight - height - popupMargin);
  const minLeft = screenLeft + popupMargin;
  const minTop = screenTop + popupMargin;
  let best = { left: minLeft, top: minTop, maxOverlap: Infinity, totalOverlap: Infinity };

  for (let attempt = 0; attempt < 220; attempt += 1) {
    const left = minLeft + Math.random() * Math.max(0, maxLeft - minLeft);
    const top = minTop + Math.random() * Math.max(0, maxTop - minTop);
    const rect = { left, top, width, height };
    const overlaps = existing.map((existingRect) => getOverlapArea(rect, existingRect));
    const maxOverlap = overlaps.length ? Math.max(...overlaps) : 0;
    const totalOverlap = overlaps.reduce((sum, area) => sum + area, 0);

    if (
      maxOverlap < best.maxOverlap ||
      (maxOverlap === best.maxOverlap && totalOverlap < best.totalOverlap)
    ) {
      best = { left, top, maxOverlap, totalOverlap };
    }

    if (maxOverlap <= maxOverlapArea) break;
  }

  return clampPlacement(best.left, best.top, width, height);
}

function makeRandomPositionSet(sizes) {
  const placements = [];

  return videos.map((item, index) => {
    const size = sizes[index] || fallbackSize;
    const placement = index === 0
      ? getCenteredPlacement(size.width, size.height)
      : makeRandomPlacement(size.width, size.height, placements);

    placements.push({
      left: placement.left,
      top: placement.top,
      width: size.width,
      height: size.height,
    });

    return placementToRatio(placement.left, placement.top, size.width, size.height);
  });
}

function placementToRatio(left, top, width, height) {
  const { screenLeft, screenTop, screenWidth, screenHeight } = getScreenBounds();
  const availableWidth = Math.max(1, screenWidth - width - popupMargin * 2);
  const availableHeight = Math.max(1, screenHeight - height - popupMargin * 2);

  return {
    x: Math.max(0, Math.min(1, (left - screenLeft - popupMargin) / availableWidth)),
    y: Math.max(0, Math.min(1, (top - screenTop - popupMargin) / availableHeight)),
  };
}

function savePopupPositions(run, positions) {
  localStorage.setItem(
    popupPositionKey,
    JSON.stringify({ run, positions })
  );
}

function readPopupPositions(run) {
  try {
    const payload = JSON.parse(localStorage.getItem(popupPositionKey) || "{}");

    if (payload.run === run && Array.isArray(payload.positions)) {
      return payload.positions;
    }
  } catch {
    return [];
  }

  return [];
}

function syncPopupToVideo(index, video, run) {
  if (!video.videoWidth || !video.videoHeight) return;

  const chromeWidth = Math.max(0, window.outerWidth - window.innerWidth);
  const chromeHeight = Math.max(0, window.outerHeight - window.innerHeight);
  const fittedSize = fitVideoSizeToScreen(video.videoWidth, video.videoHeight);
  measuredSizes[index] = fittedSize;
  const outerWidth = fittedSize.width + chromeWidth;
  const outerHeight = fittedSize.height + chromeHeight;
  const { left, top } = getPlacementFromRatio(index, outerWidth, outerHeight, run);

  window.resizeTo(outerWidth, outerHeight);
  window.moveTo(left, top);
}

function loadVideoSize(item, index) {
  return new Promise((resolve) => {
    const probe = document.createElement("video");

    probe.preload = "metadata";
    probe.muted = true;
    probe.src = item.file;
    probe.addEventListener("loadedmetadata", () => {
      if (probe.videoWidth && probe.videoHeight) {
        measuredSizes[index] = fitVideoSizeToScreen(probe.videoWidth, probe.videoHeight);
      }
      resolve(measuredSizes[index]);
    }, { once: true });
    probe.addEventListener("error", () => {
      measuredSizes[index] = { ...fallbackSize };
      resolve(measuredSizes[index]);
    }, { once: true });
  });
}

function preloadVideoSizes() {
  if (!document.body.classList.contains("launcher-page")) {
    return Promise.resolve(measuredSizes);
  }

  metadataReady = Promise.all(videos.map(loadVideoSize));
  return metadataReady;
}

function openPopup(item, index, run) {
  const { width, height } = measuredSizes[index] || fallbackSize;
  const { left, top } = getPlacementFromRatio(index, width, height, run);
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "popup=yes",
    "resizable=yes",
    "scrollbars=no",
  ].join(",");

  return window.open(
    `popup.html?video=${index}&run=${encodeURIComponent(run)}`,
    `popup-video-${run}-${index}`,
    features
  );
}

function closeLauncherPopups() {
  if (launcherPopupClosing) return;

  launcherPopupClosing = true;
  window.clearInterval(launcherPopupMonitor);
  launcherPopupMonitor = 0;

  launcherPopupWindows.forEach((popupWindow) => {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
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

    if (launcherPopupWindows.some((popupWindow) => !popupWindow || popupWindow.closed)) {
      closeLauncherPopups();
      onClosed?.();
    }
  }, 300);
}

function setupLauncherPage() {
  const button = document.querySelector("#launchButton");
  const status = document.querySelector("#launchStatus");

  button.disabled = true;
  status.textContent = "Measuring video sizes...";
  metadataReady.then(() => {
    button.disabled = false;
    status.textContent = "Ready.";
  });

  button.addEventListener("click", async () => {
    let popupIndex = 0;
    const run = String(Date.now());

    button.disabled = true;
    status.textContent = "Measuring video sizes...";
    await metadataReady;

    closeLauncherPopups();
    launcherPopupClosing = false;
    launcherPopupWindows = [];

    const positions = makeRandomPositionSet(measuredSizes);

    status.textContent = "Opening popup windows...";
    localStorage.removeItem(unlockKey);
    savePopupPositions(run, positions);

    const timer = window.setInterval(() => {
      const popup = openPopup(videos[popupIndex], popupIndex, run);

      if (!popup) {
        status.textContent = "Your browser blocked the popups. Please allow popups for this page, then click again.";
        button.disabled = false;
        window.clearInterval(timer);
        closeLauncherPopups();
        return;
      }

      launcherPopupWindows.push(popup);
      popupIndex += 1;

      if (popupIndex >= videos.length) {
        status.textContent = "All popup windows are open.";
        window.clearInterval(timer);
        monitorLauncherPopups(() => {
          status.textContent = "One popup was closed, so all popup windows were closed.";
          button.disabled = false;
        });
      }
    }, 420);
  });

  window.addEventListener("beforeunload", closeLauncherPopups);
}

if (document.body.classList.contains("popup-page")) {
  setupPopupPage();
} else {
  preloadVideoSizes();
  setupLauncherPage();
}
