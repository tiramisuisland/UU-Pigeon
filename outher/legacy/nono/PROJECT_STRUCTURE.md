# 專案結構

- `nono.html`：頁面骨架，只保留 DOM 與模組入口。
- `styles/base.css`：全域背景與基礎樣式。
- `styles/hud.css`：提示面板與啟動按鈕。
- `styles/counters.css`：同意／不同意數字顯示。
- `js/app.js`：啟動及協調所有功能。
- `js/config.js`：資源路徑、API、位置與數值設定。
- `js/core/scene.js`：Three.js 場景、相機、渲染器、燈光。
- `js/features/environment.js`：HDR、地面水波、雲朵。
- `js/features/read-man.js`：右下讀報人模型、淡出材質及動畫。
- `js/features/counters.js`：數字圖、API 輪詢及畫面定位。
- `js/features/video-popup.js`：影片播放清單與彈出視窗。
- `js/features/birds.js`：鴿子載入、飛行、互動、動畫、音效、掉落文字、墜落與復活。

通常只需修改 `js/config.js` 就能調整素材、API 與主要參數；要修改特定功能時，再進入對應的 `features` 檔案。
