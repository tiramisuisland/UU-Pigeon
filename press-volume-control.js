class PressVolumeControl extends HTMLElement {
  static get observedAttributes() {
    return ["for", "value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.charge = 0;
    this.rawCharge = 0;
    this.volume = 0;
    this.isPressing = false;
    this.pressStart = 0;
    this.animationFrame = null;
    this.media = null;
  }

  connectedCallback() {
    this.render();
    this.cacheElements();
    this.bindEvents();
    this.connectMedia();
    this.setVolume(this.readInitialValue());
    this.setCharge(0);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.animationFrame);
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;

    if (name === "for") {
      this.connectMedia();
    }

    if (name === "value") {
      this.setVolume(this.readInitialValue());
    }
  }

  readInitialValue() {
    const attrValue = Number(this.getAttribute("value"));
    if (Number.isFinite(attrValue)) return attrValue;
    if (this.media) return this.media.volume * 100;
    return 0;
  }

  connectMedia() {
    const targetId = this.getAttribute("for");
    this.media = targetId ? document.getElementById(targetId) : null;
  }

  cacheElements() {
    this.stage = this.shadowRoot.querySelector(".stage");
    this.control = this.shadowRoot.querySelector(".control");
    this.speaker = this.shadowRoot.querySelector(".speaker-button");
    this.slider = this.shadowRoot.querySelector(".slider");
  }

  bindEvents() {
    this.speaker.addEventListener("pointerdown", this.startPress);
    this.speaker.addEventListener("pointerup", this.endPress);
    this.speaker.addEventListener("pointercancel", this.endPress);
    this.speaker.addEventListener("pointerleave", this.endPress);
    this.speaker.addEventListener("keydown", this.handleKeydown);
    this.speaker.addEventListener("keyup", this.handleKeyup);
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  getUiScale() {
    const scale = Number.parseFloat(
      getComputedStyle(this).getPropertyValue("--pvc-ui-scale")
    );
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  setCharge(value) {
    this.rawCharge = Math.max(0, value);
    this.charge = this.clamp(value, 0, 100);
    let waveLevel = 0;
    if (this.charge >= 8) waveLevel = 1;
    if (this.charge >= 42) waveLevel = 2;
    if (this.charge >= 80) waveLevel = 3;
    this.control.style.setProperty("--charge", `${this.charge}%`);
    this.control.dataset.waveLevel = String(waveLevel);
    this.control.dataset.overcharged = String(this.rawCharge > 112);
  }

  setVolume(value) {
    this.volume = this.clamp(value, 0, 100);
    this.control.style.setProperty("--volume", `${this.volume}%`);

    if (this.media) {
      this.media.volume = this.volume / 100;
      this.media.muted = this.volume === 0;
    }

    this.dispatchEvent(new CustomEvent("volumechange", {
      bubbles: true,
      detail: {
        value: this.volume,
        normalizedValue: this.volume / 100,
        media: this.media
      }
    }));
  }

  updateCharge = (now) => {
    if (!this.isPressing) return;
    const elapsed = now - this.pressStart;
    this.setCharge((elapsed / 1800) * 100);
    this.animationFrame = requestAnimationFrame(this.updateCharge);
  };

  startPress = (event) => {
    event.preventDefault();
    if ("pointerId" in event) {
      this.speaker.setPointerCapture?.(event.pointerId);
    }
    this.isPressing = true;
    this.pressStart = performance.now();
    this.speaker.classList.add("is-pressing");
    this.setCharge(0);
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(this.updateCharge);
  };

  endPress = (event) => {
    if (!this.isPressing) return;
    event.preventDefault();
    this.isPressing = false;
    this.speaker.classList.remove("is-pressing");
    this.speaker.classList.add("is-firing");
    window.setTimeout(() => {
      this.speaker.classList.remove("is-firing");
    }, 360);
    if ("pointerId" in event) {
      this.speaker.releasePointerCapture?.(event.pointerId);
    }
    cancelAnimationFrame(this.animationFrame);

    const isOvercharged = this.rawCharge > 112;
    const nextVolume = isOvercharged ? 0 : Math.max(4, Math.round(this.charge));
    this.fireMarker(nextVolume, isOvercharged);
    this.setCharge(0);
  };

  handleKeydown = (event) => {
    if ((event.code === "Space" || event.code === "Enter") && !this.isPressing) {
      this.startPress(event);
    }
  };

  handleKeyup = (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      this.endPress(event);
    }
  };

  fireMarker(targetVolume, isOvercharged = false) {
    const stageRect = this.stage.getBoundingClientRect();
    const speakerRect = this.speaker.getBoundingClientRect();
    const sliderRect = this.slider.getBoundingClientRect();
    const uiScale = this.getUiScale();
    const startX = speakerRect.left + speakerRect.width * 0.72 - stageRect.left;
    const startY = speakerRect.top + speakerRect.height * 0.38 - stageRect.top;
    const endX = isOvercharged
      ? sliderRect.right + 54 * uiScale - stageRect.left
      : sliderRect.left + (sliderRect.width * targetVolume / 100) - stageRect.left;
    const endY = sliderRect.top + sliderRect.height / 2 - stageRect.top;
    const lift = (isOvercharged ? 190 : 82 + targetVolume * 0.9) * uiScale;
    const dot = document.createElement("span");

    dot.className = `projectile${isOvercharged ? " is-overcharged" : ""}`;
    dot.setAttribute("aria-hidden", "true");
    this.stage.append(dot);

    const duration = 520 + targetVolume * 2.2;
    const start = performance.now();

    const animate = (now) => {
      const t = this.clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const x = startX + (endX - startX) * eased;
      const arc = Math.sin(Math.PI * eased) * lift;
      const y = startY + (endY - startY) * eased - arc;

      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;

      if (t < 1) {
        requestAnimationFrame(animate);
        return;
      }

      dot.remove();
      this.setVolume(targetVolume);
    };

    requestAnimationFrame(animate);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: min(880px, 100%);
          --ui-scale: var(--pvc-ui-scale, 1);
          color-scheme: light;
        }

        * {
          box-sizing: border-box;
        }

        .stage {
          width: 100%;
          aspect-ratio: 16 / 3.2;
          position: relative;
          overflow: visible;
          background: var(--pvc-background, #fbf9fb);
          border: 1px solid var(--pvc-border, #efedef);
          user-select: none;
          touch-action: none;
        }

        .control {
          --charge: 0%;
          --volume: 0%;
          position: absolute;
          left: 8%;
          top: 50%;
          width: 84%;
          height: calc(112px * var(--ui-scale));
          transform: translateY(-50%);
        }

        .speaker-button {
          position: absolute;
          left: 0;
          top: 50%;
          width: calc(104px * var(--ui-scale));
          height: calc(104px * var(--ui-scale));
          padding: 0;
          border: 0;
          background: transparent;
          transform: translateY(-50%) scale(1);
          transform-origin: 22% 72%;
          transition: transform 140ms ease;
          cursor: pointer;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .speaker-button::before,
        .speaker-button::after {
          content: "";
          position: absolute;
          left: 76%;
          top: 42%;
          width: calc(14px * var(--ui-scale));
          height: calc(14px * var(--ui-scale));
          border-radius: 50%;
          background: var(--pvc-color, #000);
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0.2);
        }

        .speaker-button:active,
        .speaker-button.is-pressing {
          transform: translateY(-50%) rotate(-14deg) scale(0.98);
        }

        .speaker-button.is-firing {
          animation: cannon-recoil 360ms cubic-bezier(.2, .9, .25, 1);
        }

        .speaker-button.is-firing::before {
          animation: muzzle-pop 260ms ease-out;
        }

        .speaker-button.is-firing::after {
          animation: shock-ring 340ms ease-out;
        }

        @keyframes cannon-recoil {
          0% {
            transform: translateY(-50%) rotate(-14deg) translateX(0) scale(0.98);
          }

          22% {
            transform: translateY(-50%) rotate(-20deg) translateX(-12px) scale(0.94);
          }

          52% {
            transform: translateY(-50%) rotate(-8deg) translateX(5px) scale(1.03);
          }

          100% {
            transform: translateY(-50%) rotate(0) translateX(0) scale(1);
          }
        }

        @keyframes muzzle-pop {
          0% {
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(0.25);
          }

          100% {
            opacity: 0;
            transform: translate(26px, -16px) scale(2.2);
          }
        }

        @keyframes shock-ring {
          0% {
            opacity: 0.55;
            box-shadow: 0 0 0 0 var(--pvc-color, #000);
            transform: translate(-50%, -50%) scale(0.4);
          }

          100% {
            opacity: 0;
            box-shadow: 0 0 0 calc(18px * var(--ui-scale)) rgba(0, 0, 0, 0);
            transform: translate(20px, -12px) scale(1.8);
          }
        }

        .speaker-button:focus-visible {
          outline: calc(3px * var(--ui-scale)) solid #111;
          outline-offset: calc(8px * var(--ui-scale));
          border-radius: 8px;
        }

        .speaker-layer {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .speaker-layer svg {
          width: calc(87px * var(--ui-scale));
          height: calc(87px * var(--ui-scale));
          display: block;
        }

        .speaker-base {
          color: var(--pvc-empty, #cfcbd3);
        }

        .speaker-fill {
          color: var(--pvc-color, #000);
          clip-path: inset(0 calc(100% - var(--charge)) 0 0);
          opacity: 0.98;
          transition: clip-path 70ms linear;
        }

        .speaker-waves {
          color: var(--pvc-color, #000);
        }

        .wave {
          opacity: 0;
          transition: opacity 120ms ease;
        }

        .control[data-wave-level="1"] .wave-1,
        .control[data-wave-level="2"] .wave-1,
        .control[data-wave-level="2"] .wave-2,
        .control[data-wave-level="3"] .wave-1,
        .control[data-wave-level="3"] .wave-2,
        .control[data-wave-level="3"] .wave-3 {
          opacity: 1;
        }

        .slider {
          position: absolute;
          left: calc(132px * var(--ui-scale));
          right: 0;
          top: 50%;
          height: calc(22px * var(--ui-scale) * 1.4);
          transform: translateY(-50%);
        }

        .track {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: calc(5px * var(--ui-scale) * 1.4);
          border-radius: 999px;
          background: var(--pvc-track, #e8e6e8);
          transform: translateY(-50%);
          box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.06);
        }

        .track-fill {
          position: absolute;
          left: 0;
          top: 50%;
          width: var(--volume);
          height: calc(5px * var(--ui-scale) * 1.4);
          border-radius: 999px;
          background: var(--pvc-color, #000);
          transform: translateY(-50%);
          transition: width 260ms ease;
        }

        .marker {
          position: absolute;
          left: var(--volume);
          top: 50%;
          width: calc(24px * var(--ui-scale) * 1.4);
          height: calc(24px * var(--ui-scale) * 1.4);
          border-radius: 50%;
          background: var(--pvc-color, #000);
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          transition: left 260ms ease;
        }

        .projectile {
          position: absolute;
          width: calc(24px * var(--ui-scale) * 1.4);
          height: calc(24px * var(--ui-scale) * 1.4);
          left: 0;
          top: 0;
          border-radius: 50%;
          background: var(--pvc-color, #000);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
          pointer-events: none;
          transform: translate(-50%, -50%);
          will-change: left, top;
        }

        .marker::before,
        .projectile::before {
          content: "X X";
          position: absolute;
          left: 50%;
          top: 28%;
          color: #fff;
          font-family: Arial, sans-serif;
          font-size: calc(7px * var(--ui-scale));
          font-weight: 800;
          line-height: 1;
          letter-spacing: 1px;
          transform: translateX(-50%);
          white-space: nowrap;
        }

        .marker::before {
          font-size: calc(7px * var(--ui-scale) * 1.4);
        }

        .projectile::before {
          font-size: calc(7px * var(--ui-scale) * 1.4);
        }

        .marker::after,
        .projectile::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 47%;
          width: calc(13px * var(--ui-scale));
          height: calc(8px * var(--ui-scale));
          border-bottom: calc(3px * var(--ui-scale)) solid #fff;
          border-radius: 0 0 14px 14px;
          transform: translateX(-50%) rotate(-4deg);
        }

        .marker::after {
          width: calc(13px * var(--ui-scale) * 1.4);
          height: calc(8px * var(--ui-scale) * 1.4);
          border-bottom-width: calc(3px * var(--ui-scale) * 1.4);
        }

        .projectile::after {
          width: calc(13px * var(--ui-scale) * 1.4);
          height: calc(8px * var(--ui-scale) * 1.4);
          border-bottom-width: calc(3px * var(--ui-scale) * 1.4);
        }

        @media (max-width: 640px) {
          .stage {
            aspect-ratio: 16 / 4.2;
          }

          .control {
            left: 5%;
            width: 90%;
          }

          .speaker-button {
            width: calc(82px * var(--ui-scale));
            height: calc(82px * var(--ui-scale));
          }

          .speaker-layer svg {
            width: calc(70px * var(--ui-scale));
            height: calc(70px * var(--ui-scale));
          }

          .slider {
            left: calc(102px * var(--ui-scale));
          }
        }
      </style>

      <main class="stage">
        <section class="control" aria-label="按壓式音量控制">
          <button class="speaker-button" type="button" aria-label="長按累積音量，放開送出">
            <span class="speaker-layer speaker-base" aria-hidden="true">
              <svg viewBox="0 0 120 96">
                <path fill="currentColor" d="M12 38a8 8 0 0 1 8-8h13l25-21a7 7 0 0 1 11.5 5.4v67.2A7 7 0 0 1 58 87L33 66H20a8 8 0 0 1-8-8V38Z"/>
              </svg>
            </span>
            <span class="speaker-layer speaker-fill" aria-hidden="true">
              <svg viewBox="0 0 120 96">
                <path fill="currentColor" d="M12 38a8 8 0 0 1 8-8h13l25-21a7 7 0 0 1 11.5 5.4v67.2A7 7 0 0 1 58 87L33 66H20a8 8 0 0 1-8-8V38Z"/>
              </svg>
            </span>
            <span class="speaker-layer speaker-waves" aria-hidden="true">
              <svg viewBox="0 0 120 96">
                <path class="wave wave-1" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" d="M78 42c2.6 3.4 2.6 7.2 0 10.6"/>
                <path class="wave wave-2" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" d="M90 33c5.7 8 5.7 22 0 30"/>
                <path class="wave wave-3" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" d="M104 24c9.2 13.2 9.2 34.8 0 48"/>
              </svg>
            </span>
          </button>

          <div class="slider" aria-hidden="true">
            <div class="track"></div>
            <div class="track-fill"></div>
            <div class="marker"></div>
          </div>
        </section>
      </main>
    `;
  }
}

customElements.define("press-volume-control", PressVolumeControl);
