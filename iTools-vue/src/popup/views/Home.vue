<template>
  <el-main class="page">
    iTools is detected on this page.
    Open DevTools and look for the iTools panel.
  </el-main>
</template>

<script>
// import banner from '@/assets/01.png'
export default {
  name: 'Home',
  data () {
    return {
      // banner
    }
  }
}
</script>

<style lang="less" scoped>
.page {
  display: flex;
  flex-direction: column;
  align-content: center;
  justify-content: center;
  text-align: center;
}
.page__banner-area {
  margin-bottom: 35px;
}
.page__title {
  margin-bottom: 30px;
  font-size: 20px;
  font-weight: 400;
}
.page__link {
  color: #51C51A;
  font-size: 18px;
}
</style>
