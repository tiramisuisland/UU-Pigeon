# UU 的鴿子網頁

這是一個純前端互動網站專案，核心入口是根目錄 `index.html`：一個以 Three.js 製作的飛鳥／射擊／popup 互動場景。專案同時收納多個獨立作品分頁，包括警告入口、多視窗影片、爆炸 popup、佛光衝擊波、角子老虎機、第一人稱展場遊戲，以及若干測試與封存版本。

整個專案不需要 npm 安裝流程。正式部署使用 Docker + Nginx，也可以用任一靜態檔案伺服器在本機預覽。

## 快速開始

本機預覽建議從專案根目錄啟動靜態伺服器：

```bash
python3 -m http.server 8080
```

然後開啟：

```text
http://127.0.0.1:8080/
```

注意事項：

- `index.html`、`pages/video-popup.html`、`CS個展/index.html` 會從 unpkg CDN 載入 Three.js，第一次開啟需要網路。
- 多數子作品依賴 `window.open()`，瀏覽器必須允許 popup。
- 影片與音效播放可能受瀏覽器自動播放政策限制，通常需要先由使用者點擊觸發。
- 建議用本機伺服器開啟，不要直接用 `file://`，避免媒體、module import、popup 溝通出現限制。

## Docker 部署

Cloudflare Tunnel 後台的 Published application route Service URL 請設定為：

```text
http://web:8080
```

建置並在背景啟動網站：

```bash
docker compose up -d --build
```

查看狀態：

```bash
docker compose ps
```

停止網站：

```bash
docker compose down
```

部署行為：

- `Dockerfile` 使用 `nginx:stable-alpine`，將整個專案複製到 `/usr/share/nginx/html`。
- Nginx 監聽容器內 `8080`，`/healthz` 回傳 `ok` 供 healthcheck 使用。
- `compose.yaml` 不映射主機 port，網站由同一個 Docker network 內的 `cloudflared` 透過 `http://web:8080` 存取。
- `web` 和 `cloudflared` 都使用 `none` logging driver，不保存容器 log。

## 專案入口與流程

```text
index.html                         正式主頁，Three.js 飛鳥互動場景
├─ front_page/index.html            警告／權限入口 iframe
├─ pages/video-popup.html           投票影片 popup
├─ pages/anthem-popup.html          唱國歌影片 popup
├─ pages/bird-camera-popup.html     鴿子即時攝影機 popup
├─ pages/plain-video-popup.html     輕量影片 popup
├─ pages/image-popup.html           輕量圖片 popup
├─ 爆炸0701/index.html              爆炸多視窗互動
├─ 佛光砲/index.html                佛光衝擊波 popup
├─ Truth/index.html                 Truth 多影片 popup
├─ look_at_them/index.html          CCTV 多 popup 序列
├─ 麻醉槍/index.html                敏感內容遮罩影片 popup
├─ 鹽燈媽媽/index.html              SM / SB 影片 popup
├─ NoJ/index.html                   886 Slot Machine
└─ CS個展/index.html                第一人稱展場射擊遊戲
```

## 正式主頁：`index.html`

根目錄 `index.html` 是正式入口，只保留頁面骨架與必要載入順序。主頁樣式放在 `assets/css/main.css`，入口權限流程放在 `assets/js/entry-gate.js`，主要 Three.js 互動邏輯放在 `assets/js/main.js`。

主要功能：

- 建立天空、HDR 環境光、地面水波、雲、風暴閃光與鴿子飛行場景。
- 載入 `assets/models/action.glb` 作為鴿子模型，並使用 `assets/models/signs/*.glb` 做掉落文字。
- 點擊鴿子時播放擊中動畫、音效，更新本次擊落數與全站擊落數。
- 顯示 agree、disagree、存活鴿子、本次擊落、全站擊落、瀏覽量等資訊。
- 右下顯示 `assets/models/UU.glb`，並使用 `assets/videos/大偶90.mp4` 作為影片材質。
- 使用 `scripts/press-volume-control.js` 的自訂 Web Component 控制主頁與 popup 音量。
- 顯示聊天室面板，讀取訊息、標題、讚與倒讚數，長按訊息可送出喜歡或不喜歡。
- 首次進入場景時播放 `pages/anthem-popup.html`。
- 第 5 隻鴿子被擊落時開啟 `pages/bird-camera-popup.html`。
- 第 10 隻鴿子被擊落時開啟 `pages/video-popup.html` 的投票影片輪播。
- 依存活鴿子數或擊落數觸發其他子作品 popup。

測試參數：

