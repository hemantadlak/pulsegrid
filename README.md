# PULSEGRID

PULSEGRID is a simulation-only emergency dispatch decision-support prototype.

## Demo flow

1. Choose **Emergency User** and select a simulated condition.
2. Request simulated assistance to see capability-first hospital matching.
3. Switch to **Hospital Coordinator**.
4. Set Metro Care Centre ICU beds to `0` and save the status.
5. Return to Emergency User and confirm the proposed reroute.

PULSEGRID uses fictional hospital data and simulated ambulance movement. It does not place emergency calls or use real patient, ambulance, or hospital-availability data.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
