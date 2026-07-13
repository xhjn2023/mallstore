// pages/address-edit/address-edit.js
const { get, post } = require('../../utils/request')
const { guardSubmit } = require('../../utils/submit')

Page({
  data: {
    editId: null,
    submitting: false,
    form: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      is_default: false,
    },
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ editId: options.id })
      this.loadAddress(options.id)
    }
  },

  async loadAddress(id) {
    try {
      const list = await get('/address/list')
      const addr = list.find((a) => a.id === Number(id))
      if (addr) {
        this.setData({
          form: {
            name: addr.name,
            phone: addr.phone,
            province: addr.province,
            city: addr.city,
            district: addr.district,
            detail: addr.detail,
            is_default: addr.is_default === 1,
          },
        })
      }
    } catch (e) {
      console.error('load address failed', e)
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  onRegionChange(e) {
    const [province, city, district] = e.detail.value
    this.setData({
      'form.province': province,
      'form.city': city,
      'form.district': district,
    })
  },

  onDefaultChange(e) {
    this.setData({ 'form.is_default': e.detail.value })
  },

  async onSave() {
    const { name, phone, province, city, district, detail, is_default } = this.data.form
    if (!name.trim()) {
      wx.showToast({ title: '请输入收货人姓名', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (!province || !city || !district) {
      wx.showToast({ title: '请选择所在地区', icon: 'none' })
      return
    }
    if (!detail.trim()) {
      wx.showToast({ title: '请输入详细地址', icon: 'none' })
      return
    }

    // 防重复提交：同一 'save' 锁在途时直接拦截（按钮同时 disabled + loading）
    try {
      const ok = await guardSubmit(this, 'save', async () => {
        await post('/address/save', {
          id: this.data.editId ? Number(this.data.editId) : undefined,
          name: name.trim(),
          phone,
          province,
          city,
          district,
          detail: detail.trim(),
          is_default: is_default ? 1 : 0,
        })
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1000)
      })
      if (!ok) return
    } catch (e) {
      console.error('save address failed', e)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  },
})
