# Avatar Integration with SimliElevenlabs

This module integrates the create-simli-app-elevenlabs functionality into the main dashboard. It creates an AI avatar that can speak and visualize speech using ElevenLabs and Simli technologies.

## Setup Requirements

1. Add the following environment variables to your `.env.local` file:

```
# API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
SIMLI_API_KEY=your_simli_api_key_here

# Avatar Settings
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here
SIMLI_FACE_ID=your_simli_face_id_here
```

2. Make sure you have the correct dependencies installed:
   - @11labs/react
   - simli-client

## Components

- **DottedFace**: Displays a loading animation while waiting for the avatar to initialize
- **SimliElevenlabs**: The main component that handles interaction with ElevenLabs and Simli APIs
- **VideoBox**: Renders the video and audio elements for the avatar
- **IconSparkleLoader**: Displays a loading animation when starting the interaction

## Usage

The Avatar page is accessible via the sidebar under "Avatar", or by navigating to `/avatar` directly.

## Customization

The avatar's face and voice are configured using environment variables:

- `ELEVENLABS_AGENT_ID`: The ElevenLabs agent ID for voice
- `SIMLI_FACE_ID`: The Simli face ID for visualization

You can also modify the default fallback values in `src/app/(main)/avatar/page.tsx` if needed.

## Troubleshooting

- Make sure your microphone permissions are enabled in the browser
- Check the console for specific error messages from ElevenLabs or Simli
- Verify that your API keys are correctly set in the environment variables