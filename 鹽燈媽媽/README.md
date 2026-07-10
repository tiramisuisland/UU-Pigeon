# SM / SB Popup Windows

這是 `SM.mp4` 與 `SB.mp4` 的 popup 版本。它沿用前一個 popup 網頁的視窗尺寸與定位邏輯，但不使用敏感內容遮罩。

## How To Run

在這個資料夾啟動本機伺服器：

```bash
python3 -m http.server 8001
```

打開：

```text
http://localhost:8001/
```

點擊 `Open Popups` 後會開啟三個視窗：

- `SM.mp4`：固定在螢幕中心。
- `SB.mp4`：開啟兩個視窗，分別伴隨在 `SM` 左右兩側。

## Notes

- popup 會盡量依照影片本身像素尺寸調整視窗大小。
- 影片會在 popup 彈出後直接嘗試播放聲音與畫面。
- 若瀏覽器阻擋有聲自動播放，請在 popup 中手動按播放，或允許此網站自動播放媒體。
- 若瀏覽器阻擋 popup，請允許 `localhost` 的彈出式視窗。
