<script setup>
defineProps({
  alertText: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

function closeAlert() {
  emit('close')
}
</script>

<template>
  <div v-if="alertText" class="alet_container">
    <section class="tip_text_container">
      <div class="tip_icon">
        <span />
        <span />
      </div>
      <p class="tip_text">
        {{ alertText }}
      </p>
      <div class="confrim" @click="closeAlert">
        确认
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@keyframes tipMove {
  0% {
    transform: scale(1);
  }

  35% {
    transform: scale(0.8);
  }

  70% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
}

.alet_container {
  position: fixed;
  inset: 0;
  z-index: 200;
}

.tip_text_container {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -37.5vw 0 0 -37.5vw;
  width: 75vw;
  animation: tipMove 0.4s;
  background-color: rgba(255, 255, 255, 1);
  border: 0.2667vw;
  padding-top: 3.75vw;
  @include flex-center();
  flex-direction: column;
  border: 0.2667vw;
  border-radius: 1.5625vw;

  .tip_icon {
    @include wh(18.75vw, 18.75vw);
    border: 0.9375vw solid #f8cb86;
    border-radius: 50%;
    @include flex-center();
    flex-direction: column;

    span:nth-of-type(1) {
      @include wh(0.75vw, 9.375vw);
      background-color: #f8cb86;
    }

    span:nth-of-type(2) {
      @include wh(1.25vw, 1.25vw);
      border: 0.2667vw;
      border-radius: 50%;
      margin-top: 1.25vw;
      background-color: #f8cb86;
    }
  }

  .tip_text {
    @include size-color(4.375vw, #333);
    line-height: 5.625vw;
    text-align: center;
    margin-top: 5vw;
    padding: 0 2.5vw;
  }

  .confrim {
    @include size-color(5vw, #fff);
    font-weight: bold;
    margin-top: 5vw;
    background-color: #4cd964;
    width: 100%;
    text-align: center;
    line-height: 11.25vw;
    border: 0.2667vw;
    border-bottom-left-radius: 1.5625vw;
    border-bottom-right-radius: 1.5625vw;
  }
}
</style>
