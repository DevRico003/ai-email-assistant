# Gmail Assistant

A Chrome extension that enhances Gmail with AI-powered text improvement and translation capabilities using Groq AI.

## Features

- ✨ **Smart Enhancement**: Improves text while maintaining tone and formality
- 🌍 **Translation**: Supports 🇬🇧 EN, 🇩🇪 DE, 🇫🇷 FR, 🇪🇸 ES, 🇮🇹 IT
- 🎯 **Context-Aware**: Detects and maintains formal/informal language
- 🎨 **Seamless Integration**: Matches Gmail's design

## Quick Start

1. Install the extension from Chrome Web Store
2. Get your Groq API key from [Groq Console](https://console.groq.com/)
3. Click extension icon and enter API key
4. Start composing in Gmail to see enhancement options

## Privacy

- API key stored locally
- No data storage
- Secure API calls

## Development

```
gmail-assistant/
├── manifest.json     # Config
├── content.js       # Gmail integration
├── emailProcessor.js # AI processing
├── popup.html      # Settings
└── styles.css      # Styling
```