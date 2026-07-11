// pages/coupon/coupon.js
const { get } = require('../../utils/request')
const { fenToYuan, formatTime } = require('../../utils/format')

Page({
  data: {
    tabs: [
      { text: '未使用', status: 0 },
      { text: '已使用', status: 1 },
      { text: '已过期', status: 2 },
    ],
    activeTab: 0,
    allList: [],
    currentList: [],
  },

  onLoad() {
    this.loadList()
  },

  async loadList() {
    try {
      const data = await get('/coupon/my')
      const statusMap = {
        0: { statusText: '未使用', statusClass: 'status-unused' },
        1: { statusText: '已使用', statusClass: 'status-used' },
        2: { statusText: '已过期', statusClass: 'status-expired' },
      }
      const allList = (data || []).map((c) => ({
        ...c,
        amountText: fenToYuan(c.amount),
        thresholdText: fenToYuan(c.threshold),
        startText: formatTime(c.start_time, false),
        endText: formatTime(c.end_time, false),
        statusText: statusMap[c.status].statusText,
        statusClass: statusMap[c.status].statusClass,
      }))
      this.setData({ allList })
      this.filterList()
    } catch (e) {
      console.error('load coupon list failed', e)
    }
  },

  filterList() {
    const status = this.data.tabs[this.data.activeTab].status
    const currentList = this.data.allList.filter((c) => c.status === status)
    this.setData({ currentList })
  },

  onTabChange(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeTab: index })
    this.filterList()
  },
})
