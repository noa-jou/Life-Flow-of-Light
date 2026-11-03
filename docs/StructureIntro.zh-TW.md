# 歲月流明 — 專案結構與技術簡介

[專案介紹](../README.zh-TW.md) · [English](StructureIntro.md)

這份選讀文件介紹專案的組成，以及主要技術如何互相配合。

你不需要熟悉所有工具，也可以操作這個展示專案。安裝與啟動步驟請參閱[使用指南（英文）](UserGuide.md)。

## 1. 整體架構

歲月流明是一個純軟體概念驗證專案。

瀏覽器模擬家中的燈光，後端將燈光活動記錄在本機資料庫中。前端再呈現歷史紀錄，讓使用者搜尋可能的摩斯訊息。

不需要實體智慧燈泡或感測器。

| 部分 | 職責 |
| --- | --- |
| 前端 | 顯示介面、處理使用者操作，並發送 HTTP 請求。 |
| 後端 | 驗證請求、管理燈泡、記錄活動，以及解讀摩斯訊號。 |
| 資料庫 | 將燈泡與亮燈時段儲存在本機 SQLite 檔案中。 |

前端不會直接開啟資料庫，而是向後端請求資料，再將回應呈現在畫面上。

## 2. 專案目錄

專案包含三個主要資料夾：

| 路徑 | 用途 |
| --- | --- |
| `backend/` | 後端應用程式、資料庫結構與自動化測試。 |
| `frontend/` | 瀏覽器介面與前端開發設定。 |
| `docs/` | 使用指南、架構簡介與開發日誌。 |
| `README.md` | 英文專案介紹。 |
| `README.zh-TW.md` | 繁體中文專案介紹。 |

### 前端檔案

| 路徑 | 用途 |
| --- | --- |
| `frontend/src/` | React 元件、樣式、介面文字、素材與前端邏輯。 |
| `frontend/public/` | 不需匯入應用程式模組即可提供的靜態資源。 |
| `frontend/index.html` | HTML 入口。 |
| `frontend/vite.config.ts` | React 外掛與開發用 API 代理設定。 |
| `frontend/eslint.config.js` | 前端程式碼檢查規則。 |
| `frontend/tsconfig.json` | 串接前端的 TypeScript 設定檔。 |
| `frontend/tsconfig.app.json` | 瀏覽器應用程式的 TypeScript 設定。 |
| `frontend/tsconfig.node.json` | `vite.config.ts` 的 TypeScript 設定。 |
| `frontend/dist/` | 建置指令產生的瀏覽器資源。 |

### 後端檔案

| 路徑 | 用途 |
| --- | --- |
| `backend/src/` | 伺服器、API 路由、資料庫存取、示範資料產生與摩斯處理邏輯。 |
| `backend/test/` | 自動化測試與測試輔助工具。 |
| `backend/schema.sql` | 資料表、限制條件、索引與觸發器的定義。 |
| `backend/tsconfig.json` | 後端 TypeScript 編譯設定。 |
| `backend/data/` | 本機 SQLite 資料庫檔案。 |
| `backend/dist/` | 後端編譯產生的 JavaScript。 |

前後端各自擁有：

- `package.json`：依賴套件與可執行的 npm 指令。
- `package-lock.json`：安裝時使用的依賴套件版本紀錄。
- `node_modules/`：安裝後的依賴套件。

執行 npm 指令前，應先進入相應的應用程式資料夾。前端與後端分別安裝、分別啟動。

`node_modules/` 與 `dist/` 等產生出來的資料夾，不需要手動編寫其內容。

## 3. 前端技術

前端以 React + TypeScript + Vite 範本為起點。

本節將原範本 README 中有用的介紹，整理成與本專案實際設定相關的說明。

