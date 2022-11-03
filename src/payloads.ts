import readlineSync from 'readline-sync'
import crypto from 'crypto'

import { ServicesPayloadTypes, UserAuthType } from "./service-types";

export const WebAuthenticateUserPayload = ({
  UserName,
  Password
}: UserAuthType): ServicesPayloadTypes.USERNAME_PASSWORD_AUTH => ({
  UserName,
  Password
})

export const Authenticate2FAPayload = (): ServicesPayloadTypes.AUTHENTICATE_2FA => {
  const code = readlineSync.question('Google auth code? ')
  const payload: ServicesPayloadTypes.AUTHENTICATE_2FA = { Code: code }
  return payload
}

export const AddUserAPIKeyPayload = ({
  UserId,
  SessionToken
}: UserAuthType): ServicesPayloadTypes.ADD_USER_API_KEY => ({
  UserId: Number(UserId),
  Permissions: ["Trading"],
  aptoken: String(SessionToken)
})

export const AuthenticateUserPayload = (user: UserAuthType, data: string): ServicesPayloadTypes.KEY_SECRET_AUTH => {
  const { APIKey, APISecret, UserId } = JSON.parse(data)
  const nonceValue = Date.now()
  const userId = user ? user.UserId : UserId
  const message = `${nonceValue}${userId}${APIKey}`
  const Signature = crypto.createHmac('sha256', APISecret).update(message).digest('hex');
  return { APIKey, Signature,  UserId: String(userId), Nonce: String(nonceValue) }
}

export const BuyOrderPayload = ({ AccountId }: UserAuthType): ServicesPayloadTypes.SEND_ORDER => ({
  InstrumentId: 1,
  OMSId: 1,
  AccountId: Number(AccountId),
  TimeInForce: 1,
  ClientOrderId: 1,
  OrderIdOCO: 0,
  UseDisplayQuantity: false,
  Side: 0,
  quantity: 0.00001000,
  OrderType: 1,
  PegPriceType: 3
})

export const SellOrderPayload = ({ AccountId }: UserAuthType): ServicesPayloadTypes.SEND_ORDER => ({
  InstrumentId: 1,
  OMSId: 1,
  AccountId: Number(AccountId),
  TimeInForce: 1,
  ClientOrderId: 1,
  OrderIdOCO: 0,
  UseDisplayQuantity: false,
  Side: 1,
  quantity: 0.00001000,
  OrderType: 1,
  PegPriceType: 3
})