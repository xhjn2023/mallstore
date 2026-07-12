// pages/address/address.js
const { get, del } = require('../../utils/request')

Page({
  data: {
    list: [],
    loading: true,
    selectMode: false,
  },

  onLoad(options) {
    if (options.select === '1') {
      this.setData({ selectMode: true })
    }
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    try {
      const data = await get('/address/list')
      this.setData({ list: data || [], loading: false })
    } catch (e) {
      console.error('load address list failed', e)
      this.setData({ loading: false })
    }
  },

  onSelectAddress(e) {
    if (!this.data.selectMode) return
    const index = e.currentTarget.dataset.index
    const address = this.data.list[index]
    const app = getApp()
    // 通过全局变量传递选中地址（order-confirm 的 onShow 依赖此方式）
    app.globalData._selectedAddress = address
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage) {
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.emit('selectAddress', address)
    }
    wx.navigateBack()
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/address-edit/address-edit' })
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/address-edit/address-edit?id=${id}` })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '提示',
      content: '确定要删除该地址吗？',
      confirmColor: '#ff4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await del('/address/' + id)
            const list = this.data.list.filter((_, i) => i !== index)
            this.setData({ list })
            wx.showToast({ title: '删除成功', icon: 'success' })
          } catch (e) {
            console.error('delete address failed', e)
          }
        }
      },
    })
  },
})
