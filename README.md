# UU 的鴿子網頁

這份文件記錄每個頁面的作用、頁面之間的關係，以及各頁面使用的本機檔案與外部服務。

## 頁面流程

```text
index.html（正式主頁）
├─ pages/video-popup.html（影片與 agree / disagree 投票視窗）
└─ pages/bird-camera-popup.html（鴿子身上的即時攝影機視窗）

outher/
├─ legacy/nono/nono.html（舊版模組化主頁）
└─ pages/temp.html（3D 模型測試頁）
```

## 正式頁面

### `index.html`

專案正式入口，也是主要的 Three.js 互動場景。

主要功能：

- 建立天空、HDR 環境光、地面水波與雲朵。
- 產生會飛行、閃避、拉下文字與墜落的鴿子。
- 點擊鴿子時播放擊中動畫、叫聲並記錄擊落數量。
- 顯示 agree、disagree、存活鴿子、本次擊落數、全站擊落數與瀏覽量。
- 顯示右下角的 `UU.glb` 模型，並在模型上播放大偶影片。
- 使用自訂音量控制元件，同步控制主頁與 popup 的音量。
- 顯示可開關的聊天室面板，從 webhook 讀取其他人的聊天訊息。
- 長按聊天室訊息可選擇喜歡或不喜歡，並用該訊息 `id` 送出反應。
- 首次點擊「開啟 3D 場景」時播放唱國歌影片。
- 第 5 隻鴿子被擊落時開啟鴿子攝影機；第 10 隻時開啟三個投票影片的輪播 popup。

使用的頁面與程式：

- `pages/video-popup.html`
- `pages/bird-camera-popup.html`
- `scripts/press-volume-control.js`

使用的模型：

- `assets/models/action.glb`：主要鴿子模型與動作。
- `assets/models/UU.glb`：右下角的讀報人／大偶模型。
- `assets/models/signs/*.glb`：鴿子掉落的 22 個文字模型。

使用的視覺素材：

- `assets/environment/belfast_sunset_2k.hdr`：場景環境光與反射。
- `assets/images/X.png`：遊戲滑鼠游標。
- `assets/digits/0.bmp` 到 `9.bmp`：agree／disagree 數字顯示。

使用的音效：

- `assets/audio/翅膀拍動的聲音2.mp3`
- `assets/audio/鴿子的叫聲.mp3`

使用的影片：

- `assets/videos/video1.mp4`、`video2.mp4`、`video3.mp4`：擊落第 10 隻鴿子後開啟的投票 popup 輪播背景。
- `assets/videos/唱國歌.mp4`：首次開啟 3D 場景時播放。
- `assets/videos/大偶90.mp4`：右下模型的主要影片材質。
- `assets/videos/大偶90.mov`：大偶影片的備援格式。

使用的外部服務：

- Three.js `0.164.1` 與官方 addons，由 unpkg CDN 載入。
- `get_agree`、`get_disagree`：讀取投票數字。
- `get_u_chatting`：讀取聊天室訊息，顯示名稱、訊息內容、時間、讚數與倒讚數。
- `chatting_like_count?msg_id=...`：長按訊息後送出喜歡。
- `chatting_dislike_count?msg_id=...`：長按訊息後送出不喜歡。
- `kill_pigeon`、`get_kill_pigeon`：記錄與讀取全站擊落數。
- `pageviews`、`get_pageviews`：記錄與讀取瀏覽量。

### `pages/video-popup.html`

由 `index.html` 使用 `window.open()` 開啟的投票／影片視窗，不建議直接當作主頁使用。

主要功能：

- 讀取網址參數後播放單一影片或影片清單。
- 依 `interval` 參數定時更換背景影片。
- 顯示 3D agree／disagree 按鈕模型。
- 點擊按鈕後播放模型動畫或 shape key，並送出投票 webhook。
- 接收主頁傳來的音量訊息。
- 投票完成後停止影片並自動關閉視窗。

