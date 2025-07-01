<script setup>
import { ref, computed } from 'vue';
import { SM4BatchUtil } from './utils/sm4.js';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import * as XLSX from 'xlsx';
import AboutDialog from './components/AboutDialog.vue';
import {
  Key,
  Lock, 
  Unlock, 
  FileText, 
  Upload, 
  Download, 
  Copy, 
  Trash2,
  Settings,
  Minus,
  HelpCircle,
  X
} from 'lucide-vue-next';

// 响应式数据
const inputText = ref('');
const outputText = ref('');
const customKey = ref('cc9368581322479ebf3e79348a2757d9');
const useCustomKey = ref(false);
const operation = ref('encrypt'); // 'encrypt' 或 'decrypt'
const isProcessing = ref(false);
const outputMode = ref('text'); // 'text' 或 'list'
const processedData = ref([]); // 存储处理后的数据列表
const showAboutDialog = ref(false); // 显示关于弹窗

// SM4 工具实例
const sm4Util = new SM4BatchUtil();

// 计算属性
const operationText = computed(() => operation.value === 'encrypt' ? '加密' : '解密');
const operationIcon = computed(() => operation.value === 'encrypt' ? Lock : Unlock);
const hasOutput = computed(() => outputMode.value === 'text' ? !!outputText.value : processedData.value.length > 0);

// 处理文本
const processText = async () => {
  if (!inputText.value.trim()) {
    alert('请输入要处理的文本');
    return;
  }

  isProcessing.value = true;

  try {
    const lines = inputText.value.split('\n').filter(line => line.trim());
    const key = useCustomKey.value ? customKey.value : null;

    let results = [];
    let processedList = [];

    for (let line of lines) {
      if (!line.trim()) continue;

      let result;
      if (operation.value === 'encrypt') {
        if (useCustomKey.value) {
          result = sm4Util.encryptWithKey(key, line);
        } else {
          result = sm4Util.encrypt(line);
        }
      } else {
        if (useCustomKey.value) {
          result = sm4Util.decryptWithKey(key, line);
        } else {
          result = sm4Util.decrypt(line);
        }
      }

      results.push(result);
      processedList.push({
        input: line,
        output: result
      });
    }

    // 更新文本输出
    outputText.value = results.join('\n');

    // 更新列表数据
    processedData.value = processedList;

  } catch (error) {
    alert(`处理失败: ${error.message}`);
  } finally {
    isProcessing.value = false;
  }
};

// 清空输入
const clearInput = () => {
  inputText.value = '';
  outputText.value = '';
  processedData.value = [];
};



// 复制输出
const copyOutput = async () => {
  let textToCopy = '';

  if (outputMode.value === 'text') {
    if (!outputText.value) {
      alert('没有可复制的内容');
      return;
    }
    textToCopy = outputText.value;
  } else {
    if (processedData.value.length === 0) {
      alert('没有可复制的内容');
      return;
    }
    // 生成CSV格式的文本
    const csvHeader = '序号,输入,输出\n';
    const csvRows = processedData.value.map((item, index) =>
        `${index + 1},"${item.input.replace(/"/g, '""')}","${item.output.replace(/"/g, '""')}"`
    ).join('\n');
    textToCopy = csvHeader + csvRows;
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    alert('已复制到剪贴板');
  } catch (error) {
    alert('复制失败');
  }
};

// 统一的文件导入函数
const importFile = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: '支持的文件',
        extensions: ['txt', 'csv', 'xlsx', 'xls']
      }]
    });

    if (selected) {
      console.log('选择的文件路径:', selected);
      const fileExtension = selected.split('.').pop().toLowerCase();

      if (fileExtension === 'txt') {
        // 处理文本文件
        const content = await readTextFile(selected);
        console.log('读取的文本文件内容:', content);
        inputText.value = content;
        alert('文本文件导入成功！');

      } else if (fileExtension === 'csv') {
        // 处理CSV文件
        const content = await readTextFile(selected);
        console.log('读取的CSV文件内容:', content);
        inputText.value = content;
        alert('CSV文件导入成功！');

      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // 处理Excel文件
        const { readBinaryFile } = await import('@tauri-apps/plugin-fs');
        const fileData = await readBinaryFile(selected);
        console.log('读取的Excel文件大小:', fileData.length);

        // 解析 Excel
        const workbook = XLSX.read(fileData, { type: 'array' });
        console.log('工作表名称:', workbook.SheetNames);

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 转换为 JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        console.log('解析的数据行数:', jsonData.length);
        console.log('前3行数据:', jsonData.slice(0, 3));

        // 将数据转换为文本，保留所有行
        const textLines = jsonData.map(row => {
          const rowArray = Array.isArray(row) ? row : [];
          return rowArray.map(cell => cell === null || cell === undefined ? '' : String(cell)).join('\t');
        }).filter(line => line.trim() !== '');

        console.log('转换后的文本行数:', textLines.length);
        inputText.value = textLines.join('\n');
        alert(`Excel文件导入成功！共读取 ${textLines.length} 行数据`);

      } else {
        alert('不支持的文件格式！请选择 TXT、CSV 或 Excel 文件。');
      }
    }
  } catch (error) {
    console.error('导入文件错误:', error);
    alert(`导入文件失败: ${error.message}`);
  }
};

