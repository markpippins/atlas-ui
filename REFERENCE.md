# Nexus Console — Reference Guide

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `apiEndpoint` | http://localhost:8080 | Backend API endpoint |
| `wsEndpoint` | ws://localhost:8080 | WebSocket endpoint for live updates |
| `search.apiKeys` | — | API keys for multi-source search providers |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_ENDPOINT` | http://localhost:8080 | Backend API URL |
| `WS_ENDPOINT` | ws://localhost:8080 | WebSocket URL |
| `GOOGLE_API_KEY` | — | Google Custom Search key |
| `UNSPLASH_API_KEY` | — | Unsplash API key |

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on port 4200 |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |

## Troubleshooting

- **3D graph not rendering**: Ensure WebGL is enabled in the browser — Three.js requires WebGL support
- **WebSocket disconnected**: Check that the backend WebSocket server is running and WS_ENDPOINT is correct
- **Search results empty**: Verify API keys for the configured search providers are valid
- **Theme not applying**: Theme preference is stored in localStorage — clear site data to reset
