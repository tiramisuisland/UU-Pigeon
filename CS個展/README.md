# CS Gallery

第一人稱展場射擊遊戲。玩家進入展場後，會在老花眼視覺干擾下尋找眼鏡與武器，在展覽空間中避開觀眾、干擾展場秩序，並射擊破壞指定作品。

目前展覽語境設定為政治挑釁型策展：作品與觀眾對話圍繞小粉紅、親中政治人物、民族主義觀看反應，以及「有點喜歡但被挑釁」的觀看感受。

## 啟動方式

這是靜態網頁專案，不需要安裝 npm 套件。請在本資料夾啟動本機 server：

```sh
python3 -m http.server 4175
```

然後打開：

```text
http://127.0.0.1:4175/
```

如果 `4175` 已被占用，可以換成其他埠，例如：

```sh
python3 -m http.server 4176
```

目前 `index.html` 透過 import map 從 `https://unpkg.com/` 載入 Three.js。第一次開啟時需要網路；如果要離線展示，請先把 Three.js 與 addons 下載到本機並更新 import map 路徑。

## 操作

- 點擊畫面開始遊戲並鎖定滑鼠。
- 滑鼠移動：轉動視角。
- 滑鼠左鍵：射擊；沒有武器時會出現空手動作。
- `W` / `A` / `S` / `D`：移動。
- `Shift`：奔跑。
- `Space`：跳躍。
- `Control` 或 `C`：蹲下。
- `Esc`：解除滑鼠鎖定。

## 介面與語言

玩家介面目前使用英文。

- 已移除 HP、ARMOR、AMMO 數值顯示。
- 未戴眼鏡狀態會在底部跑馬燈顯示。
- 系統提示只顯示在底部跑馬燈，例如取得武器、取得眼鏡、模型載入狀態。
- `Visitor` 與 `stuff` 對話共用左下對話區，最多保留 5 則，每則約 9 秒後消失。
- 中央的「Vision cannot focus」提示已預設隱藏。

## 視覺設定

遊戲一開始模擬老花眼視覺：近距離物件會明顯模糊與扭曲，遠距離展場會相對清晰。撿到眼鏡後，老花眼後處理與準星模糊會關閉。

相關程式在 `src/main.js`：

- `makePresbyopiaMaterial()`：WebGL 後處理 shader，根據深度決定近距離模糊。
- `updateVisionFocus()`：依準星前方距離調整老花眼強度。
- `collectGlasses()`：撿到眼鏡後清除視覺干擾。

## 展場光源與材質校正

展場光源在 `src/main.js` 的 `makeLights()` 與 renderer 初始化處設定。

- renderer 使用 `THREE.ACESFilmicToneMapping`，`toneMappingExposure` 目前為 `0.84`。
- 全域光：`AmbientLight(0xfff8ef, 1.7)`，接近中性白但保留少量暖色。
- 半球光：`HemisphereLight(0xfffbf5, 0xe8e4dd, 0.95)`。
- 上方方向光：`DirectionalLight(0xfff3e3, 0.42)`，位置為 `[0, 8, 0]`，啟用陰影。
- 9 顆展場點光：`PointLight(0xffffff, 0.82, 13.5, 2.15)`，排列在 `x = -6, 0, 6` 與 `z = -8, 0, 8`，高度 `y = 4.2`。
- `space.glb` 目前沒有內建 `KHR_lights_punctual` 光源，展場主要由程式光照控制。

特定模型材質校正在 `tuneGalleryMaterials()` 內依 node / material 名稱處理：

- `CH01` 到 `CH06`：套用偏青綠、低曝光的油畫色彩校正；作品材質使用 `CH_ARTWORK_COLOR_CORRECTION = (0.58, 0.78, 0.7)`，框材使用 `CH_FRAME_COLOR_CORRECTION = (0.38, 0.46, 0.42)`。
- `S__28524548`：材質亮度由 `S_IMAGE_BRIGHTNESS = 0.55` 控制，並作為可破壞物件。
- `1783259518580 拷貝`：內嵌在 `space.glb` 的 JPEG image，對應 node `Box002`，亮度由 `IMAGE_1783259518580_BRIGHTNESS = 1.38` 控制。
- `wall` / `wall.jpg`：內嵌在 `space.glb` 的 JPEG image，對應 node `Box001.001`，使用 `WALL_BACKLIGHT_BRIGHTNESS = 1.72` 與 `WALL_BACKLIGHT_EMISSIVE_INTENSITY = 1.45` 做背透光 / 發光質感。

## Visitor 與 Stuff

觀眾與工作人員設定集中在 `src/asset-manifest.js` 的 `VISITOR_ASSETS`。

