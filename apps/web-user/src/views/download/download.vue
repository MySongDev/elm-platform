<script setup>
import { showAlert } from '@/components/common//AlterTip'
import { getDeviceInfo } from '@/untils/device-detector'

defineOptions({
  name: 'DownLoad',
})

async function downLoadApp() {
  if (getDeviceInfo().os === 'ios' || getDeviceInfo().os === 'mac') {
    return showAlert(`IOS用户请前往AppStore下载`)
  }
  else {
    try {
      const elemIF = document.createElement('iframe')

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
  font-size: 19px;
  line-height: 50px;
  color: #666;
  text-align: center;
}

.download-btn {
  display: block;
  width: 100%;
  margin-top: 10px;
  line-height: 40px;
  color: $ff;
  background: #4cd964;
  border-radius: 8px;
}
</style>
