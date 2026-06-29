(function () {
  const AUTO_START = 15;
  const AUTO_END = 75;
  const AUTO_DURATION = 30000;
  const COMPLETE = 100;
  const PRELOAD_TIMEOUT = 14000;
  const EMPTY_HOLD = 700;

  const mediaToPreload = [
    "/videos/video1.mp4",
    "/videos/video2.mp4",
    "/videos/video3.mp4"
  ];

  const overlay = document.getElementById("entrance-overlay");
  const mainPage = document.getElementById("main-page");
  const loadingValue = document.getElementById("loading-value");
  const pullCue = document.getElementById("pull-cue");
  const track = document.getElementById("loading-track");
  const handle = document.getElementById("loading-handle");

  let progress = 0;
  let canDrag = false;
  let isDragging = false;
  let entered = false;
  let autoFrame = 0;

  function setProgress(value, min = AUTO_START, max = COMPLETE) {
    progress = clamp(value, min, max);
    const displayedProgress = Math.round(progress);
    track.style.setProperty("--progress", `${progress}%`);
    track.setAttribute("aria-valuenow", displayedProgress.toString());
    loadingValue.textContent = `${displayedProgress}%`;

    if (progress >= COMPLETE) {
      enterMainPage();
    }
  }

  function startFakeAutoLoad() {
    const startedAt = performance.now();
    let lastTime = startedAt;
    let lastProgress = AUTO_START;
    let speed = 1;
    let nextSpeedChange = startedAt;
    track.classList.add("is-auto-loading");
    setProgress(AUTO_START, 0, AUTO_END);

    function tick(now) {
      if (entered || canDrag) return;

      const delta = now - lastTime;
      lastTime = now;
      const elapsedRatio = clamp((now - startedAt) / AUTO_DURATION, 0, 1);

      if (now >= nextSpeedChange) {
        const roll = Math.random();
        if (roll > 0.84) {
          speed = 2.1 + Math.random() * 1.6;
        } else if (roll < 0.22) {
          speed = 0.04 + Math.random() * 0.22;
        } else {
          speed = 0.45 + Math.random() * 0.95;
        }
        nextSpeedChange = now + 360 + Math.random() * 1240;
      }

      const baseRate = (AUTO_END - AUTO_START) / AUTO_DURATION;
      const latePressure = elapsedRatio > 0.9 ? 1.45 : 1;
      const twitch = Math.sin(now / 480) * 0.006 + Math.sin(now / 1200) * 0.004;
      const next = lastProgress + (baseRate * speed * latePressure + twitch) * delta;

      lastProgress = Math.max(lastProgress, Math.min(AUTO_END, next));
      setProgress(lastProgress, AUTO_START, AUTO_END);

      if (elapsedRatio >= 1 || lastProgress >= AUTO_END) {
        setProgress(AUTO_END, AUTO_START, AUTO_END);
        revealHandle();
        return;
      }

      autoFrame = window.requestAnimationFrame(tick);
    }

    autoFrame = window.requestAnimationFrame(tick);
  }

  function revealHandle() {
    canDrag = true;
    track.classList.remove("is-auto-loading");
    track.classList.add("can-drag");
    track.setAttribute("aria-valuemin", AUTO_END.toString());
  }

  function preloadMedia(paths) {
    if (!paths.length) {
      return Promise.resolve();
    }

    const loads = paths.map((path) => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        let settled = false;

        function done() {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        }

        function cleanup() {
          video.removeEventListener("loadeddata", done);
          video.removeEventListener("canplay", done);
          video.removeEventListener("canplaythrough", done);
          video.removeEventListener("error", done);
        }

        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        video.style.display = "none";
        video.addEventListener("loadeddata", done, { once: true });
        video.addEventListener("canplay", done, { once: true });
        video.addEventListener("canplaythrough", done, { once: true });
        video.addEventListener("error", done, { once: true });
        video.src = path;
        document.body.appendChild(video);
        video.load();
      });
    });

    const timeout = new Promise((resolve) => {
      window.setTimeout(resolve, PRELOAD_TIMEOUT);
    });

    return Promise.race([Promise.allSettled(loads), timeout]);
  }

  function pointerToProgress(event) {
    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left;
    return (x / rect.width) * COMPLETE;
  }

  function isNearPullEdge(event) {
    if (!canDrag) return false;
    const pointerProgress = pointerToProgress(event);
    return pointerProgress >= progress - 6 && pointerProgress <= progress + 12;
  }

  function movePullCue(event) {
    if (!pullCue) return;
    pullCue.style.transform = `translate(${event.clientX + 18}px, ${event.clientY - 9}px)`;
  }

  function showPullCue(event) {
    if (!pullCue) return;
    movePullCue(event);
    pullCue.classList.add("is-visible");
  }

  function hidePullCue() {
    if (!pullCue) return;
    pullCue.classList.remove("is-visible");
  }

  function createFxSlices() {
    document.querySelectorAll(".svg-fx[data-slices]").forEach((container) => {
      const count = Number(container.dataset.slices) || 10;
      const slices = document.createElement("div");
      slices.className = "fx-slices";

      for (let index = 0; index < count; index += 1) {
        const slice = document.createElement("span");
        const start = (index / count) * 100;
        const end = ((index + 1) / count) * 100;
        slice.className = "fx-slice";
        slice.style.setProperty("--i", index.toString());
        slice.style.clipPath = `inset(0 ${100 - end}% 0 ${start}%)`;
        slices.appendChild(slice);
      }

      container.appendChild(slices);
    });
  }

  function createJitterLetters() {
    document.querySelectorAll(".jitter-text").forEach((root) => {
      if (root.dataset.jitterReady === "true") return;
      root.dataset.jitterReady = "true";

      const mode = root.dataset.jitter || "copy";
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const textNodes = [];

      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      textNodes.forEach((node) => {
        const fragment = document.createDocumentFragment();

        Array.from(node.nodeValue).forEach((character) => {
          if (character === " ") {
            const space = document.createElement("span");
            space.className = "jitter-word-space";
            space.setAttribute("aria-hidden", "true");
            fragment.appendChild(space);
            return;
          }

          if (!/[A-Za-z]/.test(character)) {
            fragment.appendChild(document.createTextNode(character));
            return;
          }

          const letter = document.createElement("span");
          letter.className = "jitter-letter";
          letter.textContent = character;
          applyLetterMotion(letter, mode);
          fragment.appendChild(letter);
        });

        node.replaceWith(fragment);
      });
    });
  }

  function applyLetterMotion(letter, mode) {
    const isTitle = mode === "title";
    const isScribble = mode === "scribble";
    const distanceX = isTitle ? 5.5 : isScribble ? 3.4 : 1.8;
    const distanceUp = isTitle ? -12 : isScribble ? -6 : -3.8;
    const distanceDown = isTitle ? 4.5 : isScribble ? 3 : 2.2;
    const rotate = isTitle ? 13 : isScribble ? 8 : 5.5;
    const speedMin = isTitle ? 880 : 1040;
    const speedRange = isTitle ? 620 : 760;

    const scaleXMin = isTitle ? 1.05 : isScribble ? 1.04 : 1.01;
    const scaleXMax = isTitle ? 1.12 : isScribble ? 1.12 : 1.045;
    const scaleYMin = isTitle ? 1.12 : isScribble ? 1.1 : 1.025;
    const scaleYMax = isTitle ? 1.24 : isScribble ? 1.22 : 1.08;

    letter.style.setProperty("--sx", randomBetween(scaleXMin, scaleXMax).toString());
    letter.style.setProperty("--sy", randomBetween(scaleYMin, scaleYMax).toString());
    letter.style.setProperty("--sx1", randomBetween(scaleXMin, scaleXMax).toString());
    letter.style.setProperty("--sy1", randomBetween(scaleYMin, scaleYMax).toString());
    letter.style.setProperty("--sx2", randomBetween(scaleXMin, scaleXMax).toString());
    letter.style.setProperty("--sy2", randomBetween(scaleYMin, scaleYMax).toString());
    letter.style.setProperty("--sx3", randomBetween(scaleXMin, scaleXMax).toString());
    letter.style.setProperty("--sy3", randomBetween(scaleYMin, scaleYMax).toString());
    letter.style.setProperty("--sx4", randomBetween(scaleXMin, scaleXMax).toString());
    letter.style.setProperty("--sy4", randomBetween(scaleYMin, scaleYMax).toString());
    letter.style.setProperty("--x1", `${randomBetween(-distanceX, distanceX)}px`);
    letter.style.setProperty("--y1", `${randomBetween(distanceUp, distanceDown)}px`);
    letter.style.setProperty("--r1", `${randomBetween(-rotate, rotate)}deg`);
    letter.style.setProperty("--x2", `${randomBetween(-distanceX, distanceX)}px`);
    letter.style.setProperty("--y2", `${randomBetween(distanceUp, distanceDown)}px`);
    letter.style.setProperty("--r2", `${randomBetween(-rotate, rotate)}deg`);
    letter.style.setProperty("--x3", `${randomBetween(-distanceX, distanceX)}px`);
    letter.style.setProperty("--y3", `${randomBetween(distanceUp, distanceDown)}px`);
    letter.style.setProperty("--r3", `${randomBetween(-rotate, rotate)}deg`);
    letter.style.setProperty("--x4", `${randomBetween(-distanceX, distanceX)}px`);
    letter.style.setProperty("--y4", `${randomBetween(distanceUp, distanceDown)}px`);
    letter.style.setProperty("--r4", `${randomBetween(-rotate, rotate)}deg`);
    letter.style.setProperty("--hop-speed", `${Math.round(speedMin + Math.random() * speedRange)}ms`);
    letter.style.setProperty("--ink-speed", `${Math.round(1280 + Math.random() * 980)}ms`);
    letter.style.setProperty("--hop-delay", `${Math.round(Math.random() * -1500)}ms`);
    letter.style.setProperty("--ink-delay", `${Math.round(Math.random() * -1800)}ms`);
  }

  function beginDrag(event) {
    if (entered || !isNearPullEdge(event)) return;
    isDragging = true;
    track.classList.add("is-dragging");
    track.classList.add("is-hovering-pull");
    track.classList.add("has-dragged");
    document.body.classList.add("is-loading-dragging");
    track.setPointerCapture?.(event.pointerId);
    showPullCue(event);
    setProgress(pointerToProgress(event), AUTO_END, COMPLETE);
    event.preventDefault();
  }

  function drag(event) {
    if (!isDragging || entered) return;
    movePullCue(event);
    setProgress(pointerToProgress(event), AUTO_END, COMPLETE);
    event.preventDefault();
  }

  function endDrag(event) {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove("is-dragging");
    track.classList.remove("is-hovering-pull");
    document.body.classList.remove("is-loading-dragging");
    hidePullCue();
    track.releasePointerCapture?.(event.pointerId);
  }

  function enterMainPage() {
    if (entered) return;
    entered = true;
    window.cancelAnimationFrame(autoFrame);
    setProgress(COMPLETE, AUTO_END, COMPLETE);
    document.body.classList.remove("is-loading-dragging");
    hidePullCue();
    document.body.classList.add("entered");
    mainPage.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-leaving");

    window.setTimeout(() => {
      overlay.hidden = true;
      overlay.remove();
    }, 320);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomBetween(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10;
  }

  track.addEventListener("pointerdown", beginDrag);
  track.addEventListener("pointermove", (event) => {
    movePullCue(event);
    showPullCue(event);
    if (isDragging) return;
    track.classList.toggle("is-hovering-pull", isNearPullEdge(event));
  });
  track.addEventListener("pointerleave", () => {
    if (!isDragging) hidePullCue();
    if (!isDragging) track.classList.remove("is-hovering-pull");
  });
  window.addEventListener("pointermove", drag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  track.addEventListener("keydown", (event) => {
    if (!canDrag) return;
    if (event.key !== "ArrowRight" && event.key !== "End") return;
    event.preventDefault();
    setProgress(event.key === "End" ? COMPLETE : progress + 3, AUTO_END, COMPLETE);
  });

  createJitterLetters();
  createFxSlices();
  setProgress(0, 0, AUTO_END);
  window.setTimeout(startFakeAutoLoad, EMPTY_HOLD);
  preloadMedia(mediaToPreload);
})();
