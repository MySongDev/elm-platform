export interface CustomerPasswordLoginInput {
  phone: string
  password: string
}

export interface CustomerSmsLoginInput {
  phone: string
  smsCode: string
}

export interface CustomerPasswordResetInput {
  phone: string
  smsCode: string
  password: string
}
