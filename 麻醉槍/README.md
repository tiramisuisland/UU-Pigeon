# Popup Video Windows

這是一個以瀏覽器 popup 視窗呈現資料夾內影片的靜態網站。首頁只負責啟動 popup；每支影片會在獨立視窗中顯示，並先覆蓋一層敏感內容警告遮罩。

## How To Run

在此資料夾中啟動本機伺服器：

```bash
python3 -m http.server 8000
```

然後用瀏覽器打開：

```text
http://localhost:8000/
```

點擊首頁的 `Open Popups` 後，瀏覽器會依序開啟所有影片 popup。

## Files

- `index.html`：啟動頁面，包含 `Open Popups` 按鈕。
- `popup.html`：單一影片 popup 視窗頁面。
- `styles.css`：首頁、popup、警告遮罩、眼睛圖示與文字排版樣式。
- `script.js`：popup 開啟、位置隨機、尺寸同步、解鎖同步與影片播放邏輯。
- `Sing F.mp4`：中心 popup 影片。
- `Sing ppl.mp4`、`Sing D.mp4`、`Sing S.mp4`、`Sing U.mp4`、`Sing N.mp4`：周圍 popup 影片。

## Behavior

- `Sing F` 永遠放在螢幕中心。
- 其他 popup 每次點擊 `Open Popups` 都會重新隨機位置。
- popup 視窗會盡量依影片本身的像素尺寸調整大小。
- 周圍 popup 會檢查彼此與中心視窗的重疊面積，目標是不超過 `100 * 200` pixels。
- 每個 popup 一開始都會顯示警告遮罩。
- 點擊任一 popup 的遮罩後，所有 popup 會同步解鎖並播放。
- 解鎖同步使用 `BroadcastChannel`，並以 `localStorage` 作為備援。

## Warning Overlay

遮罩文字為：

```text
Sensitive content: this image may contain graphic violence.
```

遮罩會直接使用影片畫面作為模糊背景：影片本身先被 blur、降低亮度與飽和度，再覆蓋半透明霧化層。文字使用 Futura 字體設定，並會依 popup 視窗比例調整斷句寬度。

## Browser Notes

瀏覽器通常會阻擋自動 popup。若點擊後沒有開啟視窗，請在網址列或瀏覽器設定中允許 `localhost:8000` 的彈出式視窗，然後重新點擊 `Open Popups`。

部分瀏覽器會限制 `window.moveTo()` 或 `window.resizeTo()`，因此 popup 的位置和尺寸可能受到瀏覽器政策影響。

如果影片自動播放被瀏覽器阻擋，程式會嘗試將影片靜音後播放；若仍被阻擋，使用者可在 popup 中手動播放。
