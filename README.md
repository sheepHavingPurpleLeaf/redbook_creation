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
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装 Node.js 和 npm
sudo apt install -y nodejs

# 验证安装
node -v  # 应显示 v18.x.x
npm -v   # 验证 npm 版本
```

2. **安装 PM2**

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

3. **安装 Nginx**

```bash
sudo apt update
sudo apt install -y nginx

# 启动 Nginx 并设置为开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证 Nginx 状态
sudo systemctl status nginx
```

4. **创建应用目录并克隆代码仓库**

```bash
# 创建应用目录
sudo mkdir -p /var/www/redbook-generator
sudo chown -R $USER:$USER /var/www/redbook-generator

# 克隆代码仓库
git clone <your-repository-url> /var/www/redbook-generator
cd /var/www/redbook-generator
```

5. **安装项目依赖**

```bash
# 安装依赖
npm install --production

# 如果遇到权限问题，可以使用
# sudo npm install --production --unsafe-perm
```

6. **配置环境变量**

```bash
# 创建环境变量文件
cat > .env.local << EOF
VOLCANO_ENGINE_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
VOLCANO_ENGINE_API_KEY=your-api-key
VOLCANO_MODEL_ID=ep-20250302190857-bwfd8
EOF

# 设置适当的权限
chmod 600 .env.local
```

7. **创建临时文件夹并设置权限**

```bash
# 创建临时文件夹
mkdir -p tmp
chmod 777 tmp
```

8. **构建项目**

```bash
# 构建生产版本
npm run build
```

9. **配置 PM2**

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'redbook-generator',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status
```

10. **配置 Nginx**

```bash
# 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/redbook-generator
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 替换为你的域名或服务器IP

    access_log /var/log/nginx/redbook-generator-access.log;
    error_log /var/log/nginx/redbook-generator-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 增加对上传文件的支持
    client_max_body_size 20M;
    
    # 设置缓存规则（可选）
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

启用站点并重启 Nginx：

```bash
# 创建配置软连接
sudo ln -s /etc/nginx/sites-available/redbook-generator /etc/nginx/sites-enabled/

# 检查 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

11. **设置 PM2 自启动**

```bash
# 生成自启动脚本
pm2 startup ubuntu

# 保存当前进程列表
pm2 save
```

12. **配置防火墙（可选）**

```bash
# 安装 UFW
sudo apt install -y ufw

# 允许 SSH、HTTP 和 HTTPS 连接
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# 启用防火墙
sudo ufw enable

# 检查状态
sudo ufw status
```

13. **设置 HTTPS（可选，推荐）**

使用 Let's Encrypt 安装免费的 SSL 证书：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取并安装证书
sudo certbot --nginx -d yourdomain.com

# 证书会自动更新，可以测试自动更新流程
sudo certbot renew --dry-run
```

14. **监控和日志**

```bash
# 查看应用日志
pm2 logs redbook-generator

# 监控应用
pm2 monit

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/redbook-generator-access.log

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/redbook-generator-error.log
```

15. **应用更新流程**

```bash
# 进入应用目录
cd /var/www/redbook-generator

# 拉取最新代码
git pull

# 安装依赖（如有变更）
npm install --production

# 构建应用
npm run build

# 重启应用
pm2 restart redbook-generator

# 保存 PM2 进程列表
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

## 部署常见问题

### 文件名编码问题

在 Linux 系统上，如果遇到中文文件名编码错误（例如构建时出现 `Cannot convert argument to a ByteString because the character has a value greater than 255` 错误），请执行以下操作：

1. 确保所有文件名使用英文命名，特别是 `public` 目录下的模板文件

```bash
# 重命名带有中文名称的文件
cd public
mv "xx品牌KOC达人brief表.xlsx" "brief_template.xlsx"

# 记得同时更新代码中引用这些文件的地方
```

2. 修改相关代码，在 `app/api/download-template/route.ts` 和 `app/api/read-brief-excel/route.ts` 中更新文件路径引用

3. 确保系统环境变量设置正确的语言和编码：

```bash
# 添加到 .bashrc 或 .zshrc
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

### 临时文件和权限问题

如果遇到文件权限或访问问题：

1. 确保临时目录存在并有足够权限：

```bash
# 创建临时目录并设置权限
mkdir -p /var/www/redbook-generator/tmp
chmod 777 /var/www/redbook-generator/tmp
```

2. 确保 Node.js 进程有权限访问应用目录：

```bash
# 设置目录所有权
sudo chown -R www-data:www-data /var/www/redbook-generator
# 或者将当前用户添加到www-data组
sudo usermod -a -G www-data $USER
```

### 构建过程中的内存问题

如果在构建过程中遇到内存不足问题：

```bash
# 增加 Node.js 可用内存
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### PM2 环境变量问题

确保 PM2 能正确加载环境变量：

```bash
# 使用 ecosystem.config.js 设置环境变量
module.exports = {
  apps: [{
    name: 'redbook-generator',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      VOLCANO_ENGINE_API_URL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      VOLCANO_ENGINE_API_KEY: 'your-api-key',
      VOLCANO_MODEL_ID: 'ep-20250302190857-bwfd8'
    }
  }]
}
```

这样即使 `.env.local` 文件不可访问，应用也能正常运行。 