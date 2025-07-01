<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="about-dialog" @click.stop>
      <div class="about-header">
        <div class="about-icon">
          <Key :size="32" />
        </div>
        <h3>SM4 加密解密工具 (sm4-tool)</h3>
        <button @click="$emit('close')" class="close-dialog-btn">
          <X :size="16" />
        </button>
      </div>
      <div class="about-content" v-html="aboutContent"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Key, X } from 'lucide-vue-next';
import MarkdownIt from 'markdown-it';
import aboutMarkdown from '../about.md?raw';

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['close']);

// 数据
const aboutContent = ref('');

// Markdown解析器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// ESC键关闭弹窗
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.show) {
    emit('close');
  }
};

// 组件挂载
onMounted(() => {
  aboutContent.value = md.render(aboutMarkdown);
  window.addEventListener('keydown', handleKeydown);
});

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* 关于弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.about-dialog {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.about-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.about-icon {
  color: #0078d4;
}

.close-dialog-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  color: #1c1c1c;
  transition: background-color 0.1s ease;
}

.close-dialog-btn:hover {
  background-color: #f0f0f0;
}

.about-content {
  padding: 24px;
  overflow-y: auto;
  max-height: 60vh;
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  line-height: 1.6;
}

.about-content :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  color: #1c1c1c;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.about-content :deep(h2) {
  font-size: 16px;
  font-weight: 600;
  color: #1c1c1c;
  margin: 24px 0 12px 0;
}

.about-content :deep(p) {
  margin: 0 0 12px 0;
  color: #4a5568;
  font-size: 14px;
}

.about-content :deep(strong) {
  color: #1c1c1c;
  font-weight: 600;
}

.about-content :deep(ul) {
  margin: 12px 0;
  padding-left: 20px;
}

.about-content :deep(li) {
  margin: 8px 0;
  color: #4a5568;
  font-size: 14px;
}

.about-content :deep(hr) {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 20px 0;
}

.about-content :deep(a) {
  color: #0078d4;
  text-decoration: none;
  font-weight: 500;
}

.about-content :deep(a:hover) {
  text-decoration: underline;
}

.about-content :deep(code) {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}
</style> 