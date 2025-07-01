# SM4 加密解密工具

![img.png](https://github.com/noNu1L/sm4-tool/blob/master/document/img.png?raw=true)

基于国密 SM4 算法的桌面加密解密工具，使用 Tauri + Vue.js 开发。

## 功能特性

- **SM4 加密/解密**: 支持标准的国密 SM4 算法
- **批量处理**: 支持多行文本的批量加密解密
- **自定义密钥**: 支持使用自定义 32 位十六进制密钥
- **文件导入**: 支持导入 TXT、CSV、Excel 文件
- **结果导出**: 支持导出处理结果为 TXT 或 CSV 文件
- **防重复**: 自动检测防止重复加密

## 使用说明

### 基本操作
1. 输入要处理的文本或导入文件
2. 选择使用默认密钥或自定义密钥
3. 点击"加密"或"解密"按钮
4. 复制结果或导出文件

### 支持的文件格式
- TXT 文本文件
- CSV 逗号分隔文件
- Excel 文件 (.xlsx/.xls)

## 技术实现

### 前端
- Vue.js 3
- Vite
- XLSX (Excel处理)

### 后端
- Tauri
- Rust

### 算法
- SM4 ECB 模式
- PKCS7 填充
- 纯 JavaScript 实现

## 开发运行

### 环境要求
- Node.js 16+  
- Rust 1.70+

### 开发命令
```bash
# 安装依赖
npm install

# 开发模式
npm run tauri-dev

# 构建应用
npm run package
```

### 项目结构
```
sm4-tool/
├── src/                # Vue.js 前端
│   ├── components/     # 组件
│   ├── utils/sm4.js   # SM4算法实现
│   └── App.vue        # 主组件
├── src-tauri/         # Tauri后端
│   └── src/           # Rust源码
└── package.json       # 项目配置
```

## 安全说明

- **默认密钥**: `cc9368581322479ebf3e79348a2757d9` (仅供测试)
- **生产环境**: 请使用自定义密钥
- **本地处理**: 所有操作在本地执行，不上传数据
- **密钥保管**: 请妥善保管自定义密钥

## 许可证

MIT License - 仅供学习研究使用 