- `index.html?testAlive=30`：指定初始存活鴿子數。
- `index.html?testAlive=30&testKillsMode=1`：進入擊落觸發測試模式。

對應測試頁：

- `test-alive.html`：用 iframe 包住主頁，快速測試不同存活數。
- `test-kills.html`：用 iframe 包住主頁，快速觸發不同擊落數。

## 外部服務

正式主頁與投票 popup 使用下列外部資源：

- Three.js `0.164.1`：由 `https://unpkg.com/` 載入。
- CS Gallery 使用 Three.js `0.165.0`：由 `https://unpkg.com/` 載入。
- `https://macn8n.tiramisu-island.com/webhook/...`：投票、聊天室、擊落數與瀏覽量 API。

主頁 webhook：

- `get_agree` / `get_disagree`：讀取票數。
- `plus_agree` / `plus_disagree`：由投票 popup 送出票數。
- `kill_pigeon` / `get_kill_pigeon`：記錄與讀取全站擊落數。
- `pageviews` / `get_pageviews`：記錄與讀取瀏覽量。
- `get_u_chatting` / `get_chatting_title`：讀取聊天室內容與標題。
- `chatting_like_count` / `chatting_dislike_count`：送出聊天室訊息反應。

## 主要資料夾

- `assets/`：正式主頁使用的 CSS、JS、模型、影片、音效、圖片、數字圖、HDR 環境貼圖。
- `assets/css/`：主頁樣式。
- `assets/js/`：主頁入口權限流程與 Three.js 互動邏輯。
- `pages/`：由主頁開啟的 popup 頁面。
- `scripts/`：共用元件，目前主要是按壓式音量控制。
- `front_page/`：黑白警告入口與拖曳 loading bar。
- `CS個展/`：第一人稱展場射擊遊戲。
- `Truth/`、`look_at_them/`、`麻醉槍/`、`鹽燈媽媽/`、`爆炸0701/`、`佛光砲/`、`explo/`：各自獨立的 popup／影片作品。
- `NoJ/`：886 角子老虎機。
- `outher/`：舊版、測試檔與未使用備用素材。
- `front_page/saved_versions/`：警告入口的歷史版本備份。

## 子作品索引

### `front_page/`

黑白警告入口頁。畫面使用 SVG 色差疊層、雜訊濾鏡、自訂游標與 loading bar。進度自動到 75% 後，使用者需要拖曳到 100% 才會進入主內容。根主頁會以 iframe 方式載入它作為入口／權限流程的一部分。

主要檔案：

- `front_page/index.html`
- `front_page/style.css`
- `front_page/script.js`
- `front_page/assest/`

### `pages/`

正式主頁使用的 popup 工具頁：

- `video-popup.html`：影片背景 + 3D agree/disagree 按鈕，送出投票後關閉。
- `anthem-popup.html`：播放唱國歌影片，滑鼠移入後顯示 `shut_up.png` 關閉圖。
- `bird-camera-popup.html`：接收主頁 `postMessage()` 傳來的 `ImageData`，顯示鴿子攝影機 canvas。
- `plain-video-popup.html`：輕量影片 popup。
- `image-popup.html`：輕量圖片 popup。

### `CS個展/`

第一人稱展場射擊遊戲。玩家在展場內移動、拾取眼鏡與武器、避開觀眾和工作人員，並射擊可破壞作品。

本機啟動：

```bash
cd CS個展
python3 -m http.server 4175
```

主要檔案：

- `index.html`：入口與 HUD。
- `styles.css`：介面與視覺效果。
- `src/main.js`：Three.js 場景、玩家控制、射擊、NPC 行為、後處理。
- `src/asset-manifest.js`：素材、出生點、邊界、影片與角色設定。
- `docs/asset-structure.md`：素材結構說明。

### `爆炸0701/`

多視窗爆炸互動。按下 Launch 或由主頁觸發後，會開啟多個 popup 播放爆炸影片，最後出現 ending 視窗播放 `Ending song.mp4`。

注意：此作品高度依賴 popup 權限、視窗移動與視窗縮放。

### `佛光砲/`

佛光衝擊波 popup。入口頁開啟 `popup.html`，使用 `佛光衝擊波.png` 作為主視覺，搭配光波、橫向展開、建築物擊碎、音效與自動關閉流程。

主要檔案：

- `index.html`
- `popup.html`
- `popup.css`
- `popup.js`
- `佛光衝擊波.png`
- `1.png` / `2.png` / `3.png`
- `1.mp3` / `2.mp3` / `3.mp3`

### `Truth/`

