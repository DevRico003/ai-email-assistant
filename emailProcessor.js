async function improveEmail(text, targetLanguage = null) {
    const apiKey = await chrome.storage.local.get(['groqApiKey']).then(result => result.groqApiKey);
    
    if (!apiKey) {
        throw new Error('API Key nicht gefunden. Bitte fügen Sie einen API Key in den Einstellungen hinzu.');
    }

    // Sprache erkennen
    const detectLanguage = async (text) => {
        try {
            const languageResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                            content: "You are a language detector. Respond only with the language code: 'en', 'de', 'fr', 'es', or 'it'."
                        },
                        {
                            role: "user",
                            content: `Detect the language of this text and respond with the language code: ${text}`
                        }
                    ],
                    temperature: 0.1
                })
            });
            const data = await languageResponse.json();
            return data.choices[0].message.content.trim().toLowerCase();
        } catch (error) {
            console.error('Language detection error:', error);
            return 'en'; // Fallback auf Englisch
        }
    };

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

    const detectedLanguage = await detectLanguage(text);
    const isFormal = await detectFormality(text);
    
    const languageMap = {
        'en': 'English',
        'de': 'German',
        'fr': 'French',
        'es': 'Spanish',
        'it': 'Italian'
    };

    const systemPrompts = {
        'en': `Improve this text while maintaining a ${isFormal ? 'formal' : 'informal'} tone. Focus on enhancing clarity and professionalism.`,
        'de': `Verbessere diesen Text und behalte dabei einen ${isFormal ? 'formellen' : 'informellen'} Ton bei. Achte auf Klarheit und Professionalität.`,
        'fr': `Améliorez ce texte en maintenant un ton ${isFormal ? 'formel' : 'informel'}. Concentrez-vous sur la clarté et le professionnalisme.`,
        'es': `Mejora este texto manteniendo un tono ${isFormal ? 'formal' : 'informal'}. Céntrate en la claridad y el profesionalismo.`,
        'it': `Migliora questo testo mantenendo un tono ${isFormal ? 'formale' : 'informale'}. Concentrati sulla chiarezza e la professionalità.`
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
                            : `You are an editor. ${systemPrompts[detectedLanguage]} Output ONLY the improved text in ${languageMap[detectedLanguage]}. Do not explain or add any other text.`
                    },
                    {
                        role: "user",
                        content: targetLanguage
                            ? `Translate to ${languageMap[targetLanguage]}: ${text}`
                            : `Improve this text: ${text}`
                    }
                ],
                temperature: 0.1
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
        return data.choices[0].message.content.trim()
            .replace(/^["']|["']$/g, '')
            .replace(/^Translation: /i, '')
            .replace(/^Improved text: /i, '')
            .trim();
    } catch (error) {
        console.error('API Error:', error);
        const errorMessages = {
            'en': 'Error during processing: ',
            'de': 'Fehler bei der Verarbeitung: ',
            'fr': 'Erreur lors du traitement: ',
            'es': 'Error durante el procesamiento: ',
            'it': 'Errore durante l\'elaborazione: '
        };
        throw new Error(errorMessages[detectedLanguage] + error.message);
    }
}

window.improveEmail = improveEmail;