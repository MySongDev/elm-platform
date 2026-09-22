export default [
  {
    url: '/customer-addresses',
    method: 'get',
    response: () => {
      return [
        {
          id: 297740202,
          customerId: 1,
          address: '桂平路180号33幢',
          phone: '13683220505',
          phoneBk: '',
          name: '张三',
          addressDetail: 'A座101室',
          tag: '家',
        },
        {
          id: 297740203,
          customerId: 1,
          address: '宜山路700号',
          phone: '13683220506',
          phoneBk: '',
          name: '李四',
          addressDetail: 'B座202室',
          tag: '公司',
        },
      ]
    },
  },
]