多影片 popup launcher。`M1.mp4` 先在中央開啟，`V1.mp4`、`V2.mp4`、`S1.mp4`、`S2.mp4` 依序散布在周圍。關閉主 popup 時會同步關閉其他視窗。

### `look_at_them/`

CCTV 多 popup 序列。`C1.mp4` 先在右上角彈出，其他影片待命後再往左下展開排列。任一 popup 關閉時會關閉同批所有 popup。

### `麻醉槍/`

多影片 popup launcher。每個 popup 開始時有敏感內容警告遮罩，點擊任一遮罩後所有 popup 同步解鎖並播放。同步使用 `BroadcastChannel`，並用 `localStorage` 作備援。

### `鹽燈媽媽/`

`SM.mp4` 與 `SB.mp4` 的 popup 組合。`SM.mp4` 固定中央，`SB.mp4` 開兩個視窗分別在左右兩側，不使用敏感內容遮罩。

### `NoJ/`

886 Slot Machine。點擊機台或拉把後轉輪隨機跳動，結果可自然出現 `886`；若連續兩次未出現，下一次保底出現 `886`。

本機啟動：

```bash
cd NoJ
python3 -m http.server 8088
```

### `explo/`

兩段式影片 popup。入口開啟 `player.html` 播放 `explo2.mp4`，約 15 秒後再開啟 `player2.html` 播放 `explo1.mp4`。

### `outher/`

封存區，保存目前正式主頁沒有引用的舊版、測試檔與備用素材。

- `outher/legacy/nono/`：早期模組化飛鳥場景實驗。
- `outher/pages/temp.html`：早期 3D GLB 測試頁。
- `outher/assets/`：舊版模型、音效、影片與圖片。
- `outher/notes/`：舊資料文字檔。

## 素材說明

正式主頁常用素材：

- `assets/models/action.glb`：主要鴿子模型與動作。
- `assets/models/UU.glb`：右下讀報人／大偶模型。
- `assets/models/buttonC_EN.glb`：投票 popup 的 agree/disagree 按鈕模型。
- `assets/models/signs/*.glb`：鴿子掉落文字模型。
- `assets/environment/belfast_sunset_2k.hdr`：環境光與反射。
- `assets/digits/0.bmp` 到 `9.bmp`：票數數字顯示。
- `assets/audio/翅膀拍動的聲音2.mp3`：翅膀音效。
- `assets/audio/鴿子的叫聲.mp3`：鴿子叫聲。
- `assets/audio/Gun4.mp3`：主頁射擊音效。
- `assets/videos/video1.mp4`、`video2.mp4`、`video3.mp4`：投票 popup 輪播影片。
- `assets/videos/唱國歌.mp4`：唱國歌 popup。
- `assets/videos/national-joint.mp4`：擊落觸發影片 popup。
- `assets/videos/大偶90.mp4` / `大偶90.mov`：UU 模型影片材質。
- `assets/images/asian-futurism.png`：擊落觸發圖片 popup。
- `assets/images/X.png`：自訂游標。
- `assets/images/shut_up.png`：唱國歌 popup 關閉圖。
- `assets/images/元首聊天室.svg`：聊天室外框。
- `assets/images/like.png` / `dislike.png`：聊天室反應圖示。
- `assets/images/chat-avatars/`：聊天室人物頭像。

## 維護備註

- 修改 HTML、CSS、JS 後，如果檔案引用有 `?v=...` 版本參數，建議同步更新，避免瀏覽器快取舊版本。
- 多視窗作品需要在目標展示電腦上預先測試 popup 權限。
- 部署時要保留中文檔名與空格檔名，例如 `Ending song.mp4`、`佛光衝擊波.png`。
- `front_page/assest/` 的資料夾名稱目前拼作 `assest`，程式碼也使用這個路徑；若更名為 `assets`，要同步修改引用。
- `compose.yaml` 內含 Cloudflare Tunnel token；若此 repo 會公開或交給他人，建議改用環境變數或私密設定檔管理。
- 這是靜態網站，但外部 webhook 與 CDN 失效時，投票、聊天室、計數或 Three.js 載入會受影響。

## 快速檢查清單

正式展示前建議確認：

- 根目錄 `index.html` 能載入 3D 場景。
- 瀏覽器允許 popup。
- 第一次點擊可播放唱國歌 popup。
- 擊落、存活數與投票 popup 觸發正常。
- 聊天室與 webhook 計數能正常讀取。
- 多視窗子作品在目標螢幕解析度下位置與尺寸可接受。
- Docker 部署後 `/healthz` 回傳 `ok`。