// 导出结果
const exportResult = async () => {
  if (!hasOutput.value) {
    alert('没有可导出的内容');
    return;
  }

  try {
    let content = '';
    let fileName = '';

    if (outputMode.value === 'text') {
      content = outputText.value;
      fileName = `sm4_${operation.value}_result_${new Date().getTime()}.txt`;
    } else {
      // 生成CSV内容
      const csvHeader = '序号,输入,输出\n';
      const csvRows = processedData.value.map((item, index) =>
          `${index + 1},"${item.input.replace(/"/g, '""')}","${item.output.replace(/"/g, '""')}"`
      ).join('\n');
      content = csvHeader + csvRows;
      fileName = `sm4_${operation.value}_result_${new Date().getTime()}.csv`;
    }

    // 创建下载链接
    const blob = new Blob([content], { type: outputMode.value === 'text' ? 'text/plain' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`文件已导出: ${fileName}`);
  } catch (error) {
    alert(`导出失败: ${error.message}`);
  }
};

// 窗口控制函数
const minimizeWindow = async () => {
  try {
    await invoke('minimize_window');
  } catch (error) {
    console.error('最小化窗口失败:', error);
  }
};

const closeWindow = async () => {
  try {
    await invoke('close_window');
  } catch (error) {
    console.error('关闭窗口失败:', error);
  }
};
</script>

<template>
  <div class="app-container">
    <header class="custom-titlebar">
      <div class="titlebar-content">
        <div class="titlebar-left">
          <Key :size="16" class="app-icon"/>
          <span class="app-title">SM4 加密解密工具</span>
        </div>
                <div class="titlebar-controls">
          <button 
            @click="showAboutDialog = true" 
            class="titlebar-btn help-btn"
            title="关于"
          >
            <HelpCircle :size="12"/>
          </button>
          <button 
            @click="minimizeWindow" 
            class="titlebar-btn minimize-btn"
            title="最小化"
          >
            <Minus :size="12"/>
          </button>
          <button 
            @click="closeWindow" 
            class="titlebar-btn close-btn"
            title="关闭"
          >
            <X :size="12"/>
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
            <div class="content-wrapper">
        <!-- 控制面板区域 -->
        <section class="control-panel">
          <!-- 密钥设置区域 -->
          <div class="key-section">
            <div class="key-toggle">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="useCustomKey"
                  class="checkbox"
                />
                <span>使用自定义密钥</span>
              </label>
            </div>
            
            <div v-if="useCustomKey" class="key-input-group">
              <label>密钥 (32位十六进制):</label>
              <input 
                type="text" 
                v-model="customKey"
                placeholder="请输入32位十六进制密钥"
                class="key-input"
                maxlength="32"
              />
              <small class="key-hint">
                当前长度: {{ customKey.length }}/32 
                {{ customKey.length === 32 ? '✓' : '❌' }}
              </small>
            </div>
          </div>

          <!-- 工具栏 -->
          <div class="toolbar">
          <div class="toolbar-group">
            <button @click="importFile" class="tool-btn" title="导入文件 (支持 TXT、CSV、Excel)">
              <Upload :size="16"/>
              <span>导入文件</span>
            </button>

            <button
                @click="operation = 'encrypt'; processText();"
                :disabled="isProcessing || !inputText.trim()"
                class="tool-btn encrypt-btn"
                :class="{ processing: isProcessing && operation === 'encrypt' }"
                title="加密"
            >
              <Lock :size="16"/>
              <span>{{ isProcessing && operation === 'encrypt' ? '加密中...' : '加密' }}</span>
            </button>

            <button
                @click="operation = 'decrypt'; processText();"
                :disabled="isProcessing || !inputText.trim()"
                class="tool-btn decrypt-btn"
                :class="{ processing: isProcessing && operation === 'decrypt' }"
                title="解密"
            >
              <Unlock :size="16"/>
              <span>{{ isProcessing && operation === 'decrypt' ? '解密中...' : '解密' }}</span>
            </button>
          </div>

          <div class="toolbar-group">
            <div class="output-mode-toggle">
              <button
                  @click="outputMode = 'text'"
                  class="toggle-btn"
                  :class="{ active: outputMode === 'text' }"
                  title="文本模式"
              >
                <FileText :size="14"/>
                <span>文本</span>
              </button>
              <button
                  @click="outputMode = 'list'"
                  class="toggle-btn"
                  :class="{ active: outputMode === 'list' }"
                  title="列表模式"
              >
                <Settings :size="14"/>
                <span>列表</span>
              </button>
            </div>

            <button @click="exportResult" class="tool-btn" title="导出结果" :disabled="!hasOutput">
              <Download :size="16"/>
              <span>导出{{ outputMode === 'text' ? 'TXT' : 'CSV' }}</span>
            </button>

            <button @click="clearInput" class="tool-btn danger" title="清空内容">
              <Trash2 :size="16"/>
              <span>清空</span>
            </button>
                      </div>
          </div>
        </section>

        <!-- 文本处理区域 -->
        <section class="text-area-section">
          <div class="text-area-container">
            <div class="text-area-header">
              <label>输入文本:</label>
              <span class="text-count">{{ inputText.length }} 字符</span>
            </div>
            <textarea
                v-model="inputText"
                placeholder="请输入要处理的文本，支持多行输入..."
                class="text-area input-area"
            ></textarea>
          </div>



          <div class="text-area-container">
            <div class="text-area-header">
              <label>输出结果 ({{ outputMode === 'text' ? '文本模式' : '列表模式' }}):</label>
              <div class="output-controls">
              <span class="text-count">
                {{ outputMode === 'text' ? outputText.length + ' 字符' : processedData.length + ' 条记录' }}
              </span>
                <button
                    @click="copyOutput"
                    :disabled="!hasOutput"
                    class="copy-btn"
                    title="复制到剪贴板"
                >
                  <Copy :size="14"/>
                </button>
              </div>
            </div>

            <!-- 文本模式输出 -->
            <textarea
                v-if="outputMode === 'text'"
                v-model="outputText"
                placeholder="处理结果将显示在这里..."
                class="text-area output-area"
                readonly
            ></textarea>

            <!-- 列表模式输出 -->
            <div v-else class="output-list-container">
              <div class="output-list-header">
                <div class="list-col-index">序号</div>
                <div class="list-col-input">输入</div>
                <div class="list-col-output">输出</div>
              </div>
              <div class="output-list-body">
                <div
                    v-for="(item, index) in processedData"
                    :key="index"
                    class="output-list-row"
                >
                  <div class="list-col-index">{{ index + 1 }}</div>
                  <div class="list-col-input" :title="item.input">{{ item.input }}</div>
                  <div class="list-col-output" :title="item.output">{{ item.output }}</div>
                </div>
                <div v-if="processedData.length === 0" class="empty-list">
                  暂无处理结果
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 关于弹窗 -->
    <AboutDialog :show="showAboutDialog" @close="showAboutDialog = false" />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  background-color: #f1f1f1;
}
</style>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f1f1f1;
  color: #1c1c1c;
}

