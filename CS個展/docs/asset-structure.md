# Asset Structure

這個專案已先分好可替換資源的位置。主要資產設定都集中在 `src/asset-manifest.js`，目前預設以 `.glb` 為主；之後要測試新模型時，優先用 manifest 內的同名檔案覆蓋或修改 `modelPath`。

## Folders

- `assets/gallery/`
  放展場模型，例如完整美術館空間 `.glb` / `.gltf`。

- `assets/player/`
  放玩家模型、第一人稱手臂、玩家服裝或控制器相關模型。

- `assets/weapons/`
  放武器模型，例如第一人稱槍枝 `.glb` / `.gltf`。

- `assets/artworks/images/`
  舊版平面作品圖片位置。現在主要改用 `assets/artworks/models/` 的 `.glb`。

- `assets/artworks/models/`
  放平面作品、畫框作品或立體藝術品 `.glb`。

- `assets/sculptures/`
  放雕塑、裝置、充氣作品模型。需要洩氣互動的模型也放這裡。

- `assets/visitors/`
  可放測試或備用觀眾角色模型。目前主要 visitor 與 stuff 已改為程式生成 voxel 方塊角色，不再依賴 `visitor-01.glb` 到 `visitor-04.glb`。

- `assets/textures/`
  放共用材質貼圖，例如木地板、牆面、彈孔、布料、金屬等。

- `assets/video/`
  放展場 GLB 節點對應影片。`FV02`、`FV01`、`NVs`、`NV2`、`NV3`、`NV4` 會優先載入同名 `.mp4`，若檔案不存在才嘗試讀取 GLB 內嵌影片。

## Manifest

主要設定集中在 `src/asset-manifest.js`：

- `GALLERY_SPACE`
  畫廊空間分類。放展場模型路徑、玩家可移動範圍、展場縮放與位置。

- `GALLERY_VIDEOS`
  展場影片節點設定。`FV02`、`FV01`、`NVs`、`NV2`、`NV3`、`NV4` 會對應到 `assets/video/` 內的影片檔。

- `PLAYER_ASSETS`
  玩家分類。`player` 放玩家出生點、速度、可移動範圍、玩家模型路徑；`weapon` 放第一人稱武器模型設定。

- `VISITOR_ASSETS`
  觀眾與布展工作人員分類。`visitors` 放角色位置、朝向、行為、性別、voxel 外觀色盤與工作範圍。一般觀眾會由入口再生；`role: "staff"` 的布展工作人員不會被 spawner 再生。

程式匯出 `GALLERY_MODEL`、`PLAYER`、`WEAPON`、`VISITORS`、`VISITOR_ENTRY_POSITION` 作為 `src/main.js` 的主要入口。

## Recommended File Types

- 模型：`.glb` 最推薦；展場、玩家與武器目前仍透過 manifest 指向 `.glb`。
- 圖片：只有舊版或貼圖需求才使用 `.png`、`.jpg`、`.webp`。
- 貼圖：建議尺寸用 1024 或 2048，避免太大影響網頁效能。

## Default GLB Names

- 展場：`assets/gallery/space.glb`
- 武器：`assets/weapons/first-person-rifle.glb`
- 玩家：`assets/player/player.glb`
- 觀眾：目前使用程式生成 voxel 角色，不需要 `visitor-01.glb` 到 `visitor-04.glb`
- 展場影片：`assets/video/曼德拉FULLs.mp4`、`NVs.mp4`、`NV2.mp4`、`NV3.mp4`、`NV4.mp4`

如果某個 GLB 還沒放進資料夾，程式會保留原本的程式生成替代物件，方便逐一替換測試。
