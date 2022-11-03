# Alphapoint Integration

## Description

Used to test alphapoint endpoints with Websocket

##### Used Endpoints:
- WebAuthenticateUser
- Authenticate2FA
- AddUserAPIKey
- AuthenticateUser
- SendOrder

##### Auth Variables
- Uses ENV variables  `EMAIL` and `PASSWORD` from `.env`
- If not defined, as default it uses:
  - `EMAIL: qa@coinext.com.br`
  - `PASSWORD: teste153QA`

#### Scripts

- Authenticate user without 2fa:
  ```bash
  npm run alphapoint:simple-auth
  ```

- Authenticate user using 2fa:
  ```bash
  npm run alphapoint:2fa-auth
  ```

- Authenticate user without 2fa and send a Buying Order:
  ```bash
  npm run alphapoint:simple-auth-buy-order
  ```

- Authenticate user using 2fa and send a Buying Order:
  ```bash
  npm run alphapoint:2fa-auth-buy-order
  ```