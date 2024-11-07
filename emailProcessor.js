async function detectFormality(text, language) {
    const apiKey = await chrome.storage.local.get(['groqApiKey']).then(result => result.groqApiKey);
    
    if (!apiKey) {
        throw new Error('API Key nicht gefunden');
    }

    try {
        const formalityPrompts = {
            'de': "Du bist ein Experte für deutsche Texte. Analysiere nur die Anrede und Ausdrucksweise. Antworte NUR mit 'formal' wenn Sie-Form verwendet wird, oder 'informal' wenn du-Form verwendet wird.",
            'en': "Analyze only the tone and address form. Reply ONLY with 'formal' if it uses professional/formal language, or 'informal' if it uses casual/friendly language.",
            'fr': "Analysez uniquement la forme d'adresse. Répondez UNIQUEMENT par 'formal' si le texte utilise 'vous', ou 'informal' s'il utilise 'tu'.",
            'es': "Analiza solo la forma de tratamiento. Responde SOLO con 'formal' si usa 'usted', o 'informal' si usa 'tú'.",
            'it': "Analizza solo la forma di trattamento. Rispondi SOLO con 'formal' se usa 'Lei', o 'informal' se usa 'tu'."
        };

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
                        content: formalityPrompts[language] || formalityPrompts['en']
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.1
            })
        });
        const data = await formalityResponse.json();
        return data.choices[0].message.content.trim().toLowerCase() === 'formal';
    } catch (error) {
        console.error('Formality detection error:', error);
        return true; // Fallback auf formal
    }
}

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

    const detectedLanguage = await detectLanguage(text);
    const isFormal = await detectFormality(text, detectedLanguage);
    
    const languageMap = {
        'en': 'English',
        'de': 'German',
        'fr': 'French',
        'es': 'Spanish',
        'it': 'Italian'
    };

    // Aktualisierte System-Prompts für rein grammatikalische Verbesserungen
    const systemPrompts = {
        'en': `Fix only grammar and spelling errors. ${isFormal ? 'Maintain formal language.' : 'Maintain informal language.'} Do not change the style or content.`,
        'de': `Korrigiere nur Grammatik- und Rechtschreibfehler. ${isFormal ? 'Behalte die Sie-Form bei.' : 'Behalte die Du-Form bei.'} Ändere nicht den Stil oder Inhalt.`,
        'fr': `Corrigez uniquement les erreurs de grammaire et d'orthographe. ${isFormal ? 'Gardez le vouvoiement.' : 'Gardez le tutoiement.'} Ne modifiez pas le style ou le contenu.`,
        'es': `Corrige solo errores de gramática y ortografía. ${isFormal ? 'Mantén el uso de usted.' : 'Mantén el tuteo.'} No cambies el estilo ni el contenido.`,
        'it': `Correggi solo errori di grammatica e ortografia. ${isFormal ? 'Mantieni il Lei.' : 'Mantieni il tu.'} Non modificare lo stile o il contenuto.`
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

// Neue Funktionen für Vorschläge
async function generateSuggestions(emailContext) {
    const apiKey = await chrome.storage.local.get(['groqApiKey']).then(result => result.groqApiKey);
    if (!apiKey) throw new Error('API Key nicht gefunden');

    // Sprache und Formalität aus dem Kontext verwenden
    const detectedLanguage = emailContext.language;
    const isFormal = emailContext.isFormal;

    const suggestionPrompts = {
        'de': `Du bist ein professioneller E-Mail-Assistent. 
               Generiere genau 3 unterschiedliche ${isFormal ? 'förmliche (Sie-Form)' : 'informelle (Du-Form)'} Antwortvarianten.
               Wichtig für den Kontext:
               - Du antwortest ALS Empfänger der letzten E-Mail
               - Du schreibst AN den Absender der letzten E-Mail
               - Verwende AUSSCHLIESSLICH die ${isFormal ? 'Sie-Form' : 'Du-Form'}
               - Beziehe dich auf den Inhalt der vorherigen E-Mail(s)
               - Beginne jede Antwort mit einer passenden Anrede
               - Schließe jede Antwort mit einer passenden Grußformel
               - Trenne die Antworten mit |||
               - Füge keine weiteren Erklärungen hinzu`,
               
        'en': `You are a professional email assistant. 
               Generate exactly 3 different ${isFormal ? 'formal (professional)' : 'informal (casual)'} response variations.
               Important context:
               - You are responding AS the recipient of the last email
               - You are writing TO the sender of the last email
               - Use STRICTLY ${isFormal ? 'formal' : 'informal'} language throughout
               - Reference the content of the previous email(s)
               - Start each response with an appropriate greeting
               - End each response with an appropriate closing
               - Separate responses with |||
               - Do not add any explanations`,
        'fr': `Vous êtes un assistant de messagerie professionnel. 
               Générez exactement 3 réponses ${isFormal ? 'formelles (vouvoiement)' : 'informelles (tutoiement)'} différentes.
               Contexte important:
               - Vous répondez EN TANT QUE destinataire du dernier e-mail
               - Vous écrivez À l'expéditeur du dernier e-mail
               - Utilisez exclusivement le ${isFormal ? 'vouvoiement' : 'tutoiement'}
               - Faites référence au contenu des e-mails précédents
               - Commencez chaque réponse par une salutation appropriée
               - Terminez chaque réponse par une formule de politesse appropriée
               - Séparez les réponses avec |||
               - N'ajoutez pas d'explications`,
        'es': `Eres un asistente profesional de correo electrónico. 
               Genera exactamente 3 respuestas ${isFormal ? 'formales (usted)' : 'informales (tú)'} diferentes.
               Contexto importante:
               - Estás respondiendo COMO el destinatario del último correo
               - Estás escribiendo AL remitente del último correo
               - Usa consistentemente el ${isFormal ? 'usted' : 'tú'}
               - Haz referencia al contenido de los correos anteriores
               - Comienza cada respuesta con un saludo apropiado
               - Termina cada respuesta con una despedida apropiada
               - Separa las respuestas con |||
               - No agregues explicaciones`,
        'it': `Sei un assistente email professionale. 
               Genera esattamente 3 diverse risposte ${isFormal ? 'formali (Lei)' : 'informali (tu)'} differenti.
               Contesto importante:
               - Stai rispondendo COME destinatario dell'ultima email
               - Stai scrivendo AL mittente dell'ultima email
               - Usa consistentemente il ${isFormal ? 'Lei' : 'tu'}
               - Fai riferimento al contenuto delle email precedenti
               - Inizia ogni risposta con un saluto appropriato
               - Termina ogni risposta con una chiusura appropriata
               - Separa le risposte con |||
               - Non aggiungere spiegazioni`
    };

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
                    content: suggestionPrompts[detectedLanguage] || suggestionPrompts['de']
                },
                {
                    role: "user",
                    content: `Generate response suggestions for this conversation:
                        Latest email you're responding to:
                        From: ${emailContext.latestEmail.sender}
                        Message: "${emailContext.latestEmail.text}"

                        ${emailContext.previousEmails.length > 0 ? `
                        Previous conversation history:
                        ${emailContext.previousEmails.map(email => 
                            `From: ${email.sender}
                            Message: "${email.text}"`
                        ).join('\n---\n')}` : ''}
                        
                        You are writing AS the recipient TO ${emailContext.latestEmail.sender}.
                        Generate 3 different appropriate responses.`
                }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`API Fehler: ${response.status}`);
    }

    const data = await response.json();
    let suggestions = data.choices[0].message.content
        .split('|||')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    // Falls weniger als 3 Vorschläge, generiere weitere
    if (suggestions.length < 3) {
        suggestions = await generateAdditionalSuggestions(
            emailContext.latestEmail.text,
            detectedLanguage,
            isFormal,
            suggestions,
            apiKey
        );
    }

    return suggestions;
}

async function generateAdditionalSuggestions(text, language, isFormal, existingSuggestions, apiKey) {
    const suggestionPrompts = {
        // ... gleiche Prompts wie oben ...
    };

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
                    content: suggestionPrompts[language] || suggestionPrompts['de']
                },
                {
                    role: "user",
                    content: `Generate additional responses for: ${text}`
                }
            ],
            temperature: 0.8
        })
    });
    
    const data = await response.json();
    const additionalSuggestions = data.choices[0].message.content
        .split('|||')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    
    return [...existingSuggestions, ...additionalSuggestions].slice(0, 3);
}

// Exportiere die Funktionen
window.improveEmail = improveEmail;
window.generateSuggestions = generateSuggestions;
window.detectFormality = detectFormality;