/* 自定义标题栏 */
.custom-titlebar {
  height: 50px;
  background-color: #f1f1f1;
  -webkit-app-region: drag;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 0 24px;
}

.titlebar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-icon {
  color: #0078d4;
}

.app-title {
  font-size: 14px;
  font-weight: 500;
  color: #1c1c1c;
}

.titlebar-controls {
  display: flex;
  height: 50px;
  -webkit-app-region: no-drag;
}

.titlebar-btn {
  width: 46px;
  height: 50px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  color: #1c1c1c;
  transition: background-color 0.1s ease;
}

.titlebar-btn:hover {
  background-color: #ffffff;
}

.close-btn:hover {
  background-color: #e81123;
  color: white;
}

.help-btn:hover {
  background-color: #e6e6e6;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
  background-color: #f1f1f1;
}

/* 内容包装器 */
.content-wrapper {
  width: 100%;
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
}

/* 控制面板区域 */
.control-panel {
  background-color: #f1f1f1;
  border-bottom: 1px solid #e0e0e0;
  -webkit-app-region: drag;
  user-select: none;
}

/* 密钥设置区域 */
.key-section {
  padding: 16px 24px 0px 24px;
}

.key-section .key-input,
.key-section .checkbox {
  -webkit-app-region: no-drag;
  user-select: auto;
}

.key-toggle {
  margin-bottom: 16px;
  -webkit-app-region: drag;
  user-select: none;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: default;
  font-weight: 400;
  font-size: 14px;
  color: #1c1c1c;
  width: fit-content;
}

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: #0078d4;
  cursor: default;
}

.key-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 2px;
  -webkit-app-region: drag;
  user-select: none;
}

.key-input-group label {
  font-size: 12px;
  font-weight: 600;
  color: #1c1c1c;
  margin-bottom: 4px;
}

