# Popup CCTV Sequence

這個資料夾是一個以真實瀏覽器 popup 視窗為核心的影片分頁實驗。

## 使用方式

1. 啟動本機伺服器：

   ```bash
   python3 -m http.server 8765
   ```

2. 開啟：

   ```text
   http://localhost:8765/index.html
   ```

3. 按下 `LAUNCH POPUPS`。

## 互動流程

- 按下按鈕後，其他影片的待命 popup 會先開在畫面右上角。
- `C1.mp4` 會接著以右上角 popup 視窗彈出並播放。
- 5 秒後，其他影片 popup 會從右上角往左下方展開排列。
- 展開後的 popup 會避免互相重疊。
- 除了 `C1.mp4`，其他影片都會循環播放。
- 任一個 popup 被關閉時，同一批 popup 會全部一起關閉。

## 影片播放設定

- popup 內影片使用 `object-fit: cover`，避免左右黑框。
- 影片預設靜音自動播放，避免瀏覽器阻擋 autoplay。
- `C1.mp4` 不 loop。
- `1.mp4`, `3.mp4` 到 `13.mp4` 會 loop。

## 瀏覽器限制

這個作品使用真實 `window.open()` popup 視窗，不是在同一個頁面內模擬視窗。

因此瀏覽器可能會阻擋 popup。若只出現少數視窗，請允許 `localhost:8765` 彈出視窗後重新按一次 `LAUNCH POPUPS`。

## 檔案

- `index.html`：主要互動頁面與 popup 控制邏輯。
- `C1.mp4`：第一個彈出的開場影片。
- `1.mp4`, `3.mp4` 到 `13.mp4`：5 秒後一起展開的 popup 影片。
