import WebSocket from 'ws'
import readlineSync from 'readline-sync'
import crypto from 'crypto'

import { FrameType, ServicesPayloadTypes, UserAuthType, WSGatewayConstructor, WSGatewayServiceTypes } from './service-types'

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
      this.wsSend(WSGatewayServiceTypes.WEB_AUTHENTICATE_USER, JSON.stringify({
        UserName: this.user?.UserName,
        Password: this.user?.Password
      } as ServicesPayloadTypes.USERNAME_PASSWORD_AUTH))
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
          this.handleService(service)
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
      this.wsSend(WSGatewayServiceTypes.ADD_USER_API_KEY, JSON.stringify({
        "UserId": Number(this.user?.UserId),
        "Permissions": ["Trading"],
        "aptoken": String(this.user?.SessionToken),
      } as ServicesPayloadTypes.ADD_USER_API_KEY))
    } else if (Authenticated) {
      const code = readlineSync.question('Google auth code? ')
      const payload: ServicesPayloadTypes.AUTHENTICATE_2FA = { Code: code }
      this.wsSend(WSGatewayServiceTypes.AUTHENTICATE_2FA, JSON.stringify(payload))
    }
  }

  handleAuthenticate2fa(data: any){
    const { SessionToken, UserId } = JSON.parse(data['o'])
    if (this.user){
      this.user.SessionToken = SessionToken
      this.user.UserId = UserId
    }
    this.wsSend(WSGatewayServiceTypes.ADD_USER_API_KEY, JSON.stringify({
      "UserId": Number(this.user?.UserId),
      "Permissions": ["Trading"],
      "aptoken": String(this.user?.SessionToken),
    } as ServicesPayloadTypes.ADD_USER_API_KEY))
  }

  handleAddUserAPIKey(data: any){
    if (!this.apiKeySecretPayload) {
      const { APIKey, APISecret, UserId } = JSON.parse(data['o'])
      const nonceValue = Date.now()
      const userId = this.user ? this.user.UserId : UserId
      const message = `${nonceValue}${userId}${APIKey}`
      const Signature = crypto.createHmac('sha256', APISecret).update(message).digest('hex');
      this.apiKeySecretPayload = { APIKey, Signature,  UserId: String(userId), Nonce: String(nonceValue) }
      this.wsSend(WSGatewayServiceTypes.AUTHENTICATE_USER, JSON.stringify(this.apiKeySecretPayload))
    }
  }

  handleAuthenticateUser(data: any){
    const { User } = JSON.parse(data['o'])
    this.user.AccountId = User.AccountId
  }

  async handleService(service: string){
    switch(service){
      case 'order':
        const payload: ServicesPayloadTypes.SEND_ORDER = {
          InstrumentId: 1,
          OMSId: 1,
          AccountId: Number(this.user.AccountId),
          TimeInForce: 1,
          ClientOrderId: 1,
          OrderIdOCO: 0,
          UseDisplayQuantity: false,
          Side: 0,
          quantity: 0.00001000,
          OrderType: 1,
          PegPriceType: 3
        }
        await this.wsSend(WSGatewayServiceTypes.SEND_ORDER, JSON.stringify(payload))
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