接受的網址參數：

- `video`：第一個影片網址。
- `playlist`：以 `|` 分隔的影片網址清單。
- `interval`：影片切換秒數，預設 20 秒。
- `label`：popup 視窗標題。
- `volume`：初始音量，範圍 0 到 1。

使用的本機檔案：

- `assets/models/buttonC_EN.glb`：agree／disagree 投票按鈕模型。
- 實際播放的影片由 `index.html` 透過網址參數傳入。

使用的外部服務：

- Three.js `0.164.1` 與 `GLTFLoader`，由 unpkg CDN 載入。
- `plus_agree`：送出 agree 投票。
- `plus_disagree`：送出 disagree 投票。

### `pages/bird-camera-popup.html`

顯示鴿子身上即時攝影機畫面的輕量 popup。

主要功能：

- 建立一個 360 × 360 的 canvas。
- 接收 `index.html` 透過 `postMessage()` 傳來的 `bird-camera-frame`。
- 將收到的 `ImageData` 畫到 canvas。
- 只接受與主頁相同來源的訊息。

使用的本機檔案：

- 沒有額外模型、圖片、音效或影片。
- 畫面完全由 `index.html` 的 Three.js renderer 即時產生。

## 備用與測試頁面

### `outher/legacy/nono/nono.html`

先前的模組化實驗版本，已經不在正式 `index.html` 流程中。

主要功能：

- 基本飛鳥場景、讀報人、即時數字、投票影片 popup。
- 功能被拆成獨立 JavaScript 與 CSS，方便參考模組化寫法。

使用的程式：

- `outher/legacy/nono/js/app.js`：啟動與協調功能。
- `outher/legacy/nono/js/config.js`：素材路徑、API 與設定。
- `outher/legacy/nono/js/core/scene.js`：場景、相機與 renderer。
- `outher/legacy/nono/js/features/`：鴿子、環境、讀報人、數字與 popup 功能。

使用的樣式：

- `outher/legacy/nono/styles/base.css`
- `outher/legacy/nono/styles/hud.css`
- `outher/legacy/nono/styles/counters.css`

注意：這是封存版本，素材已重新分類，舊設定中的相對路徑不保證可以直接執行。

### `outher/pages/temp.html`

早期的 3D GLB 測試頁，用來測試模型動畫、拖曳旋轉與滾輪縮放，不屬於正式網站流程。

原始用途與依賴：

- 使用 Three.js `0.178`、`GLTFLoader` 與 `OrbitControls`。
- 原本載入 `UU.glb`。
- 原本使用 `大偶90.mp4` 作為影片材質。

注意：這是封存測試頁，原始相對路徑沒有跟著正式素材目錄調整。

## 資料夾用途

- `assets/models/`：正式頁面使用的 3D 模型。
- `assets/models/signs/`：鴿子掉落的文字模型。
- `assets/audio/`：正式頁面音效。
- `assets/videos/`：正式頁面影片。
- `assets/images/`：介面圖片。
- `assets/digits/`：即時票數圖片。
- `assets/environment/`：HDR 環境貼圖。
- `pages/`：由主頁開啟的正式 popup 頁面。
- `scripts/`：共用 JavaScript 元件。
- `outher/`：正式入口沒有引用的舊版、測試與備用檔案。

## `outher/assets/` 內容

以下檔案目前沒有被正式 `index.html` 引用，但仍保留以便未來比較或復原：

- `outher/assets/models/`：`GG.glb`、`bottom.glb`、`bottonC.glb`、三個 `read_man` 版本與 `拉屎文字.glb`。
- `outher/assets/audio/翅膀拍動的聲音.mp3`：舊版翅膀音效。
- `outher/assets/videos/大偶.mp4`：舊版大偶影片。
- `outher/assets/images/`：`X.original.png` 與 `image1.png` 到 `image3.png`。
