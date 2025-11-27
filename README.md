<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally or via Docker Compose.

View your app in AI Studio: https://ai.studio/apps/drive/1QKnpUzZu5JGChkCG0Ls8NOlxAfASsOwL

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run with Docker Compose

1. Create a `.env` file in the project root and set your Gemini API key:

   ```env
   API_KEY=your_gemini_api_key_here
   ```

2. Build and start the stack:

   ```bash
   docker compose up -d --build
   ```

3. Open the app at http://localhost:8888. The React bundle is built with the `API_KEY` build arg, so update the `.env` file and rebuild if the key changes.

## Direct Docker build

If you prefer to build the image without Compose, run:

```bash
docker build --build-arg API_KEY=your_gemini_api_key_here -t librenms-agent .
```

Then start it with:

```bash
docker run -d -p 8888:80 --name librenms-agent librenms-agent
```
