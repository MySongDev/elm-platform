// ⚠️ 与 apps/web-user/src/utils/storage 对应：uni-user 侧 storage 已收口到 platform/storage，
// 此文件仅为保持 utils/payment.js 的同源 import 路径（'./storage'）而做的转发。
export { getStore, removeStore, setStore } from '@/platform/storage'
