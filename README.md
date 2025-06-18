# AI 内容编织应用 (AI Content Weaver)

本应用是一个基于 AI 的内容创作助手，旨在帮助用户将输入的文字、图片、代码片段等内容，通过大型语言模型 (LLM) 的理解和重新编排能力，转换成一份高质量、可对外发布的文章，并提供网页预览功能。

## 功能特性

*   **多模态输入**: 支持用户输入文字、图片链接和代码片段，并能按顺序组合。
*   **LLM 驱动的内容生成**: 利用 LLM 理解输入内容，并将其整理、编排成连贯的文章。
*   **灵活的 LLM 选择**: 支持多种 LLM 提供商和模型的选择（当前通过硬编码列表实现，未来可扩展）。
*   **模型能力提示**: 根据用户输入内容（如是否包含图片）和所选模型的具体能力，给出相应的建议和警告。
*   **文章预览**: 生成 Markdown 格式的文章内容和基础的 HTML 网页预览。
*   **现代化的技术栈**: 后端采用 Python (FastAPI)，前��采用 JavaScript (React + Vite)，样式使用 Tailwind CSS。

## 项目结构

```
agent-app/
├── backend/                  # FastAPI 后端应用
│   ├── .venv/                # Python 虚拟环境 (由 uv 创建)
│   ├── llm_providers/        # LLM 提供商集成模块
│   │   ├── __init__.py
│   │   ├── base_llm.py       # LLM 提供商基类接口
│   │   └── google_gemini_llm.py # Gemini LLM 实现
│   ├── __init__.py
│   ├── main.py               # FastAPI 应用主文件，包含 API 端点
│   └── schemas.py            # Pydantic 数据模型
├── frontend/                 # React 前端应用
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/       # React 组件
│   │   │   ├── ContentBlockInput.jsx
│   │   │   └── LLMSelector.jsx
│   │   ├── App.css           # App 特定样式 (Vite 默认)
│   │   ├── App.jsx           # 主应用组件
│   │   ├── index.css         # Tailwind CSS 指令和全局样式
│   │   └── main.jsx          # React 应用入口
│   ├── .eslintignore
│   ├── .eslintrc.cjs
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js     # PostCSS 配置文件 (Tailwind)
│   ├── tailwind.config.js    # Tailwind CSS 配置文件
│   └── vite.config.js        # Vite 配置文件
├── README.md                 # 本文件
├── 需求整理.md              # 需求文档
└── 代码架构设计.md            # 代码架构设计文档
```

## 技术选型

*   **后端**:
    *   Python 3.11+
    *   FastAPI: 高性能 Web 框架
    *   Uvicorn: ASGI 服务器
    *   `uv`: 快速的 Python 包安装和虚拟环境管理工具
    *   Pydantic: 数据验证和模型定义
    *   `google-generativeai`: Google Gemini API SDK
    *   `httpx`: HTTP 客户端，用于异步获取图片
    *   `Pillow`: 图像处理库
    *   `markdown-it-py`: Markdown 到 HTML 转换库
*   **前端**:
    *   Node.js (LTS 版本推荐)
    *   npm (Node 包管理器)
    *   React 18+ (使用 Vite 初始化)
    *   Vite: 下一代前端构建工具
    *   Tailwind CSS: 工具优先的 CSS 框架
*   **LLM**:
    *   Google Gemini API (已集成)
    *   (未来可扩展 Anthropic Claude API, OpenAI GPT API等)

## 本地运行

### 1. 环境准备

