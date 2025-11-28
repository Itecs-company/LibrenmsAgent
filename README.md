<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally or via Docker Compose. The Docker container now bundles a Python-based LibreNMS agent that pushes host telemetry to your central LibreNMS server via both the REST API and SNMP traps.

View your app in AI Studio: https://ai.studio/apps/drive/1QKnpUzZu5JGChkCG0Ls8NOlxAfASsOwL

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker Compose

1. Create a `.env` file in the project root and set the Gemini API key and your LibreNMS connection details:

   ```env
   API_KEY=your_gemini_api_key_here
   LIBRENMS_URL=https://librenms.example.com
   LIBRENMS_API_TOKEN=your_api_token
   SNMP_TARGET=librenms.example.com
   SNMP_COMMUNITY=public
   SNMP_PORT=162
   AGENT_INTERVAL=60
   ```

2. Build and start the stack. The UI will be available on port 8888, while the embedded agent will begin sending metrics immediately after startup:

   ```bash
   docker compose up -d --build
   ```

3. Open the app at http://localhost:8888. The React bundle is built with the `API_KEY` build arg, so update the `.env` file and rebuild if the key changes.

## Direct Docker build

If you prefer to build the image without Compose, run:

```bash
docker build --build-arg API_KEY=your_gemini_api_key_here -t librenms-agent .
```

Then start it with the LibreNMS settings applied:

```bash
docker run -d -p 8888:80 --name librenms-agent \
  -e LIBRENMS_URL=https://librenms.example.com \
  -e LIBRENMS_API_TOKEN=your_api_token \
  -e SNMP_TARGET=librenms.example.com \
  -e SNMP_COMMUNITY=public \
  -e SNMP_PORT=162 \
  -e AGENT_INTERVAL=60 \
  librenms-agent
```
