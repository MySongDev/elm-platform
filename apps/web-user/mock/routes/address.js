export default [
  {
    url: '/v1/users/1/addresses',
    method: 'get',
    response: () => {
      return [
        {
          id: 297740202,
          user_id: 1,
          address: '桂平路180号33幢',
          phone: '13683220505',
          is_valid: 1,
          created_at: '2017-03-31T15:10:25+0800',
          phone_bk: '',
          name: '张三',
          address_detail: 'A座101室',
          tag: '家',
        },
        {
          id: 297740203,
          user_id: 1,
          address: '宜山路700号',
          phone: '13683220506',
          is_valid: 1,
          created_at: '2017-03-31T15:10:25+0800',
          phone_bk: '',
          name: '李四',
          address_detail: 'B座202室',
          tag: '公司',
        },
      ]
    },
  },
]
