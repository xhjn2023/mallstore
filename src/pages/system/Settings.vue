<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h3 class="text-sm font-semibold text-slate-800 border-l-2 border-indigo-500 pl-2 mb-4">
        运费配置
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">默认运费（元）</label>
          <input
            v-model="form.default_freight"
            type="number"
            step="0.01"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1.5">满额包邮（元，0为不包邮）</label>
          <input
            v-model="form.freight_free_threshold"
            type="number"
            step="0.01"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm text-slate-600 mb-1.5">发货地址</label>
          <textarea
            v-model="form.ship_address"
            rows="2"
            placeholder="请输入发货地址"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 resize-y"
          />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h3 class="text-sm font-semibold text-slate-800 border-l-2 border-indigo-500 pl-2 mb-4">
        微信支付配置
      </h3>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">小程序 AppID</label>
            <input
              v-model="form.wx_appid"
              placeholder="wx开头的小程序AppID"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">小程序 Secret</label>
            <input
              v-model="form.wx_secret"
              type="password"
              placeholder="小程序密钥"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">商户号 MchID</label>
            <input
              v-model="form.wx_mch_id"
              placeholder="微信支付商户号"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1.5">支付密钥 PayKey</label>
            <input
              v-model="form.wx_pay_key"
              type="password"
              placeholder="微信支付API密钥"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
        <div
          v-if="!form.wx_mch_id || !form.wx_pay_key"
          class="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2"
        >
          <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            当前为<span class="font-medium">模拟支付模式</span>，未配置商户号与支付密钥。配置后将自动切换为真实微信支付。
          </div>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="flex justify-end pb-6">
      <button
        :disabled="saving"
        class="px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        @click="save"
      >
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { http } from '@/api/request'
import { toast } from '@/composables/useToast'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { AlertCircle } from 'lucide-vue-next'

const { submitting: saving, guard } = useSubmitLock()

const form = reactive({
  freight_free_threshold: '',
  default_freight: '',
  ship_address: '',
  wx_appid: '',
  wx_secret: '',
  wx_mch_id: '',
  wx_pay_key: '',
})

async function load() {
  const data = await http.get<Record<string, string>>('/admin/system/setting')
  Object.assign(form, data)
}

async function save() {
  // 防重复提交
  try {
    const ok = await guard('save', async () => {
      await http.post('/admin/system/setting', form)
      toast.success('设置已保存')
    })
    if (!ok) return
  } catch (err: any) {
    toast.error(err.message || '保存失败')
  }
}

onMounted(() => load())
</script>