- 一般觀眾使用程式生成的 voxel / Minecraft-like 方塊風格，不再依賴 `visitor-01.glb` 到 `visitor-04.glb`。
- 觀眾有男生、女生差異，包含身形比例與髮型差異。
- 觀眾服裝改為低彩度色盤，避免正藍、正紅、亮青等高飽和顏色。
- 入口仍會再生一般觀眾；再生觀眾同樣使用 voxel 風格與低彩度色盤。
- `stuff` 是布展工作人員，新增在 visitor 系統內，但不會被入口 spawner 再生。
- `stuff` 穿制服，衣服上有 `stuff` 名牌，帽子戴在頭部。
- `stuff` 會在作品旁工作：站立檢查、蹲下調整、拿 clipboard 記錄、短距離移動。移動與蹲下已解耦，移動時會站著走，到定位點後才可能蹲下。
- 玩家每次開槍都會呼叫 `alertVisitors(camera.position, { radius: 22, heardGunshot: true })`，不需要打中觀眾才觸發反應。
- `aggressive` 觀眾聽到槍聲後會進入 `hostile` 狀態並跑向玩家攻擊。
- 其他觀眾與 `stuff` 聽到槍聲後會進入 `hide` 狀態，朝 `VISITOR_HIDE_SPOTS` 中較遠的躲藏點移動，並以蹲低、護頭姿態躲避。

## 對話內容

對話邏輯在 `src/main.js` 的 `maybeVisitorTalk()`。

- `Visitor`：圍繞政治挑釁、民族主義觀看、小粉紅或親中政治人物可能被冒犯的感受。
- `stuff`：圍繞專業布展討論，例如 sightline、label height、cable run、light spill、作品留白。
- `System`：不進入角色對話框，只更新底部跑馬燈。

## 可破壞物件與血量

可破壞物件主要在 `src/main.js` 中設定：

- `SPACE_DESTRUCTIBLE_NAMES`：可破壞物件名稱清單。
- `SPACE_DESTRUCTIBLE_DAMAGE_LINKS`：血量與傷害連動關係。
- `getSpaceDestructibleMaxHealth()`：血量設定。
- `getColliderShrinkAmount()`：碰撞範圍縮小設定。

目前血量規則：

- 一般可破壞物件：`3-6`。
- `as01` 目標群組：`5-7`。
- `S__28524548` / `ss` / `S__28524548.002`：固定血量 `5`。
- `car01`、`car01.001`、`ladder.001`、`ladder.002`、`ladder.003`：血量也是一般 `3-6`，但碰撞範圍縮小為 `0.28`。

目前連動規則：

- `as02`、`as03` 綁定 `as01`。
- `NVs` 綁定 `N01`。
- `NV2` 綁定 `N02`。
- `NV3` 綁定 `N03`。
- `NV4` 綁定 `N04`。
- `FV01` 綁定 `MD01`。
- `FV02` 綁定 `MD02`。

## 拾取物

- 眼鏡與武器會生成在地面上，不再懸浮或上下漂浮。
- `settlePickupOnFloor()` 會根據物件 bounding box 把拾取物貼近 `WORLD_FLOOR_Y`。
- `updatePickups()` 使用水平距離判定拾取，避免物件貼地後因高度差而不易取得。

## 素材位置

素材路徑集中在 `src/asset-manifest.js`。資料夾配置見 `docs/asset-structure.md`。

- `assets/gallery/`：展場模型，主要是 `space.glb`。
- `assets/player/`：玩家模型。
- `assets/weapons/`：武器模型。
- `assets/visitors/`：目前不再需要 `visitor-01.glb` 到 `visitor-04.glb`；可保留其他測試角色模型，例如 `TH.glb`。
- `assets/video/`：展場影片。`FV02`、`FV01`、`NVs`、`NV2`、`NV3`、`NV4` 會優先載入 manifest 指定影片。
- `assets/textures/`：共用貼圖。

如果指定的 `.glb` 尚未放入資料夾，程式會使用程式生成替代物件，方便逐步替換與測試。

## 主要檔案

- `index.html`：頁面入口、HUD、跑馬燈、對話區。
- `styles.css`：介面、準星、開始畫面、跑馬燈、對話框與老花眼覆蓋層樣式。
- `src/main.js`：Three.js 場景、玩家控制、射擊、可破壞物件、visitor/stuff 行為、對話、HUD 與後處理。
- `src/asset-manifest.js`：玩家出生點、展場邊界、影片、visitor/stuff 初始設定與武器設定。
- `docs/asset-structure.md`：素材資料夾與命名記錄。

## 維護備註

- 每次修改 `src/main.js` 或 `styles.css` 後，建議同步更新 `index.html` 的 query version，避免瀏覽器快取舊檔。
- 檢查 JavaScript 語法可用：

```sh
.tools/node/bin/node --check src/main.js
```

- 檢查本機 server：

```sh
curl -I http://127.0.0.1:4175/
```