| 技術 | 在本專案中的角色 |
| --- | --- |
| React | 使用可重用的元件組成操作介面。 |
| React DOM | 將 React 元件呈現在瀏覽器中。 |
| TypeScript | 檢查型別，協助在建置前找出資料或元件輸入的型別錯誤。 |
| Vite | 提供開發伺服器，並建置前端資源。 |
| `@vitejs/plugin-react` | 將 React 開發功能（包括 Fast Refresh）整合至 Vite。 |
| CSS | 控制面板配置、顏色、間距與響應式呈現。 |
| ESLint | 依照設定的規則檢查程式碼。 |
| typescript-eslint | 提供適用於 TypeScript 的程式碼檢查支援。 |
| React Hooks 檢查外掛 | 檢查 React Hooks 的使用方式。 |
| React Refresh 檢查外掛 | 檢查與 Fast Refresh 有關的程式碼模式。 |

### Fast Refresh 與 HMR

開發時，Vite 的熱模組替換（HMR）與 React Fast Refresh，能讓許多程式修改不必整頁重新載入，就反映到畫面上。

某些修改仍需要重新載入，也不能保證每次修改都會保留介面狀態。

本專案使用 `@vitejs/plugin-react`。目前提供的設定沒有啟用替代的 SWC 外掛或 React Compiler。

原範本提到的其他選用 ESLint 擴充，也不代表本專案已經使用它們。

### 四個面板

| 面板 | 用途 |
| --- | --- |
| 燈泡（Bulbs） | 新增、重新命名、安裝、卸載及刪除符合條件的燈泡。 |
| 屋子（House） | 模擬家中燈光，並練習發送燈光訊號。 |
| 歷史（History） | 在時間軸上呈現已記錄的亮燈時段。 |
| 摩斯（Morse） | 從已記錄的訊號搜尋訊息，並提供四個練習課程。 |

介面支援英文與繁體中文。

前端說明如何發送訊號，並顯示結果；後端則負責判斷如何解讀已記錄的訊號。

## 4. 後端技術

| 技術 | 在本專案中的角色 |
| --- | --- |
| Node.js 24.x | 在瀏覽器之外執行後端。 |
| Express | 定義 HTTP API 路由，處理請求與回應。 |
| TypeScript | 檢查後端型別，並將原始碼編譯成 JavaScript。 |
| SQLite | 將展示資料儲存在本機資料庫檔案中。 |
| Node 內建 SQLite 模組 | 讓後端使用 SQLite，不需要另外啟動資料庫伺服器。 |
| `tsx` | 在開發、產生示範資料及測試時執行 TypeScript。 |
| Node 測試執行器 | 透過 `node --test` 執行自動化測試。 |
| Supertest | 對測試用應用程式檢查 HTTP API 的行為。 |

前端與後端的 `package.json` 都宣告使用 Node.js `24.x`。

後端透過 `"type": "module"` 使用 ES modules。

後端的 TypeScript 設定：

- 使用 `NodeNext` 模組設定。
- 啟用嚴格型別檢查。
- 從 `src/` 讀取應用程式原始碼。
- 將編譯後的 JavaScript 寫入 `dist/`。

## 5. 資料庫記錄什麼

資料庫包含兩個主要資料表。

| 資料表 | 內容 |
| --- | --- |
| `bulbs` | 燈泡 ID、永久序號、目前名稱與目前安裝位置。 |
| `light_sessions` | 燈泡 ID、時段開始時的位置、首次心跳時間及最近一次心跳時間。 |

燈泡的位置為 `null`，表示已登記但未安裝。

一筆亮燈時段代表一段持續觀察到燈光活動的時間。

時段記錄包含：

- `started_at`：首次心跳時間。
- `last_seen_at`：最近一次心跳時間。

資料表沒有另外儲存 `ended_at` 欄位。時間以毫秒單位的 Unix 時間戳記儲存。

### 保留有意義的歷史紀錄

資料庫結構會：

- 限制每個安裝位置只能有一顆燈泡。
- 允許多顆燈泡處於未安裝狀態。
- 防止變更已登記燈泡的序號。
- 防止刪除已被亮燈歷史紀錄引用的燈泡。

即使燈泡之後移動，歷史時段仍保留開始時記錄的位置。

