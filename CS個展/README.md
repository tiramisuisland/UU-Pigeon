# CS Gallery

第一人稱展場射擊遊戲。玩家進入展場後，需要在老花眼視覺干擾下尋找眼鏡、避開觀眾、找到指定作品並射擊破壞目標。

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

## 操作

- 點擊「進入展場」開始遊戲並鎖定滑鼠。
- 滑鼠移動：轉動視角。
- 滑鼠左鍵：射擊。
- `W` / `A` / `S` / `D`：移動。
- `Shift`：奔跑。
- `Space`：跳躍。
- `Esc`：解除滑鼠鎖定。

## 視覺設定

遊戲一開始模擬老花眼視覺：近距離物件會明顯模糊與扭曲，遠距離展場會相對清晰。撿到眼鏡後，老花眼後處理與準星模糊會關閉。

相關程式在 `src/main.js`：

- `makePresbyopiaMaterial()`：WebGL 後處理 shader，根據深度決定近距離模糊。
- `updateVisionFocus()`：依準星前方距離調整老花眼強度。
- `collectGlasses()`：撿到眼鏡後清除視覺干擾。

## 素材位置

素材路徑集中在 `src/asset-manifest.js`，目前主要都設定成 `.glb`，並分成 `GALLERY_SPACE`、`ART_ASSETS`、`PLAYER_ASSETS`、`VISITOR_ASSETS` 四類。資料夾配置見 `docs/asset-structure.md`。

- `assets/gallery/`：展場模型。
- `assets/artworks/models/`：平面作品、立體作品或畫框模型 `.glb`。
- `assets/sculptures/`：雕塑或裝置模型，目前目標模型是 `greatman.glb`。
- `assets/player/`：玩家模型。
- `assets/visitors/`：觀眾角色模型。
- `assets/weapons/`：武器模型。
- `assets/textures/`：共用貼圖。

如果指定的 `.glb` 尚未放入資料夾，程式會使用原本的程式生成替代物件，方便逐步替換與測試。

## 主要檔案

- `index.html`：頁面入口與 HUD 結構。
- `styles.css`：介面、準星、開始畫面與老花眼覆蓋層樣式。
- `src/main.js`：Three.js 場景、玩家控制、射擊、觀眾、目標互動與後處理。
- `src/asset-manifest.js`：玩家出生點、展場邊界、作品、雕塑、觀眾與武器設定。

## 注意事項

目前 `index.html` 透過 import map 從 `https://unpkg.com/` 載入 Three.js。第一次開啟時需要網路；如果要離線展示，請先把 Three.js 與 addons 下載到本機並更新 import map 路徑。
