async function improveEmail(text, targetLanguage = null) {
    const apiKey = await chrome.storage.local.get(['groqApiKey']).then(result => result.groqApiKey);
    
    if (!apiKey) {
        throw new Error('API Key nicht gefunden. Bitte fügen Sie einen API Key in den Einstellungen hinzu.');
    }

    // Formalität erkennen
    const detectFormality = async (text) => {
        try {
            const formalityResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: "You are a formality detector. Respond only with 'formal' or 'informal'."
                        },
                        {
                            role: "user",
                            content: `Determine if this text is formal or informal: ${text}`
                        }
                    ],
                    temperature: 0.1
                })
            });
            const data = await formalityResponse.json();
            return data.choices[0].message.content.trim().toLowerCase();
        } catch (error) {
            console.error('Formality detection error:', error);
            return 'formal';
        }
    };

    const isFormal = await detectFormality(text);
    
    const languageMap = {
        'en': 'English',
        'de': 'German',
        'fr': 'French',
        'es': 'Spanish',
        'it': 'Italian'
    };

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: targetLanguage
                            ? `You are a translator. Output ONLY the direct translation in ${languageMap[targetLanguage]}. Maintain the exact ${isFormal ? 'formal' : 'informal'} tone. Do not explain or add any other text.`
                            : `You are an editor. Output ONLY the improved text. Maintain the exact ${isFormal ? 'formal' : 'informal'} tone and original language. Do not explain or add any other text.`
                    },
                    {
                        role: "user",
                        content: targetLanguage
                            ? `Translate to ${languageMap[targetLanguage]}: ${text}`
                            : `Improve this text by enhancing grammar, sentence structure, and overall clarity while maintaining the original meaning: ${text}`
                    }
                ],
                temperature: 0.1  // Niedrigere Temperatur für konsistentere Ergebnisse
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || 'Unknown error';
            } catch {
                errorMessage = errorText || `HTTP error! status: ${response.status}`;
            }
            throw new Error(`API Error: ${errorMessage}`);
        }

        const data = await response.json();
        // Entferne eventuelle Anführungszeichen oder andere Formatierungen
        return data.choices[0].message.content.trim()
            .replace(/^["']|["']$/g, '')  // Entferne Anführungszeichen am Anfang/Ende
            .replace(/^Translation: /i, '') // Entferne "Translation: " am Anfang
            .replace(/^Improved text: /i, '') // Entferne "Improved text: " am Anfang
            .trim();
    } catch (error) {
        console.error('API Error:', error);
        throw new Error('Fehler bei der Verarbeitung: ' + error.message);
    }
}

window.improveEmail = improveEmail;