# RustyHearts-API
[![License](https://img.shields.io/github/license/JuniorDark/RustyHearts-API?color=green)](LICENSE)

RustyHearts-API is a Node.js-based REST API that enables authentication, billing, and launcher functionalities for Rusty Hearts.

The API consists of independent servers (Auth/Billing API and Launcher API) running on different ports.

### API game region support
* **usa** (PWE) - Full api support
* **jpn** (SEGA) - Full api support

### Servers

- **Launcher API**: The Launcher API is as a web server intended to handle the client connection to the gateserver and for the [Rusty Hearts Launcher](https://github.com/JuniorDark/RustyHearts-Launcher), which handles account registration, login, client updates, and processing static elements (public directory). This API must be accessible from the outside and proxied by Nginx or bound to an external IP.
- **Auth/Billing API (USA)/(JPN)**: This API is responsible for in-game authentication and handle the shop balance and purchases. It is recommended to bind this API only to a local IP address and prevent external access to these APIs.
- **Proxy (JPN)**: This server is used as a proxy to receive the request with malformed headers send from the game server, and forward it fixed to the Auth/Billing API. 

## Table of Contents
* [Preview](#preview)
* [Public folder](#public-folder-description)
* [Requirements](#requirements)
* [Deployment](#deployment)
* [Basic Installation](#basic-installation)
* [.env file setup](#env-file-setup)
* [Available endpoints](#available-endpoints)
* [License](#license)

### Preview
![image](api.png)

## Public folder description

### Launcher self-update

In order for the launcher to automatically update itself, you need to use the launcher_info.ini in the `launcher_update` directory of the api. This file specifies the version of the launcher. After each update of the launcher, you need to change the version in the ini, as well in the launcher executable file.

### Client download

In order to create client download, you need to use the `client` directory of the api.
The tool for creating the client files is available in the repository: https://github.com/JuniorDark/RustyHearts-MIPTool

### Client patch

In order to create client patches, you need to use the `patch` directory of the api.
The tool for creating the patch files is available in the repository: https://github.com/JuniorDark/RustyHearts-MIPTool

### News panel
Used to display the html page in the [Rusty Hearts Launcher](https://github.com/JuniorDark/RustyHearts-Launcher), uses the `news` directory of the api

## Requirements

Before deploying RustyHearts-API, ensure that you have the following software installed:

* [Node.js](https://nodejs.org/en/) version 18.5.0 or higher
* [Microsoft SQL Server](https://go.microsoft.com/fwlink/p/?linkid=2215158) version 2019 or 2022 Developer edition
* [Rusty Hearts Retail Server](https://forum.ragezone.com)

## Deployment

To deploy RustyHearts-API, follow these steps:

### Basic Installation

1. Install the latest version of Node.js from the [official website](https://nodejs.org/).
2. Download or clone the repository and copy all RustyHearts-API files to a directory of your choice (e.g., **c:\RustyHearts-API**).
3. Open a terminal window, navigate to the RustyHearts-API directory, and execute the `npm install` command. Alternatively, you can run the **install.bat** file.
4. Import the [database file](share/RustyHearts_Account.sql) to your Microsoft SQL Server.
5. Configure the parameters in the [**.env**](.env) file.
6. Start RustyHearts-API servers by running the file **start-JPN** or **start-USA** file.
7. Set the server region to **usa** or **jpn** on [service_control.xml](share/service_control.xml)

## .env file setup:

### API CONFIGURATION

- **API_LISTEN_HOST**: The host for receiving connections from the users for access public/launcher functions. Use `0.0.0.0` or leave empty to bind API on all IPs.
- **API_LISTEN_PORT**: The port number for receiving connections from the users for access public/launcher functions (default 80).
- **API_LOCAL_LISTEN_HOST**: The host for receiving connections from the GameGatewayServer/ManagerServer servers (Rusty Hearts Servers) for the auth/billing functions. Use `127.0.0.1` (recommended) or `0.0.0.0` to bind API on all IPs (not recommended!).
- **API_USA_PORT**: The port number for receiving connections from the GameGatewayServer/ManagerServer servers (Rusty Hearts Servers) for the auth/billing functions for the usa region.
- **API_JPN_PORT**: The port number for receiving connections from the GameGatewayServer/ManagerServer servers (Rusty Hearts Servers) for the auth/billing functions for the jpn region.
- **API_PROXY_PORT**: The port number for receiving connections from the GameGatewayServer/ManagerServer servers (Rusty Hearts Servers) for the auth/billing functions for the jpn region. This port is used to receive requests with malformed headers and forward them to the Auth/Billing API. 
- **API_TRUSTPROXY_ENABLE**: Allow determination of client IP address based on `X-Forwarded-For` header. Must be enabled if a reverse proxy is used.
- **API_TRUSTPROXY_HOSTS**: List of IP addresses or subnets that should be trusted as a reverse proxy. Multiple entries can be listed separated by commas. If left empty, headers will be accepted from any IP address (not recommended!).
- **API_SHOP_INITIAL_BALANCE**: The initial balance value of the in-game shop on user registration.
- **API_ENABLE_HELMET**: Determines whether the helmet middleware is enabled or disabled. If enabled, HTTPS needs to be used for the API.
- **TZ**: The timezone for the server.

### LOGGING CONFIGURATION

- **LOG_LEVEL**: The level of logging to use (e.g., debug, info, warn, error).
- **LOG_IP_ADDRESSES**: Enable logging of IP addresses.
- **LOG_AUTH_CONSOLE**: Whether to log Auth API messages to the console.
- **LOG_BILLING_CONSOLE**: Whether to log Billing API messages to the console.
- **LOG_ACCOUNT_CONSOLE**: Whether to log Account API messages to the console.
- **LOG_MAILER_CONSOLE**: Whether to log email messages to the console.

### DATABASE CONFIGURATION

- **DB_SERVER**: The IP address or hostname of the SQL Server.
- **DB_DATABASE**: The name of the database to connect to (RustyHearts_Account).
- **DB_USER**: The user to connect to the database.
- **DB_PASSWORD**: The password for the database user.
- **DB_ENCRYPT**: Whether to encrypt the connection to the database.

### GATEWAY CONFIGURATION

- **GATESERVER_IP**: The IP address of the gate server.
- **GATESERVER_PORT**: The port number of the gate server.
- **SERVER_ID**: The server/world ID used in the database.

### EMAIL CONFIGURATION

- **SMTP_HOST**: The hostname or IP address of the SMTP server.
- **SMTP_PORT**: The port number of the SMTP server.
- **SMTP_ENCRYPTION**: The encryption protocol to use (e.g., ssl, tls).
- **SMTP_USERNAME**: The username for the SMTP server.
- **SMTP_PASSWORD**: The password for the SMTP server.
- **SMTP_EMAIL_FROM_ADDRESS**: The outgoing mail sender email address.
- **SMTP_FROM_NAME**: The outgoing mail sender name.

## Available endpoints

The API provides the following endpoints:

### Launcher API

Endpoint | Method | Arguments | Content Type | Description
--- | ---  | --- | --- | ---
/Register | - | -| - | A basic web page for account registration and password change. |
/launcher/GetGatewayAction | GET  | - | XML | Returns the gateway server's IP and port in XML format used by the client to connect to the server.
/launcher/SignupAction | POST | `userName`, `email`, `password`, `verificationCode`| Form URL Encoded | Registers a new user account.
/launcher/LoginAction | POST | `account`, `password` | Form URL Encoded | Authenticates a user by username/email and returns a token if successful. |
/launcher/ResetPasswordAction | POST | `email`, `password`, `verificationCode` | Form URL Encoded | Resets a user's password using a verification code. |
/launcher/SendPasswordResetEmailAction | POST | `email` | Form URL Encoded | Sends a email with a verification code for password reset to the specified address. |
/launcher/SendVerificationEmailAction | POST | `email` | Form URL Encoded | Sends a email with a verification code for account creation reset to the specified address. |
/launcher/VerifyCodeAction | POST | `email`, `verificationCodeType`, `verificationCode` | Form URL Encoded | Validates a verification code. `verificationCodeType`: `Account`, `Password` |
/launcher/LauncherAction/getLauncherVersion | GET | - | JSON | Returns the version of the launcher specified in the launcher_info.ini file. |
/launcher/LauncherAction/updateLauncherVersion | POST | `version` | Form URL Encoded | Download the specified launcher version from the launcher_update folder. |
launcher/GetOnlineCountAction | GET  | - | JSON | Returns the number of current online players. |

### Auth/Billing API (USA)

Endpoint | Method | Arguments | Content Type | Description
--- | ---  | --- | --- | ---
/Auth | POST | `<login-request><account>account</account><password>account + password in md5</password><game>16</game><ip>ip</ip></login-request>`| XML | Authenticates a user in the client by username and password. The password must be hashed using MD5. The game ID is always 16 for the USA region. |
/Billing | POST | `<currency-request><userid>account</userid><game>1000</game><server>serverId</server></currency-request>` | XML | Returns the shop balance of the user account. The game ID is always 1000 for the USA region. |
/Billing | POST | `<item-purchase-request><userid>account</userid><charid>character GUID</charid><game>1000</game><server>serverId</server><amount>itemPrice</amount><itemid>itemid</itemid><count>itemCount</count><uniqueid>Transaction GUID</uniqueid></item-purchase-request>` | XML | Purchases an item from the shop. The game ID is always 1000 for the USA region. The server ID is the same as the one used in the Auth API. The item ID is the same as the one used in the shop. The transaction GUID is a unique identifier for the purchase. |

 ### Auth/Billing API (JPN)

Endpoint | Method | Arguments | Content Type | Description
--- | ---  | --- | --- | ---
/Auth/cgi-bin/auth_rest_oem.cgi | POST | `service_id`, `product_name`, `original_id`, `original_password`| Form URL Encoded | authenticates a user in the client by username and password. service_id is always `FFFFFFFFFFFFFFFFFF` for the JPN region. The product_name is always empty. |
/Billing/S1/ApiPointTotalGetS.php | POST | `product_name`, `original_id`, `original_password`, `auto_charge_exec` | Form URL Encoded | Returns the shop balance of the user account. The auto_charge_exec is always 0. |
/Billing/S1/ApiPointMoveS.php | POST | `product_name`, `original_id`, `original_password`, `auto_charge_exec`, `move_point`, ` move_kind`, `item_code` | Form URL Encoded | Purchases an item from the shop. `move_kind` is always 06. `move_point` is the cost of the item `-200`. The `item_code` format is `rsty0000000000001`, where the first 10 digits are the item shopID and the last 3 digits are always `001`. | 

## License
This project is licensed under the terms found in [`LICENSE-0BSD`](LICENSE).