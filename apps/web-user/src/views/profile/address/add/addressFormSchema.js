export const addressSchema = {
  name: [
    { required: true, message: '姓名不能为空' },
    { validator: v => v.length >= 2 || '姓名至少2个字符' },
    { validator: v => v.length <= 20 || '姓名不能超过20个字符' },
    { pattern: /^[\p{Unified_Ideograph}a-zA-Z\s]+$/u, message: '姓名只能包含中文、英文和空格' },
  ],
  sex: [
    { validator: v => [1, 2].includes(Number(v)) || '请选择性别' },
  ],
  detail: [
    { required: true, message: '所在地区不能为空' },
  ],
  community: [
    { required: true, message: '小区/楼宇不能为空' },
    { validator: v => v.length >= 2 || '小区名称至少2个字符' },
  ],
  phone: [
    { required: true, message: '手机号不能为空' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
  ],
  phoneBk: [
    {
      validator: (v) => {
        if (!v?.trim())
          return true
        return /^1[3-9]\d{9}$/.test(v) || '备用电话格式不正确'
      },
    },
  ],
}
