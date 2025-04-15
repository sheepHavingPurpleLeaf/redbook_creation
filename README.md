# 小红书文案生成器

这是一个为商家自动生成小红书文案的网页应用。商家上传商品的介绍及文案要求（brief 文件），以及一些商品的图片，系统会根据小红书审核要求和商家 brief 文件调用大模型生成小红书图文帖子。

## 功能特点

- 商品介绍文档（Brief）上传
- 商品图片上传（最多9张）
- 自动生成符合小红书平台审核要求的文案
- 支持文案预览、复制和下载
- 响应式设计，适应不同设备

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios

## 本地开发

### 前提条件

- Node.js 18.x 或更高版本
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或者
yarn install
```

### 环境变量配置

在项目根目录创建 `.env.local` 文件，添加以下环境变量：

```
VOLCANO_ENGINE_API_URL=https://your-llm-api-url.com
VOLCANO_ENGINE_API_KEY=your-api-key
```

### 运行开发服务器

```bash
npm run dev
# 或者
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 部署到阿里云 Ubuntu 服务器

### 系统要求

- Ubuntu 20.04 LTS 或更高版本
- Node.js 18.x 或更高版本
- PM2 (用于进程管理)
- Nginx (用于反向代理)

### 部署步骤

1. **安装 Node.js 和 npm**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

2. **安装 PM2**

```bash
sudo npm install -g pm2
```

3. **安装 Nginx**

```bash
sudo apt update
sudo apt install -y nginx
```

4. **克隆代码仓库**

```bash
git clone <your-repository-url>
cd <repository-directory>
```

5. **安装项目依赖**

```bash
npm install
```

6. **创建环境变量文件**

```bash
cat > .env.local << EOF
VOLCANO_ENGINE_API_URL=https://your-llm-api-url.com
VOLCANO_ENGINE_API_KEY=your-api-key
EOF
```

7. **构建项目**

```bash
npm run build
```

8. **配置 PM2**

创建 `ecosystem.config.js` 文件：

```bash
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'redbook-content-generator',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
};
EOF
```

启动应用：

```bash
pm2 start ecosystem.config.js
```

9. **配置 Nginx**

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/redbook-content-generator
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 替换为你的域名或服务器IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 增加对上传文件的支持
    client_max_body_size 10M;
}
```

启用站点并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/redbook-content-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

10. **设置自启动**

```bash
pm2 startup
pm2 save
```

现在应用应该已经部署成功，可以通过你的域名或服务器 IP 访问。

## 文件结构

```
redbook-content-generator/
├── app/                    # Next.js 应用代码
│   ├── api/                # API 路由
│   │   ├── generate/       # 生成内容的API
│   │   └── images/         # 图片服务API
│   │   
│   ├── components/         # React 组件
│   │   ├── ContentPreview.tsx  # 内容预览组件
│   │   └── UploadForm.tsx      # 上传表单组件
│   │   
│   ├── styles/             # 样式文件
│   │   └── globals.css     # 全局样式
│   │   
│   ├── utils/              # 工具函数
│   │   └── types.ts        # TypeScript 类型定义
│   │   
│   ├── layout.tsx          # 布局组件
│   └── page.tsx            # 主页组件
├── public/                 # 静态资源
│   └── docs/               # 文档资源
│       └── review_requirements.txt  # 小红书审核要求
├── tmp/                    # 临时文件目录 (运行时创建)
├── next.config.js          # Next.js 配置
├── package.json            # 项目依赖
├── postcss.config.js       # PostCSS 配置
├── tailwind.config.js      # Tailwind CSS 配置
└── tsconfig.json           # TypeScript 配置
```

## 大模型切换

目前系统使用火山引擎上部署的大模型。如需切换到其他模型，请修改 `app/api/generate/route.ts` 文件中的 `generateContent` 函数，根据新模型的 API 要求调整请求参数和响应处理逻辑。 