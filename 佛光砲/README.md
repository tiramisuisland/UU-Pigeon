# 佛光衝擊波 popup 效果整合說明

這個資料夾是一個純前端互動效果。主頁 `index.html` 會開啟一個 popup 視窗，popup 內使用 `佛光衝擊波.png` 作為原始視覺資產，搭配 CSS/JS 產生集氣、光波射出、頁面橫向展開、建築物擊碎、音效播放與結尾自動關閉。

## 檔案用途

- `index.html`：入口頁，只有一個「開啟」按鈕，負責開啟 `popup.html`。
- `styles.css`：入口頁樣式。
- `popup.html`：popup 視窗內容結構。
- `popup.css`：popup 視覺樣式、光波、背景、建築物、glitch 動畫。
- `popup.js`：主要互動邏輯，包含 popup 尺寸、光波移動、世界橫移、建築物生成/擊碎、音效與自動關閉。
- `佛光衝擊波.png`：開場底圖與正式製作素材，不要替換成重繪版本。
- `1.png`, `2.png`, `3.png`：被光波擊碎的三張建築圖。
- `1.mp3`, `2.mp3`, `3.mp3`：三張建築圖被擊中時播放的對應音效。

## 啟動方式

建議用本機伺服器開啟，不要直接雙擊 HTML，避免瀏覽器對音效或路徑有額外限制。

```bash
python3 -m http.server 4174
```

然後打開：

```text
http://127.0.0.1:4174/
```

按下入口頁的「開啟」後，會開啟 `popup.html`。popup 的關閉使用瀏覽器原本的視窗關閉功能；第三張圖被擊中後，也會在音檔播放完再等 3 秒自動關閉。

## 互動流程

1. popup 一開始是窄視窗，只顯示 `佛光衝擊波.png` 右側約 1/7。
2. 光球在佛像手部位置集氣。
3. 集氣完成後光波先發射，但前 2 秒以慢速滑出，底圖暫時不被推走。
4. 2 秒後開始推動整個畫面橫向展開，光波前端維持在畫面左側偏內的位置。
5. 後續背景顯示光波路徑，三張建築圖會依序出現。
6. 光波碰到建築圖垂直中線時，圖片觸發 pixel glitch 破碎，並播放對應音檔。
7. 第三張圖被擊中後，播放 `3.mp3`；音檔結束後 3 秒自動關閉 popup。

## 素材命名規則

目前程式寫死使用下列檔名：

```text
佛光衝擊波.png
1.png
2.png
3.png
1.mp3
2.mp3
3.mp3
```

如果要換素材，最簡單做法是保持同樣檔名直接覆蓋。若要改檔名，請修改 `popup.js` 裡的 `buildingAssets`：

```js
const assetVersion = "20260624-1506";

const buildingAssets = [
  { name: "memorial-hall", src: `./1.png?v=${assetVersion}`, audioSrc: `./1.mp3?v=${assetVersion}`, ratio: 960 / 725 },
  { name: "triumphal-arch", src: `./2.png?v=${assetVersion}`, audioSrc: `./2.mp3?v=${assetVersion}`, ratio: 1596 / 1056 },
  { name: "gate-column", src: `./3.png?v=${assetVersion}`, audioSrc: `./3.mp3?v=${assetVersion}`, ratio: 1378 / 1024, closesAfterHit: true }
];
```

`ratio` 是圖片寬高比，格式為 `圖片寬 / 圖片高`。換圖時建議同步改成新圖片比例，避免顯示變形。
如果覆蓋同名素材後瀏覽器仍顯示舊圖，請改 `assetVersion` 的字串，強制瀏覽器重新載入素材。

## 常用調整參數

主要參數都在 `popup.js` 開頭：

```js
const duration = 9600;
const chargeDuration = 1800;
const worldPushDelay = 2000;
const beamSpeedMultiplier = 2.73;
const accelerationPerSecond = 0.12;
const maxAccelerationBonus = 1.2;
```

- `duration`：popup 從窄視窗展開到桌面寬度的時間，單位毫秒。
- `chargeDuration`：光球集氣時間，單位毫秒。
- `worldPushDelay`：光波發射後，延遲多久才開始把底圖往右推，單位毫秒。
- `beamSpeedMultiplier`：光波基礎速度倍率。
- `accelerationPerSecond`：發射後每秒增加多少速度。例如 `0.12` 是每秒 +12%。
- `maxAccelerationBonus`：最高加速上限。例如 `1.2` 是最高 +120%。

光波位置追蹤在 `advanceFrame()` 裡：

```js
const followPoint = Math.min(470, Math.max(320, window.innerWidth * 0.23));
```

這代表光波前端會維持在視窗左側偏內的位置。數字越小，光波越靠近左邊界；數字越大，光波越往畫面中央。

## 建築物出現與擊碎

建築物生成在 `spawnBuilding()`：

```js
const spawnAheadMin = stageWidth * 1.05;
const spawnAheadMax = stageWidth * 1.65;
```

這兩個值控制建築物出現在光波前方多遠。數字越大，建築物越早出現，觀眾越有時間看清楚。

擊中判定在 `hitBuildings()`：

```js
const imageCenterLine = building.x;
const beamTouchesImage = beamFrontX <= imageCenterLine;
```

目前是光波前端碰到建築物垂直中線時觸發破碎。

## 音效與自動關閉

每張建築圖有自己的音效：

- `1.png` 擊中時播放 `1.mp3`
- `2.png` 擊中時播放 `2.mp3`
- `3.png` 擊中時播放 `3.mp3`

第三張圖的設定有 `closesAfterHit: true`，所以音檔播放完後會再等 3 秒自動關閉 popup。

注意：部分瀏覽器會限制自動播放音效。此專案透過使用者點擊入口頁「開啟」來啟動 popup，通常可以播放音效；若整合到其他頁面，也建議保留使用者點擊觸發。

## 整合注意事項

- 必須讓 `index.html`, `popup.html`, `popup.css`, `popup.js` 和素材檔保持相對路徑可讀。
- popup 視窗的 `resizeTo` / `moveTo` 在某些瀏覽器或瀏覽器設定中可能被限制。若被限制，效果仍會在頁面內播放，但視窗尺寸可能不會完全照預期變化。
- 若整合到大型網站，建議仍使用 `window.open("./popup.html", ...)` 開獨立視窗，因為此效果高度依賴 popup 的視窗尺寸變化。
- 若要嵌入 iframe，需要重新調整 `resizeFrame()` 和 `window.close()`，因為 iframe 不能控制外層視窗尺寸。
- 光波和 glitch 效果已做過基本效能優化，但素材解析度越高、視窗越大，效能負擔仍會增加。

## 快速測試清單

整合後請確認：

- 按下「開啟」會打開 popup。
- 開場只看到 `佛光衝擊波.png` 右側窄畫面。
- 佛像手部集氣後，光球和光柱連在一起射出。
- 發射後約 2 秒才開始推動底圖。
- 三張建築圖依序出現，擊中時有 pixel glitch。
- 擊中時播放對應 mp3。
- 第三張圖音檔播放完後 3 秒自動關閉 popup。
