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
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.demo-wrapper {
  display: flex;
  gap: 30px;
  padding: 40px;
  font-family: system-ui, sans-serif;
  background: #fff;
}

.demo-card {
  width: 380px;
  padding: 20px;
  border: 2px solid #ddd;
  border-radius: 12px;
}

.demo-title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
}

/* Flex 容器 */
.flex-container {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 70px;
  padding: 12px;
  background: #fafafa;
  border: 2px dashed #e74c3c;
  border-radius: 8px;
}

/* 绝对定位的购物车图标 */
.icon-cart {
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  font-size: 26px;
  color: white;
  background: #ff6b6b;
  border-radius: 12px;
  transform: translateY(-50%);
}

/* 文字有 flex:1 */
.text-flex {
  flex: 1;
  padding: 12px 16px;
  font-weight: bold;
  text-align: center;
  background: #d4edda;
  border: 2px solid #27ae60;
  border-radius: 6px;
}

/* 文字无 flex */
.text-no-flex {
  padding: 12px 16px;
  font-weight: bold;
  text-align: center;
  background: #fff3cd;
  border: 2px solid #f39c12;
  border-radius: 6px;
}

/* 容器左边缘辅助线 */
.left-edge {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  pointer-events: none;
  border-left: 3px dotted #3498db;
}

.note {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: #555;
}

.highlight {
  padding: 2px 6px;
  font-family: monospace;
  background: #ffeeba;
  border-radius: 4px;
}
</style>
