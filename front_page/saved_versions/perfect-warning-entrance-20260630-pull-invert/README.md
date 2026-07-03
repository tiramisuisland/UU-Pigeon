# Warning Entrance

這是一個靜態的互動式警告入口頁面。畫面以黑白警告視覺、SVG 色差疊層、雜訊濾鏡與拖曳式 loading bar 組成；使用者需要等進度自動載入到 75% 後，拖曳進度條到 100% 才會進入主頁內容區。

## 專案內容

```
front p copy/
├── index.html          # 頁面結構與 SVG filter 定義
├── style.css           # 版面、動畫、loading bar 與響應式樣式
├── script.js           # 自動載入、拖曳互動、預載媒體與進入頁面邏輯
├── assest/             # SVG 圖像與游標資源
│   ├── title.svg
│   ├── title2.svg
│   ├── content.svg
│   ├── content2.svg
│   ├── smile.svg
│   ├── cursor.svg
│   └── loading.svg
└── README.md
```

> 注意：資料夾名稱目前是 `assest`，程式碼也使用這個路徑。若要更名為 `assets`，需要同步修改 `index.html`、`style.css` 和 `script.js` 中的路徑。

## 使用方式

直接用瀏覽器開啟 `index.html` 即可預覽。

操作流程：

1. 進入頁面後，loading 會先停留一下，再自動從 15% 推進到 75%。
2. 到達 75% 後，將滑鼠移到進度條右側邊緣附近，畫面會顯示 `pull` 提示。
3. 按住並向右拖曳進度條到 100%，入口 overlay 會淡出。
4. `#main-page` 會顯示出來，後續主內容可以放在 `index.html` 的 `<main id="main-page">` 裡。

鍵盤操作：

- loading 到達可拖曳狀態後，可按 `ArrowRight` 逐步增加進度。
- 可按 `End` 直接推進到 100%。

## 主要功能

- SVG 圖像疊層，製造紅藍色差與抖動效果。
- SVG filter 雜訊效果，讓標題有不穩定的顆粒感。
- 自動 loading 模擬，速度會隨機快慢變化。
- 到 75% 後解鎖拖曳互動，必須手動拉到 100%。
- 自訂游標與 `pull` 跟隨提示。
- 支援滑鼠、觸控指標事件與簡單鍵盤操作。
- 預留影片預載流程。

## 可調整參數

以下設定在 `script.js` 開頭：

```js
const AUTO_START = 15;          // 自動載入起始進度
const AUTO_END = 75;            // 自動載入停止進度，也是可拖曳起點
const AUTO_DURATION = 30000;    // 自動載入約略時間，單位毫秒
const COMPLETE = 100;           // 完成進度
const PRELOAD_TIMEOUT = 14000;  // 媒體預載最長等待時間
const EMPTY_HOLD = 700;         // 進場後開始 loading 前的停留時間
```

媒體預載清單也在 `script.js`：

```js
const mediaToPreload = [
  "/videos/video1.mp4",
  "/videos/video2.mp4",
  "/videos/video3.mp4"
];
```

目前專案資料夾內沒有 `videos/` 目錄。若不需要預載影片，可以把 `mediaToPreload` 改成空陣列：

```js
const mediaToPreload = [];
```

## 修改主頁內容

入口完成後會顯示 `#main-page`。目前主頁區塊是空的：

```html
<main id="main-page" aria-hidden="true">
  <!-- main artwork goes here -->
</main>
```

可以把正式頁面、影像、互動內容或其他分頁入口放進這個 `main` 裡。

## 視覺資源

目前頁面主要使用：

- `assest/title2.svg`：警告標題圖像。
- `assest/content2.svg`：警告內容圖像。
- `assest/smile.svg`：左右兩側笑臉圖像。
- `assest/cursor.svg`：自訂游標。

`title.svg`、`content.svg`、`loading.svg` 目前保留在資料夾中，但主要畫面使用的是 `title2.svg` 與 `content2.svg`。

## 瀏覽器需求

建議使用新版桌面瀏覽器測試：

- Chrome / Edge
- Firefox
- Safari

頁面使用到 CSS variables、`clamp()`、SVG filters、Pointer Events 與 `requestAnimationFrame`。

## 開發備註

- 這是純 HTML / CSS / JavaScript 專案，不需要安裝套件。
- 若之後加入正式影片或主頁內容，建議用本機伺服器開啟，避免瀏覽器對本機檔案路徑或媒體載入有額外限制。
- `index.html` 中 CSS 和 JS 檔案後面有版本參數，例如 `style.css?v=20260629-22`，可用來避免瀏覽器快取舊版本。

最後更新：2026-06-29
