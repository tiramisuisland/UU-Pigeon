# 爆炸分頁 README

這個資料夾是一個獨立的互動分頁：使用者按下 `Launch` 後，頁面會一次開啟多個 popup 視窗播放爆炸影片，約 15 秒後開啟最後的 ending 視窗播放 `Ending song.mp4`。

## 檔案結構

```text
爆炸/
├── index.html
├── Ending song.mp4
└── 爆炸用/
    ├── 1.mp4
    ├── 2.mp4
    ├── ...
    ├── 18_1.mp4
    └── 25.mp4
```

## 主要入口

- 入口檔案：`index.html`
- 主按鈕：`Launch`
- 爆炸影片資料夾：`爆炸用/`
- 結尾影片：`Ending song.mp4`

之後整合到其他網站時，可以直接把整個 `爆炸` 資料夾放進專案，從主頁連到：

```html
<a href="爆炸/index.html">進入爆炸分頁</a>
```

如果資料夾位置有改，請同步確認 `index.html` 裡面的影片路徑仍然正確。

## 瀏覽器需求

這個分頁需要瀏覽器允許 popup，否則無法完整運作。

- Chrome / Edge：第一次按下 `Launch` 時，如果 popup 被擋，請點網址列的 popup 封鎖圖示，選擇允許此網站的 popup，再按一次 `Retry`。
- Safari：到 Safari 設定中的「網站」/「彈出式視窗」，允許這個頁面，再按一次 `Retry`。

建議在正式展示前先用目標電腦和目標瀏覽器測試一次，確保 popup 權限已開啟。

## 整合注意事項

- 請保留 `index.html`、`Ending song.mp4`、`爆炸用/` 的相對位置。
- 影片檔名目前是寫死在 `index.html` 的 `explosionVideos` 陣列中，改名或增減影片時要同步更新這個陣列。
- `Ending song.mp4` 的檔名包含空格；如果搬到其他系統或伺服器，請確認路徑和 URL 編碼能正常讀取。
- 此頁面會主動開啟、移動、縮放和關閉 popup 視窗，適合獨立展示，不建議嵌入 iframe。
- 若整合到大型網站，建議用新分頁或獨立路由開啟，避免影響主網站原本的瀏覽狀態。
- 整個資料夾目前約 73 MB，其中影片素材約 73 MB，部署時要一起上傳。

## 可調整設定

以下設定都在 `index.html` 的 `<script>` 裡：

- `explosionVideos`：爆炸影片清單。
- `endingVideo`：結尾影片路徑。
- `await sleep(15000)`：爆炸開始後等待 15 秒再進入 ending 視窗，可調整毫秒數。
- `popupFeatures(...)`：popup 視窗預設尺寸和瀏覽器視窗特性。
- `moveFromCenter(...)`：爆炸視窗移動範圍、速度和隨機偏移。
- `moveEndingToCenter(...)`：ending 視窗大小和位置。

## 本機測試方式

最簡單的方式是直接用瀏覽器開啟 `index.html`。

如果瀏覽器對本機檔案限制較多，也可以在此資料夾開一個靜態伺服器：

```bash
python3 -m http.server 8000
```

然後到：

```text
http://127.0.0.1:8000/
```

## 操作流程

1. 開啟 `index.html`。
2. 按下 `Launch`。
3. 如果瀏覽器要求 popup 權限，允許後按 `Retry`。
4. 多個爆炸影片 popup 會依序出現。
5. 約 15 秒後出現 ending 視窗。
6. 在 ending 視窗選擇：
   - `Yes`：播放 ending 影片。
   - `No`：關閉所有 popup，主頁顯示 `Closed`。

## 已知限制

- Popup 行為受瀏覽器安全政策影響，不同瀏覽器可能有不同限制。
- 手機瀏覽器通常不適合這個分頁，因為多視窗 popup 支援有限。
- 如果使用者手動關閉 ending 視窗，頁面會嘗試關閉所有已開啟的 popup。
- 若瀏覽器阻止視窗移動或縮放，影片仍可能播放，但視窗效果會打折。
