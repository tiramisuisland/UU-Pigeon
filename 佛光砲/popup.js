(function () {
  const imageWidth = 1444;
  const imageHeight = 450;
  const duration = 9600;
  const chargeDuration = 1800;
  const worldPushDelay = 2000;
  const beamSpeedMultiplier = 2.73;
  const accelerationPerSecond = 0.12;
  const maxAccelerationBonus = 1.2;
  const assetVersion = "20260624-1506";
  const screenLeft = window.screen.availLeft || 0;
  const screenTop = window.screen.availTop || 0;
  const availableWidth = window.screen.availWidth || imageWidth;
  const availableHeight = window.screen.availHeight || imageHeight;
  const targetWidth = availableWidth;
  const targetHeight = Math.max(260, Math.round(targetWidth * imageHeight / imageWidth));
  const stageWidth = targetWidth;
  const stageHeight = targetHeight;
  const codeWidth = Math.max(36000, Math.round(targetWidth * 25));
  const startWidth = Math.round(targetWidth / 7);
  const rightEdge = screenLeft + availableWidth;
  const top = screenTop + Math.max(24, Math.round((availableHeight - targetHeight) / 2));
  const destructionLayer = document.querySelector(".destruction-layer");
  const buildingAssets = [
    { name: "memorial-hall", src: `./1.png?v=${assetVersion}`, audioSrc: `./1.mp3?v=${assetVersion}`, ratio: 960 / 725 },
    { name: "triumphal-arch", src: `./2.png?v=${assetVersion}`, audioSrc: `./2.mp3?v=${assetVersion}`, ratio: 1596 / 1056 },
    { name: "gate-column", src: `./3.png?v=${assetVersion}`, audioSrc: `./3.mp3?v=${assetVersion}`, ratio: 1378 / 1024, closesAfterHit: true }
  ];
  const activeBuildings = [];
  const rootStyle = document.documentElement.style;
  let nextSpawnAt = null;
  let spawnedCount = 0;
  let lastWindowResizeAt = -Infinity;
  let currentWorldOffset = 0;
  let imageFullyRevealed = false;
  let currentPopupWidth = startWidth;
  let virtualPopupWidth = startWidth;

  rootStyle.setProperty("--stage-width", `${stageWidth}px`);
  rootStyle.setProperty("--stage-height", `${stageHeight}px`);
  rootStyle.setProperty("--code-width", `${codeWidth}px`);
  rootStyle.setProperty("--duration", `${duration}ms`);
  rootStyle.setProperty("--charge-duration", `${chargeDuration}ms`);

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function resizeFrame(startTime) {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(progress);
    const width = Math.round(startWidth + (targetWidth - startWidth) * eased);
    const left = Math.round(rightEdge - width);
    currentPopupWidth = width;

    if (elapsed - lastWindowResizeAt > 66 || progress === 1) {
      try {
        window.resizeTo(width, targetHeight);
        window.moveTo(left, top);
      } catch (error) {
        document.body.dataset.resizeBlocked = "true";
      }
      lastWindowResizeAt = elapsed;
    }

    if (progress < 1) {
      requestAnimationFrame(() => resizeFrame(startTime));
    } else {
      imageFullyRevealed = true;
      window.setTimeout(syncLayoutMetrics, 80);
    }
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function acceleratedTravel(elapsed, baseSpeed) {
    const seconds = elapsed / 1000;
    const capSeconds = maxAccelerationBonus / accelerationPerSecond;

    if (seconds >= capSeconds) {
      const cappedTravel = baseSpeed * 1000 * (capSeconds + accelerationPerSecond * Math.pow(capSeconds, 2) / 2);
      return cappedTravel + baseSpeed * (elapsed - capSeconds * 1000) * (1 + maxAccelerationBonus);
    }

    return baseSpeed * 1000 * (seconds + accelerationPerSecond * Math.pow(seconds, 2) / 2);
  }

  function syncLayoutMetrics() {
    rootStyle.setProperty("--stage-width", `${stageWidth}px`);
    rootStyle.setProperty("--stage-height", `${stageHeight}px`);
    rootStyle.setProperty("--code-width", `${codeWidth}px`);
  }

  function notifyOpenerClose() {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: "close-buddha-light-popup" },
        window.location.origin
      );
    }
  }

  function closePopupSoon(delay = 3000) {
    window.setTimeout(() => {
      notifyOpenerClose();
      window.setTimeout(() => window.close(), 170);
    }, delay);
  }

  function playAssetSound(asset) {
    if (!asset.audioSrc) {
      return null;
    }

    const audio = new Audio(asset.audioSrc);
    audio.volume = 0.9;
    audio.play().catch(() => {});
    return audio;
  }

  function createGlitchCanvas(building) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const glitchScale = 0.56;
    const canvasWidth = Math.max(1, Math.round(building.width * glitchScale));
    const canvasHeight = Math.max(1, Math.round(building.height * glitchScale));
    const blockSize = 8;
    const image = building.element.querySelector("img");
    const startedAt = performance.now();
    const fragments = [];

    canvas.className = "glitch-canvas";
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    building.element.appendChild(canvas);

    for (let y = 0; y < canvasHeight; y += blockSize) {
      for (let x = 0; x < canvasWidth; x += blockSize) {
        fragments.push({
          x,
          y,
          size: blockSize,
          dx: randomBetween(-34, 34),
          dy: randomBetween(-28, 28),
          delay: randomBetween(0, 260)
        });
      }
    }

    function draw(now) {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / 980);
      context.clearRect(0, 0, canvas.width, canvas.height);

      fragments.forEach((fragment) => {
        const localProgress = clamp((elapsed - fragment.delay) / 720, 0, 1);
        if (localProgress <= 0 || localProgress >= 1) {
          return;
        }

        const flicker = localProgress < 0.35 ? 1 : 1 - localProgress;
        const drawX = fragment.x + fragment.dx * localProgress;
        const drawY = fragment.y + fragment.dy * localProgress;
        context.globalAlpha = flicker;
        context.drawImage(
          image,
          fragment.x / canvasWidth * image.naturalWidth,
          fragment.y / canvasHeight * image.naturalHeight,
          fragment.size / canvasWidth * image.naturalWidth,
          fragment.size / canvasHeight * image.naturalHeight,
          drawX,
          drawY,
          fragment.size,
          fragment.size
        );
      });

      context.globalAlpha = 1;

      if (progress < 1) {
        requestAnimationFrame(draw);
      }
    }

    requestAnimationFrame(draw);
  }

  function spawnBuilding(elapsed, beamTravel) {
    if (spawnedCount >= buildingAssets.length) {
      return;
    }

    const asset = buildingAssets[spawnedCount % buildingAssets.length];
    const building = document.createElement("div");
    const image = document.createElement("img");
    const height = stageHeight;
    const width = Math.round(height * asset.ratio);
    const handX = codeWidth + stageWidth * 0.865;
    const beamFrontX = handX - beamTravel;
    const spawnAheadMin = stageWidth * 1.05;
    const spawnAheadMax = stageWidth * 1.65;
    const spawnX = Math.round(clamp(beamFrontX - randomBetween(spawnAheadMin, spawnAheadMax), 180, codeWidth - 360));

    image.src = asset.src;
    image.alt = "";
    building.className = "target-building";
    building.style.setProperty("--spawn-x", `${spawnX}px`);
    building.style.setProperty("--building-width", `${width}px`);
    building.style.setProperty("--building-height", `${height}px`);
    building.appendChild(image);
    destructionLayer.appendChild(building);

    activeBuildings.push({
      element: building,
      asset,
      hit: false,
      x: spawnX,
      width,
      height,
      createdAt: elapsed
    });

    spawnedCount += 1;
    nextSpawnAt = elapsed + randomBetween(3800, 6500);
  }

  function hitBuildings(beamTravel) {
    let destroyedCount = 0;
    const handX = codeWidth + stageWidth * 0.865;
    const beamFrontX = handX - beamTravel;

    activeBuildings.forEach((building) => {
      if (building.hit) {
        destroyedCount += 1;
        return;
      }

      const imageCenterLine = building.x;
      const beamTouchesImage = beamFrontX <= imageCenterLine;

      if (beamTouchesImage) {
        building.hit = true;
        destroyedCount += 1;
        building.element.classList.add("hit");
        const audio = playAssetSound(building.asset);
        if (building.asset.closesAfterHit) {
          if (audio) {
            let closeScheduled = false;
            const scheduleClose = () => {
              if (closeScheduled) {
                return;
              }
              closeScheduled = true;
              closePopupSoon(3000);
            };
            audio.addEventListener("ended", scheduleClose, { once: true });
            audio.addEventListener("error", () => closePopupSoon(3000), { once: true });
            audio.addEventListener("loadedmetadata", () => {
              if (Number.isFinite(audio.duration)) {
                window.setTimeout(scheduleClose, audio.duration * 1000 + 300);
              }
            }, { once: true });
          } else {
            closePopupSoon(3000);
          }
        }
        createGlitchCanvas(building);
        window.setTimeout(() => building.element.remove(), 1800);
      }
    });

    return destroyedCount;
  }

  function advanceFrame(startTime) {
    const elapsed = performance.now() - startTime;
    const firedAt = chargeDuration;
    const revealProgress = Math.min(1, elapsed / duration);
    virtualPopupWidth = startWidth + (targetWidth - startWidth) * easeInOutCubic(revealProgress);
    const fireElapsed = Math.max(0, elapsed - firedAt);
    const beamTravelSpeed = ((stageWidth * 0.95) / (duration - firedAt)) * beamSpeedMultiplier;
    const introTravelSpeed = beamTravelSpeed * 0.22;
    const introTravel = Math.min(fireElapsed, worldPushDelay) * introTravelSpeed;
    const beamTravel = introTravel + acceleratedTravel(Math.max(0, fireElapsed - worldPushDelay), beamTravelSpeed);
    const visibleBeamLength = Math.min(beamTravel + Math.max(42, stageWidth * 0.05), window.innerWidth * 1.45);
    const beamTrailTravel = elapsed >= firedAt ? visibleBeamLength : 0;
    const spawnDistance = stageWidth * 0.72;
    const canSpawnTargets = elapsed >= firedAt && beamTravel >= spawnDistance;
    const handX = codeWidth + stageWidth * 0.865;
    const beamFrontX = handX - beamTravel;
    const worldWidth = codeWidth + stageWidth;
    const followPoint = Math.min(470, Math.max(320, window.innerWidth * 0.23));
    const desiredWorldOffset = elapsed >= firedAt + worldPushDelay
      ? Math.max(0, followPoint - window.innerWidth + worldWidth - beamFrontX)
      : 0;
    currentWorldOffset += (desiredWorldOffset - currentWorldOffset) * 0.09;
    const worldOffset = currentWorldOffset;
    const chargeProgress = clamp(elapsed / firedAt, 0, 1);
    const chargePulse = elapsed < firedAt ? Math.sin(elapsed / 150) * 0.025 : 0;
    const frontScale = elapsed < firedAt
      ? 0.22 + easeInOutCubic(chargeProgress) * 0.78 + chargePulse
      : 1;

    if (canSpawnTargets && nextSpawnAt === null) {
      nextSpawnAt = elapsed + 700 + Math.random() * 700;
    }

    if (canSpawnTargets && spawnedCount < buildingAssets.length && elapsed > nextSpawnAt) {
      spawnBuilding(elapsed, beamTravel);
    }

    hitBuildings(beamTravel);

    rootStyle.setProperty("--beam-travel", `${Math.round(beamTrailTravel)}px`);
    rootStyle.setProperty("--beam-front-travel", `${Math.round(beamTravel)}px`);
    rootStyle.setProperty("--beam-line-opacity", elapsed >= firedAt ? "0.8" : "0");
    rootStyle.setProperty("--world-offset", `${Math.round(worldOffset)}px`);
    rootStyle.setProperty("--beam-front-scale", frontScale.toFixed(3));

    requestAnimationFrame(() => advanceFrame(startTime));
  }

  function start() {
    try {
      window.resizeTo(startWidth, targetHeight);
      window.moveTo(rightEdge - startWidth, top);
    } catch (error) {
      document.body.dataset.resizeBlocked = "true";
    }

    syncLayoutMetrics();

    const startTime = performance.now();
    requestAnimationFrame(() => resizeFrame(startTime));
    requestAnimationFrame(() => advanceFrame(startTime));
  }

  window.addEventListener("resize", syncLayoutMetrics);
  window.addEventListener("load", start, { once: true });
})();
