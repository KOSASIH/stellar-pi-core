# Maxima API Documentation

## Overview
Maxima provides hyper-tech autonomous AI APIs for Pi Network stablecoin ecosystem.

## Endpoints

### GET /api/pi/status/:coinId
- **Description**: Get Pi Coin status.
- **Auth**: Required (JWT).
- **Response**: { "status": "valid", "value": 314159 }

### POST /api/pi/transaction
- **Description**: Submit Pi transaction.
- **Auth**: Required.
- **Body**: { "piCoinId": "id", "amount": 314159, "source": "mining" }
- **Response**: { "message": "Accepted" }

### GET /api/insights/health
- **Description**: AI-driven ecosystem health.
- **Auth**: Required.
- **Response**: { "score": 0.95, "risk": "low" }

### POST /api/iot/control/:deviceId
- **Description**: Control IoT device.
- **Auth**: Required.
- **Response**: { "message": "Command sent" }

### GET /api/bridge/status/:coinId
- **Description**: Cross-chain bridge status.
- **Auth**: Required.
- **Response**: { "status": "bridged" }

### GET /api/performance
- **Description**: System performance metrics.
- **Auth**: Required.
- **Response**: { "cpu": 45, "memory": 60 }

## Security
All APIs use JWT authentication and Eulers Shield for protection. Rejects volatile techs automatically.