.key-input {
  padding: 8px 12px;
  border: 1px solid #d1d1d1;
  border-radius: 2px;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  background-color: #ffffff;
  color: #1c1c1c;
  transition: border-color 0.1s ease;
}

.key-input:focus {
  outline: none;
  border-color: #0078d4;
  box-shadow: 0 0 0 1px #0078d4;
}

.key-hint {
  font-size: 12px;
  color: #6b6b6b;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}

.toolbar * {
  -webkit-app-region: no-drag;
  user-select: auto;
}

.toolbar-group {
  display: flex;
  gap: 8px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #f9f9f9;
  border: 1px solid #d1d1d1;
  border-radius: 2px;
  font-size: 13px;
  font-weight: 400;
  cursor: default;
  transition: all 0.1s ease;
  color: #1c1c1c;
}

.tool-btn:hover {
  background-color: #e6e6e6;
  border-color: #b8b8b8;
}

.tool-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tool-btn.danger {
  color: #d13438;
}

.tool-btn.danger:hover {
  background-color: #fdf2f2;
  border-color: #d13438;
}

.tool-btn.encrypt-btn {
  background-color: #0078d4;
  color: white;
  border-color: #0078d4;
}

.tool-btn.encrypt-btn:hover:not(:disabled) {
  background-color: #106ebe;
  border-color: #106ebe;
}

.tool-btn.decrypt-btn {
  background-color: #107c10;
  color: white;
  border-color: #107c10;
}

.tool-btn.decrypt-btn:hover:not(:disabled) {
  background-color: #0e6e0e;
  border-color: #0e6e0e;
}

.tool-btn.active {
  background-color: #0078d4;
  color: white;
  border-color: #0078d4;
}

.tool-btn.active:hover {
  background-color: #106ebe;
  border-color: #106ebe;
}

/* 输出模式切换按钮 */
.output-mode-toggle {
  display: flex;
  border-radius: 2px;
  overflow: hidden;
  background-color: #f9f9f9;
  border: 1px solid #d1d1d1;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: transparent;
  border: none;
  font-size: 12px;
  font-weight: 400;
  cursor: default;
  transition: all 0.1s ease;
  color: #1c1c1c;
}

.toggle-btn:first-child {
  border-right: 1px solid #d1d1d1;
}

.toggle-btn.active {
  background-color: #0078d4;
  color: white;
}

.toggle-btn:hover:not(.active) {
  background-color: #e6e6e6;
}

/* 文本区域 */
.text-area-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-height: 0;
  background-color: #f9f9f9;
  overflow: hidden;
}

.text-area-container {
  background-color: #ffffff;
  padding: 10px 24px 20px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.text-area-container:not(:last-child) {
}

.text-area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
}

.text-area-header label {
  font-size: 14px;
  font-weight: 600;
  color: #1c1c1c;
}

.text-count {
  font-size: 12px;
  color: #6b6b6b;
}

.output-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: #f9f9f9;
  border: 1px solid #d1d1d1;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 400;
  cursor: default;
  transition: all 0.1s ease;
  color: #1c1c1c;
}

.copy-btn:hover:not(:disabled) {
  background-color: #e6e6e6;
  border-color: #b8b8b8;
}

.copy-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.text-area {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d1d1;
  border-radius: 2px;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.5;
  resize: none;
  transition: border-color 0.1s ease;
  box-sizing: border-box;
  flex: 1;
  min-height: 100px;
  background-color: #ffffff;
  color: #1c1c1c;
}

.text-area:focus {
  outline: none;
  border-color: #0078d4;
  box-shadow: 0 0 0 1px #0078d4;
}

.input-area {
  background-color: #ffffff;
}

.output-area {
  background-color: #f9f9f9;
  color: #1c1c1c;
}

/* 列表输出样式 */
.output-list-container {
  border: 1px solid #d1d1d1;
  border-radius: 2px;
  background-color: #ffffff;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100px;
  overflow: hidden;
}

.output-list-header {
  display: flex;
  background-color: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  padding: 8px 0;
  font-size: 12px;
  color: #1c1c1c;
}

.output-list-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.output-list-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 0;
  transition: background-color 0.1s ease;
}

.output-list-row:last-child {
  border-bottom: none;
}

.output-list-row:hover {
  background-color: #f0f9ff;
}

.output-list-row:nth-child(even) {
  background-color: #fafafa;
}

.list-col-index {
  width: 50px;
  text-align: center;
  padding: 0 8px;
  flex-shrink: 0;
  font-size: 12px;
  color: #6b6b6b;
  font-weight: 600;
}

.list-col-input,
.list-col-output {
  flex: 1;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #1c1c1c;
}

.empty-list {
  text-align: center;
  padding: 40px 20px;
  color: #6b6b6b;
  font-style: italic;
  font-size: 13px;
}
</style> 