*   **安装 Python**: 确保已安装 Python 3.11 或更高版本。
*   **安装 `uv`**: 如果尚未安装 `uv`，请参照其官方文档进行安装：[https://github.com/astral-sh/uv](https://github.com/astral-sh/uv)
    ```bash
    # 示例 (macOS/Linux 使用 curl)
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```
*   **安装 Node.js 和 npm**: 确保已安装 Node.js (推荐 LTS 版本) 和 npm。可以从 [https://nodejs.org/](https://nodejs.org/) 下载。
*   **Google API 密钥**: 获取一个 Google API 密钥，并授权其使用 Generative Language API (Gemini)。

### 2. 后端运行

```bash
# 1. 克隆项目 (如果尚未克隆)
# git clone <repository_url>
# cd agent-app

# 2. 进入后端目录
cd backend

# 3. 设置 Google API 密钥 (重要!)
#    在运行后端服务之前，确保您已经设置了 GOOGLE_API_KEY 环境变量。
#    例如，在您的 shell 中 (将 "您的真实API密钥" 替换为实际密钥):
export GOOGLE_API_KEY="您的真实API密钥"

# 4. 使用 uv 创建虚拟环境并安装依赖
uv venv  # 创建 .venv 虚拟环境
# 如果是首次设置或依赖有变动，请安装/更新依赖：
uv pip install fastapi uvicorn[standard] google-generativeai httpx Pillow markdown-it-py

# 5. 运行 FastAPI 开发服务器 (在 backend/ 目录下)
uv run uvicorn main:app --reload --port 8000
```
后端服务将在 `http://127.0.0.1:8000` 上运行。

**注意**:
*   `uv run` 会自动使用当前目录下的 `.venv` 环境。
*   您也可以创建一个 `backend/requirements.txt` 文件来管理依赖:
    ```txt
    fastapi
    uvicorn[standard]
    google-generativeai
    httpx
    Pillow
    markdown-it-py
    # anthropic # 示例：未来可添加
    # openai    # 示例：未来可添加
    ```
    然后使用 `uv pip install -r requirements.txt` 安装。

### 3. 前端运行

```bash
# 1. (如果不在项目根目录) 返回到项目根目录，然后进入前端目录
# cd .. (如果当前在 backend/)
cd frontend

# 2. 安装 npm 依赖
npm install

# 3. 运行 Vite 开发服务器
npm run dev
```
前端开发服务器通常会在 `http://localhost:5173` (或其他可用端口) 上运行。请查看终端输出的 URL。

### 4. 为前端 API 请求配置代理 (重要)

为了避免在开发过程中出现 CORS 问题，Vite 允许配置代理。我们已在 `frontend/vite.config.js` 文件中添加了 `server.proxy` 配置，将 `/api` 请求代理到后端服务 (`http://localhost:8000`)。

```javascript
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // 您的后端地址
        changeOrigin: true,
        // 可选：如果您的后端 API 没有以 /api 开头，可能需要重写路径
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})
```
此配置对于本地开发至关重要，它能避免浏览器因 CORS策略 (跨源资源共享) 阻止前端 (如 `http://localhost:5173`) 调用不同源的后端 API (如 `http://localhost:8000`)。前端 `fetch('/api/v1/generate')` 和 `fetch('/api/v1/llms')` 之类的请求将自动被代理到 `http://localhost:8000/api/...`。

## 如何使用

1.  **启动后端和前端开发服务器** (如上所述)。确保 `GOOGLE_API_KEY` 已在后端环境设置。
2.  在浏览器中打开前端应用的 URL (通常是 `http://localhost:5173`)。
3.  **选择 AI 模型**:
    *   使用页面顶部的下拉菜单选择一个“Provider”（当前主要是 "Google" 或 "Gemini"）。
    *   然后选择一个该提供商下的具体“Model”（如 "gemini-1.5-flash-latest"）。
    *   选择模型后，会显示该模型的一些能力（如是否支持图片）和相关提示。如果您的输入内容（例如包含图片）与所选模型能力不符，系统会给出警告。
4.  **添加内容块**:
    *   点击 "Add Text Block", "Add Code Block", 或 "Add Image Block" 按钮来创建不同类型的内容输入区域。
    *   **Text Block**: 输入任意文字内容。
    *   **Code Block**: 选择代码语言，输入代码片段，并可以添加可选的说明文字。
    *   **Image Block**: 输入图片的有效公开 URL，并可以添加���选的替代文本 (alt text) 和说明文字。
    *   您可以添加多个内容块，它们将按照添加顺序排列。
    *   每个内容块都可以单独移除。
5.  **生成文章**:
    *   当您添加完所有内容块并选好 AI 模型后，点击 "Weave My Article!" 按钮。
    *   应用将向后端 `/api/v1/generate` 端点发送真实请求。后端会调用所选的 LLM 服务 (当前为 Google Gemini) 进行内容生成，然后将结果返回前端进行展示。
6.  **查看结果**:
    *   生成的文章标题、Markdown 和 HTML 预览将显示在页面下方。

## 部署

部署此应用涉及部署后端 FastAPI 服务和前端 React 静态文件。

### 1. 后端部署

*   可以使用 Docker 将 FastAPI 应用容器化。
*   部署到支持 Python ASGI 应用的平台，如：
    *   云服务商的容器服务 (AWS ECS, Google Cloud Run, Azure Container Instances)。
    *   PaaS 平台 (Heroku, Render, Vercel Serverless Functions - 可能需要适配器)。
    *   传统的 VPS，配合 Gunicorn + Uvicorn (或仅 Uvicorn) 和 Nginx/Caddy 等反向代理。
*   **环境变量**: 确保为 `GOOGLE_API_KEY` 等敏感信息在部署环境中配置环境变量。

### 2. 前端部署

*   运行 `npm run build` 在 `frontend/dist` 目录下生成生产环境的静态文件 (HTML, CSS, JS)。
*   将 `dist` 目录的内容部署到任何静态文件托管服务，如：
    *   Vercel
    *   Netlify
    *   AWS S3 + CloudFront
    *   GitHub Pages
    *   传统的 Web 服务器 (Nginx, Apache)
*   **API 集成**: 确保前端应用可以访问到部署的后端 API。这可能需要配置：
    *   前端构建时的 API 基础 URL (通过环境变量)。
    *   反向代理将 `/api` 请求路由到后端服务 (如果部署在同一域名下)。
    *   CORS 配置 (如果前端和后端部署在不同域名下)。

## 未来扩展方向

*   **支持更多 LLM 提供商**: 如 Anthropic Claude, OpenAI GPT 等。
*   **用户认证与授权**: 保护 API，管理用户数据。
*   **数据库集成**: 保存用户输入、生成的文章、用户偏好等。
*   **更丰富的编辑器**: 为文本输入提供所见即所得 (WYSIWYG) 编辑器或 Markdown 实时预览。
*   **图片直接上传**: 而不仅仅是 URL 输入。
*   **高��输出选项**: 如导出为 PDF, DOCX 等。
*   **更完善的错误处理和日志记录**: 在前后两端。
*   **国际化 (i18n)**: 支持多语言界面。
*   **流式响应 (Streaming)**: 对于较长的文章生成，可以逐步显示内容，提升用户体验。
