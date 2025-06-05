# Resilient Email Service

A fault-tolerant, idempotent, and queue-backed email sending service built with Node.js and Express. It supports retry mechanisms, rate limiting, circuit breakers, and idempotency for robust delivery.

---

## Features

- Rate limiting: configurable request throttling
- Circuit breaker: prevent overloading failing providers
- Retry logic: automatic retries on failure
- Idempotency: ensure the same message is not sent multiple times
- In-memory queue: FIFO email processing
- Pluggable providers: simulate or extend with real email services

---

## Requirements

- Node.js 18+ (or latest LTS)
- npm (configured accordingly)

---

## Setup

```bash
git clone https://github.com/utsav-mistry/resilient-email-service.git
cd resilient-email-service
npm install
npm start
```

# API Endpoints 
## Localhost
### Queue an email (valid request)
```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Hello","body":"This is a test email","messageId":"abc-123"}'
```
### Check status of a valid message
```bash
curl http://localhost:3000/status/abc-123
```

### Send duplicate email (should return status: duplicate)
```
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Hello again","body":"Duplicate attempt","messageId":"abc-123"}'
```
### Send request with missing fields (should return 400 error)
```
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Missing body"}'
```
### Check unknown messageId status
```bash
curl http://localhost:3000/status/unknown-id-xyz
```

## Render
### Queue an email (valid request)
```bash
curl -X POST https://resilient-email-service.onrender.com/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Hello","body":"This is a test email","messageId":"abc-123"}'
```
### Check status of a valid message
```bash
curl https://resilient-email-service.onrender.com/status/abc-123
```

### Send duplicate email (should return status: duplicate)
```
curl -X POST https://resilient-email-service.onrender.com/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Hello again","body":"Duplicate attempt","messageId":"abc-123"}'
```
### Send request with missing fields (should return 400 error)
```
curl -X POST https://resilient-email-service.onrender.com/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Missing body"}'
```
### Check unknown messageId status
```bash
curl https://resilient-email-service.onrender.com/status/unknown-id-xyz
```
