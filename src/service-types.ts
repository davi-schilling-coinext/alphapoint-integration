import WebSocket from 'ws'

export type WSGatewayConstructor = {
  ws: WebSocket
  email: string
  password: string
  service: string
}

export type UserAuthType = {
  SessionToken?: string
  UserId?: string
  UserName: string
  Password: string
  AccountId?: string
}

export type FrameType = {
  m: number
  i: number
  n: string
  o: string
}

export enum WSGatewayServiceTypes {
  WEB_AUTHENTICATE_USER = 'WebAuthenticateUser',
  AUTHENTICATE_2FA = 'Authenticate2FA',
  ADD_USER_API_KEY = 'AddUserAPIKey',
  AUTHENTICATE_USER = 'AuthenticateUser',
  SEND_ORDER = 'SendOrder'
}

export namespace ServicesPayloadTypes {
  export type ADD_USER_API_KEY = ADD_USER_API_KEY_PAYLOAD
  export type USERNAME_PASSWORD_AUTH = USERNAME_PASSWORD_AUTH_PAYLOAD
  export type KEY_SECRET_AUTH = KEY_SECRET_AUTH_PAYLOAD
  export type AUTHENTICATE_2FA = AUTHENTICATE_2FA_PAYLOAD
  export type SEND_ORDER = SEND_ORDER_PAYLOAD
}

type ADD_USER_API_KEY_PAYLOAD = {
  UserId: number
  Permissions: string[]
  aptoken: string
}

type USERNAME_PASSWORD_AUTH_PAYLOAD = {
  UserName: string
  Password: string
}

type KEY_SECRET_AUTH_PAYLOAD = {
  APIKey: string
  Signature: string
  UserId: string
  Nonce: string
}

type AUTHENTICATE_2FA_PAYLOAD = {
  Code: string
}

type SEND_ORDER_PAYLOAD = {
  InstrumentId: number
  OMSId: number
  AccountId: number
  TimeInForce: number
  ClientOrderId: number
  OrderIdOCO: number
  UseDisplayQuantity: false,
  Side: number
  quantity: number
  OrderType: number
  PegPriceType: number
  LimitPrice?: number
}