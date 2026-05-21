<script setup>
import { showAlert } from '@/components/common//AlterTip'
import { getDeviceInfo } from '@/untils/device-detector'

defineOptions({
  name: 'DownLoad',
})
console.log(getDeviceInfo())
console.log(navigator)
console.log(window.screen)
/**
 * 检查URL是否可访问
 * @param {string} url - 要检查的URL
 * @returns {Promise<boolean>} - 是否可访问
 */
// 检查链接是否可用
/* async function checkUrlAccessible(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // 尝试绕过CORS限制
      cache: 'no-cache'
    });
    // 关键修改：检查响应状态码
    if (response.ok) { // 200-299 状态码
      console.log('链接可访问，状态码:', response.status);
      return true;
    } else {
      console.log(`链接不可访问，状态码: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('URL检查失败:', error);
    return false;
  }
} */

async function downLoadApp() {
  // console.log(getDeviceInfo().os === 'mac' || 'ios');

  if (getDeviceInfo().os === 'ios' || getDeviceInfo().os === 'mac') {
    return showAlert(`IOS用户请前往AppStore下载`)
  }
  else {
    try {
      const elemIF = document.createElement('iframe')
      // console.log(await checkUrlAccessible('https://github.com/bia-pain-bache/BPB-Worker-Panel/releases/download/v4.1.3/worker.js'));

      elemIF.src = 'http://cangdu.org/files/elm.apk'
      elemIF.style.display = 'none'
      document.body.appendChild(elemIF)
    }
    catch {
      // alert(e)
    }
  }
}
</script>

<template>
  <div>
    <head-top />

    <div class="download-content">
      <SvgIcon icon-name="eleme" icon-class="download-svg" />
      <h4 class="download-sapn">
        下载饿了么APP
      </h4>
      <button class="download-btn" @click="downLoadApp">
        下载
      </button>
    </div>
    <!-- <alert-tip :alert-text="alertText" @close-alert="closeAlert"></alert-tip> -->
  </div>
</template>

<style lang="scss" scoped>
.download-content {
  padding: 0 10px;
  margin: 0 auto;
}

.download-svg {
  width: 100%;
  height: 200px;
  margin-top: 15px;
}

.download-sapn {
  display: block;
  width: 100%;
  line-height: 50px;
  text-align: center;
  font-size: 19px;
  color: #666;
}

.download-btn {
  width: 100%;
  display: block;
  background: #4cd964;
  margin-top: 10px;
  border-radius: 8px;
  color: $ff;
  line-height: 40px;
}
</style>