摩斯訊息是在查詢時，從亮燈時段計算出來的結果，沒有另外儲存在訊息資料表中。

## 6. 前後端如何溝通

開發時，瀏覽器向以 `/api` 開頭的路徑發送 API 請求。

Vite 將這些請求轉送至：

`http://127.0.0.1:3000`

轉送前，Vite 會移除 `/api` 前綴。

例如：

| 瀏覽器請求 | 後端路由 |
| --- | --- |
| `/api/bulbs` | `/bulbs` |
| `/api/heartbeat` | `/heartbeat` |
| `/api/light-sessions` | `/light-sessions` |
| `/api/morse/check` | `/morse/check` |

### 一次典型的操作流程

1. 使用者操作虛擬燈光。
2. 燈光亮起時，前端持續發送心跳。
3. 後端驗證請求，新增或更新亮燈時段。
4. 前端請求已儲存的時段，顯示歷史紀錄。
5. 使用者搜尋摩斯訊息時，後端分析已記錄的亮燈長度與間隔。
6. 前端顯示回傳結果。

資料庫記錄基礎活動資料。時間軸與摩斯搜尋則以不同方式呈現及解讀這些活動。

### 開發與部署

Vite 代理屬於本機開發設定。

前端建置後會產生靜態瀏覽器資源，不會包含正在執行的後端或資料庫。

若要將建置後的前端部署到其他環境，仍需提供可用的後端及合適的 API 路由安排。

## 7. 開發與建置指令

下表解釋可用指令的用途，並非安裝順序。

安裝與啟動步驟請依照[使用指南（英文）](UserGuide.md)進行。

| 目錄 | 指令 | 用途 |
| --- | --- | --- |
| `frontend/` 或 `backend/` | `npm ci` | 按該應用程式的鎖定檔安裝依賴套件。 |
| `frontend/` | `npm run dev` | 啟動 Vite 開發伺服器。 |
| `frontend/` | `npm run build` | 執行 TypeScript 檢查，並建置瀏覽器資源。 |
| `frontend/` | `npm run lint` | 執行 ESLint 檢查。 |
| `frontend/` | `npm run preview` | 在本機預覽前端建置結果，不會啟動後端。 |
| `backend/` | `npm run dev` | 透過 `tsx` 執行後端，並監看檔案變動。 |
| `backend/` | `npm run typecheck` | 檢查應用程式型別，不產生 JavaScript。 |
| `backend/` | `npm test` | 先檢查測試程式的型別，再執行測試集。 |
| `backend/` | `npm run build` | 將後端 TypeScript 編譯成 JavaScript。 |
| `backend/` | `npm start` | 執行先前編譯好的後端。 |
| `backend/` | `npm run seed` | 在空資料庫中產生示範紀錄。 |

`npm start` 不會先替後端進行建置。修改後端原始碼後，若要執行編譯版本，應先重新建置。

產生示範資料是首次設定時的選用步驟，不需要每次啟動應用程式都執行。

### 不同檢查有不同用途

| 檢查 | 協助確認的事情 |
| --- | --- |
| 型別檢查 | 資料與介面是否符合宣告的型別。 |
| 程式碼規則檢查 | 程式碼是否符合設定的規則。 |
| 自動化測試 | 已測試的行為是否符合預期。 |
| 手動操作 | 完整介面與操作流程是否按照預期運作。 |

通過其中一項檢查，不代表整個應用程式的所有功能都正確。

## 8. 延伸閱讀

以下文件目前以英文撰寫：

- [使用指南（英文）](UserGuide.md)：安裝、啟動與操作說明。
- [後端開發日誌（英文）](BackendDevJournal.md)：後端設計決策、API 開發與測試過程。
- [前端開發日誌（英文）](FrontendDevJournal.md)：介面開發、版面設計決策與學習紀錄。

開發日誌記錄不同階段的過程，較早章節可能使用後來已變更的名稱或功能描述。

本簡介依據截至 2026 年 11 月 3 日提供的專案設定及實作紀錄整理，並非新一輪的執行測試報告。