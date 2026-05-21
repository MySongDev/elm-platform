<script setup>
// 纯静态演示，无需额外逻辑
</script>

<template>
  <div class="demo-wrapper">
    <!-- 案例一：文字有 flex:1 -->
    <div class="demo-card">
      <div class="demo-title">
        ✅ 文字有 <code>flex:1</code>
      </div>
      <div class="flex-container">
        <div class="icon-cart">
          🛒
        </div>
        <div class="text-flex">
          ¥40.00
        </div>
        <div class="left-edge" />
      </div>
      <div class="note">
        <strong>现象：</strong>绿色文字区域从容器<strong>左边缘</strong>开始（覆盖蓝色虚线），撑满剩余空间。<br>
        <strong>购物车的“空位”去哪了？</strong><br>
        被 <span class="highlight">flex:1</span> 分配的区域“吞并”了——不是购物车还在占位，是绿色区域扩大到覆盖了那个位置。
      </div>
    </div>

    <!-- 案例二：文字无 flex 属性 -->
    <div class="demo-card">
      <div class="demo-title">
        ❌ 文字无 <code>flex</code> 属性
      </div>
      <div class="flex-container">
        <div class="icon-cart">
          🛒
        </div>
        <div class="text-no-flex">
          ¥40.00
        </div>
        <div class="left-edge" />
      </div>
      <div class="note">
        <strong>现象：</strong>黄色文字<strong>没有</strong>从容器左边缘开始，它向右缩进了。<br>
        <strong>为什么？</strong><br>
        因为没有 <span class="highlight">flex:1</span> 给它分配“整块区域”，它只是一个普通内联级元素，由内容撑开宽度，<strong>无法覆盖购物车空出的左边区域</strong>。<br>
        <strong>购物车的“空位”在哪？</strong><br>
        就在蓝色虚线右侧、黄色文字左侧的空白处——那个位置<strong>确实被空出来了</strong>。
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.demo-wrapper {
  padding: 40px;
  font-family: system-ui, sans-serif;
  display: flex;
  gap: 30px;
  background: #fff;
}

.demo-card {
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  width: 380px;
}

.demo-title {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 15px;
}

/* Flex 容器 */
.flex-container {
  display: flex;
  align-items: center;
  border: 2px dashed #e74c3c;
  padding: 12px;
  border-radius: 8px;
  position: relative;
  background: #fafafa;
  min-height: 70px;
}

/* 绝对定位的购物车图标 */
.icon-cart {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: #ff6b6b;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 26px;
  z-index: 2;
}

/* 文字有 flex:1 */
.text-flex {
  flex: 1;
  background: #d4edda;
  padding: 12px 16px;
  border-radius: 6px;
  border: 2px solid #27ae60;
  font-weight: bold;
  text-align: center;
}

/* 文字无 flex */
.text-no-flex {
  background: #fff3cd;
  padding: 12px 16px;
  border-radius: 6px;
  border: 2px solid #f39c12;
  font-weight: bold;
  text-align: center;
}

/* 容器左边缘辅助线 */
.left-edge {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-left: 3px dotted #3498db;
  z-index: 3;
  pointer-events: none;
}

.note {
  font-size: 12px;
  color: #555;
  margin-top: 10px;
  line-height: 1.6;
}

.highlight {
  background: #ffeeba;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
