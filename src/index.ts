import WebSocket from 'ws';
import {
  AddUserAPIKeyPayload,
  Authenticate2FAPayload,
  AuthenticateUserPayload,
  BuyOrderPayload,
  SellOrderPayload,
  WebAuthenticateUserPayload
} from './payloads';

import {
  FrameType,
  OrderTypes,
  ServicesPayloadTypes,
  UserAuthType,
  WSGatewayConstructor,
  WSGatewayServiceTypes
} from './service-types';

class WSGateway {
  ws: WebSocket
  user: UserAuthType
  frame?: FrameType
  apiKeySecretPayload?: ServicesPayloadTypes.KEY_SECRET_AUTH

  constructor({ ws, email, password, service }: WSGatewayConstructor){
    this.ws = ws
    this.user = { Password: password, UserName: email }
    this.frame =  { m: 0, i: 2, n: '', o: '' }

    this.ws.onopen = () => {
      this.wsSend(
        WSGatewayServiceTypes.WEB_AUTHENTICATE_USER,
        JSON.stringify(WebAuthenticateUserPayload(this.user))
      )
    }

    this.ws.onmessage = (msg: any) => {
      const data = JSON.parse(msg.data)
      console.log('RECEIVED >>>>', data);
      switch(data['n']) {
        case WSGatewayServiceTypes.WEB_AUTHENTICATE_USER:
          this.handleWebAuthenticateUser(data)
          break
        case WSGatewayServiceTypes.AUTHENTICATE_2FA:
          this.handleAuthenticate2fa(data)
          break
        case WSGatewayServiceTypes.ADD_USER_API_KEY:
          this.handleAddUserAPIKey(data)
          break
        case WSGatewayServiceTypes.AUTHENTICATE_USER:
          this.handleAuthenticateUser(data)
          this.handleServices(service)
          this.ws.close()
          break
        default:
          break
      }
    }

    this.ws.onclose = () => console.log('disconnected...');
  }

  handleWebAuthenticateUser(data: any){
    const { Requires2FA, SessionToken, UserId, Authenticated } = JSON.parse(data['o'])
    if (!Requires2FA && Authenticated && this.user){
      this.user.SessionToken = SessionToken
      this.user.UserId = UserId
      this.wsSend(
        WSGatewayServiceTypes.ADD_USER_API_KEY,
        JSON.stringify(AddUserAPIKeyPayload(this.user)))
    } else if (Authenticated) {
      this.wsSend(
        WSGatewayServiceTypes.AUTHENTICATE_2FA,
        JSON.stringify(Authenticate2FAPayload())
      )
    }
  }

  handleAuthenticate2fa(data: any){
    const { SessionToken, UserId } = JSON.parse(data['o'])
    if (this.user){
      this.user.SessionToken = SessionToken
      this.user.UserId = UserId
    }
    this.wsSend(
      WSGatewayServiceTypes.ADD_USER_API_KEY,
      JSON.stringify(AddUserAPIKeyPayload(this.user))
    )
  }

  handleAddUserAPIKey(data: any){
    if (!this.apiKeySecretPayload) {
      this.apiKeySecretPayload = AuthenticateUserPayload(this.user, data['o'])
      this.wsSend(WSGatewayServiceTypes.AUTHENTICATE_USER, JSON.stringify(this.apiKeySecretPayload))
    }
  }

  handleAuthenticateUser(data: any){
    const { User } = JSON.parse(data['o'])
    this.user.AccountId = User.AccountId
  }

  async handleServices(service: string){
    switch(service){
      case OrderTypes.buyOrder:
        await this.wsSend(
          WSGatewayServiceTypes.SEND_ORDER,
          JSON.stringify(BuyOrderPayload(this.user))
        )
        break
      case OrderTypes.sellOrder:
        await this.wsSend(
          WSGatewayServiceTypes.SEND_ORDER,
          JSON.stringify(SellOrderPayload(this.user))
        )
        break
      default:
        break
    }
  }

  async wsSend(service: string, payload: any, async: boolean = false){
    if (this.frame){
      this.frame.n = service
      this.frame.o = payload
      const frameO = JSON.parse(this.frame.o)
      if (frameO.Password){
        frameO.Password = '************'
        console.log('SEND >>>>', frameO);
      } else {
        console.log('SEND >>>>', this.frame);
      }
      if (!async){
        this.ws.send(JSON.stringify(this.frame))
      } else {
        await this.ws.send(JSON.stringify(this.frame))
      }
    }
  }
}

const startWSGateway = (ws: WebSocket, service: string): WSGateway => {
  const authType = process.argv[2]?.split('=')[1]
  let email, password
  if (authType === '2fa' && process.env.EMAIL && process.env.PASSWORD) {
    email = String(process.env.EMAIL)
    password = String(process.env.PASSWORD)
  } else {
    email = 'qa@coinext.com.br'
    password = 'teste153QA'
  }
  return new WSGateway({
    ws,
    email,
    password,
    service
  })
}

const ws = new WebSocket('wss://api.coinext.com.br/WSGateway')
const service = process.argv[3]?.split('=')[1]

startWSGateway(ws, service)