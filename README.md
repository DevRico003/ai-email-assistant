# Gmail Assistant Chrome Extension

A Chrome extension for intelligent email enhancement and translation directly within Gmail, powered by Groq AI.

## Features

- ✨ **Smart Text Enhancement**: Improves grammar and style while maintaining the original tone
- 🌍 **Multilingual Translation**: Supports translations in:
  - 🇬🇧 English
  - 🇩🇪 German
  - 🇫🇷 French
  - 🇪🇸 Spanish
  - 🇮🇹 Italian
- 🎯 **Context-Aware**: Detects and maintains formal/informal language
- 🎨 **Gmail-Integrated Design**: Seamlessly integrates with Gmail's interface

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Get your Groq API key from [Groq Console](https://console.groq.com/)
6. Click the extension icon and enter your API key in the settings

## Usage

1. Open Gmail and compose a new email
2. You'll see two new buttons above the compose area:
   - ✨ **Enhance**: Click to improve your text while maintaining the original tone
   - 🌍 **Translate**: Click to select a target language for translation

## Development

### Prerequisites
- Chrome Browser
- Groq API Key

### Project Structure 

```
gmail-assistant/
├── manifest.json # Extension configuration
├── content.js # Gmail integration logic
├── emailProcessor.js # AI processing logic
├── popup.html # Settings popup
└── styles.css # Styling
```

## Privacy & Security

- Your API key is stored locally in Chrome's secure storage
- No email content is stored or logged
- All processing is done through secure API calls to Groq

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request