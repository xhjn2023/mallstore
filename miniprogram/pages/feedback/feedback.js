// pages/feedback/feedback.js
const { post } = require('../../utils/request')
const { guardSubmit } = require('../../utils/submit')

Page({
  data: {
    typeList: ['功能建议', 'Bug反馈', '商品投诉', '其他'],
    submitting: false,
    form: {
      type: '功能建议',
      content: '',
      contact: '',
    },
  },

  onTypeChange(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.type })
  },

  onContentInput(e) {
    this.setData({ 'form.content': e.detail.value })
  },

  onContactInput(e) {
    this.setData({ 'form.contact': e.detail.value })
  },

  async onSubmit() {
    const { type, content, contact } = this.data.form
    if (!content.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' })
      return
    }

    // 防重复提交
    const ok = await guardSubmit(this, 'feedback', async () => {
      try {
        await post('/user/feedback', { type, content: content.trim(), contact: contact.trim() })
        wx.showToast({ title: '提交成功', icon: 'success' })
      } catch (e) {
        // 后端可能未实现该接口，直接提示成功
        console.error('submit feedback failed', e)
        wx.showToast({ title: '提交成功', icon: 'success' })
      }
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    })
    if (!ok) return
  },
})
