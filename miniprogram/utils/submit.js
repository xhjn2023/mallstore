// utils/submit.js
// 统一的「防重复提交」工具集，供所有表单 / 动作提交模块复用。
//
// 设计三层防护：
//   1) 节流 throttle / 防抖 debounce —— 用于搜索输入等高频事件，降低请求频次
//   2) 并发锁 createLock        —— JS 层 in-flight 锁，防止程序化重复调用
//   3) guardSubmit              —— 组合「并发锁 + 页面 submitting 状态」，
//                                  配合 wxml 的 loading / disabled 双向拦截连点
//
// 典型用法：
//   const { guardSubmit } = require('../../utils/submit')
//   Page({
//     data: { submitting: false },
//     async onSubmit() {
//       // 先做表单校验……
//       const ok = await guardSubmit(this, 'save', async () => {
//         await post('/some/api', payload)
//       })
//       if (!ok) return            // 正在提交中，已被自动拦截
//     }
//   })
//   并在 wxml 按钮上绑定： loading="{{submitting}}" disabled="{{submitting}}"

/**
 * 节流：wait 毫秒内最多触发一次（尾沿补发一次），用于搜索输入等高频事件。
 */
function throttle(fn, wait = 600) {
  let last = 0
  let timer = null
  return function (...args) {
    const now = Date.now()
    const remaining = wait - (now - last)
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      last = now
      fn.apply(this, args)
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * 防抖：wait 毫秒内再次触发则重新计时（仅执行最后一次）。
 */
function debounce(fn, wait = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, wait)
  }
}

/**
 * 并发锁工厂：同一 key 同一时刻只允许一个在途操作。
 */
function createLock() {
  const locks = {}
  return {
    isLocked(key = 'default') {
      return !!locks[key]
    },
    // 尝试加锁；已锁定返回 false（表示应被拦截）
    acquire(key = 'default') {
      if (locks[key]) return false
      locks[key] = true
      return true
    },
    release(key = 'default') {
      locks[key] = false
    },
  }
}

/**
 * 防重复提交包装器（核心 API）。
 * @param {Object}   page  Page 实例（this）
 * @param {string}   key   锁标识，区分同一页面内的多个提交动作（如 'save' / 'cart'）
 * @param {Function} fn    实际提交逻辑（async）
 * @param {Object}   [opts]{ flag }  data 中提交状态字段名，默认 'submitting'
 * @returns {Promise<boolean>} 是否真正执行了提交（false = 被拦截，已在途）
 */
async function guardSubmit(page, key, fn, opts = {}) {
  const flag = opts.flag || 'submitting'
  if (!page.__submitLock) page.__submitLock = createLock()
  if (!page.__submitLock.acquire(key)) {
    return false
  }
  // 双向防护：页面状态置为提交中（wxml 中绑定到按钮 loading/disabled）
  try {
    page.setData({ [flag]: true })
  } catch (e) {
    /* 某些场景下 setData 可能不可用，忽略 */
  }
  let ran = true
  try {
    await fn()
  } catch (e) {
    ran = false
    throw e // 交由调用方处理错误提示
  } finally {
    page.__submitLock.release(key)
    try {
      page.setData({ [flag]: false })
    } catch (e) {
      /* ignore */
    }
  }
  return ran
}

module.exports = { throttle, debounce, createLock, guardSubmit }
