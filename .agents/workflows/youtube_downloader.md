# YouTube Downloader Protocol

**Description:** Securely download YouTube videos using `yt-dlp` directly into your active dropzone, completely bypassing web-based downloaders and their associated adware/phishing vectors.
**Trigger:** Manual invocation via `/youtube_downloader [url]` or by simply telling the agent: "Download this youtube video: [url]"

## Workflow Mechanics

**Goal:** To establish a frictionless, command-line funnel for ingesting external video content directly into the secure Sovereign OS environment (specifically the daily dropzone).

### Step 1: Execute the Video Ingestion
The agent will execute the dedicated `download_youtube.py` Python script, passing your provided URL. The script defaults to the `daily_19042026` dropzone, so no directory flags are needed unless a different target is requested.

// turbo
```bash
python /home/james/SovereignOS/scripts/download_youtube.py "[URL_GOES_HERE]"
```

### Step 2: Verification
The agent reads the terminal output. It will explicitly confirm that the video was successfully parsed, that the high-quality MP4 format was selected by `yt-dlp`, and that the file now securely rests in the dropzone.
