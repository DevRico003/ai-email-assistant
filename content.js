console.log('Gmail Assistant Extension geladen');

const SUPPORTED_LANGUAGES = {
    'en': { name: 'English', flag: '🇬🇧' },
    'de': { name: 'Deutsch', flag: '🇩🇪' },
    'fr': { name: 'Français', flag: '🇫🇷' },
    'es': { name: 'Español', flag: '🇪🇸' },
    'it': { name: 'Italiano', flag: '🇮🇹' }
};

async function detectFormality(text) {
    const apiKey = await chrome.storage.local.get(['groqApiKey']).then(result => result.groqApiKey);
    
    if (!apiKey) {
        throw new Error('API Key nicht gefunden');
    }

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
        return 'formal'; // Fallback to formal in case of error
    }
}

function createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    return spinner;
}

async function handleImprovement(emailElement) {
    const spinner = createLoadingSpinner();
    emailElement.parentNode.appendChild(spinner);

    try {
        const improvedText = await window.improveEmail(emailElement.innerText);
        emailElement.innerText = improvedText;
    } catch (error) {
        showError('Verbesserungsfehler: ' + error.message);
    } finally {
        spinner.remove();
    }
}

async function handleTranslation(emailElement, targetLanguage) {
    const spinner = createLoadingSpinner();
    emailElement.parentNode.appendChild(spinner);

    try {
        const translatedText = await window.improveEmail(emailElement.innerText, targetLanguage);
        emailElement.innerText = translatedText;
    } catch (error) {
        showError('Übersetzungsfehler: ' + error.message);
    } finally {
        spinner.remove();
    }
}

function showLanguageSelector(emailElement, buttonRect) {
    const existingSelector = document.querySelector('.language-selector');
    if (existingSelector) {
        existingSelector.remove();
        return;
    }

    const selector = document.createElement('div');
    selector.className = 'language-selector';
    
    const buttonContainer = emailElement.parentElement.querySelector('.email-assistant-container');
    buttonContainer.appendChild(selector);

    Object.entries(SUPPORTED_LANGUAGES).forEach(([code, langInfo]) => {
        const button = document.createElement('div');
        button.className = 'language-selector-button';
        
        const flag = document.createElement('span');
        flag.className = 'language-flag';
        flag.textContent = langInfo.flag;
        
        const name = document.createElement('span');
        name.className = 'language-name';
        name.textContent = langInfo.name;
        
        button.appendChild(flag);
        button.appendChild(name);
        
        button.onclick = async () => {
            selector.remove();
            await handleTranslation(emailElement, code);
        };
        selector.appendChild(button);
    });

    document.addEventListener('click', function closeSelector(e) {
        if (!selector.contains(e.target) && !e.target.closest('.translate-button')) {
            selector.remove();
            document.removeEventListener('click', closeSelector);
        }
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 10px;
        border-radius: 4px;
        z-index: 10000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

function addButtons(emailElement) {
    if (emailElement.previousElementSibling?.classList.contains('email-assistant-container')) {
        return;
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'email-assistant-container';
    
    const improveButton = document.createElement('button');
    improveButton.className = 'email-assistant-button improve-button';
    improveButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-1.4 2.5L22 7l-2.5-1.4L17 7l1.4-2.5L17 2l2.5 1.4L22 2zm-8.6 7.5L12 6.4l-1.4 3.1-3.1 1.4 3.1 1.4 1.4 3.1 1.4-3.1 3.1-1.4-3.1-1.4z"/>
        </svg>
        <span class="tooltip" style="left: 0; transform: translateX(0);">Verbessern</span>
    `;
    improveButton.onclick = () => handleImprovement(emailElement);
    
    const translateButton = document.createElement('button');
    translateButton.className = 'email-assistant-button translate-button';
    translateButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
        </svg>
        <span class="tooltip">Übersetzen</span>
    `;
    translateButton.onclick = (e) => {
        e.stopPropagation();
        const rect = translateButton.getBoundingClientRect();
        showLanguageSelector(emailElement, rect);
    };
    
    if (emailElement.closest('.M9')) {
        const suggestButton = document.createElement('button');
        suggestButton.className = 'email-assistant-button suggest-button';
        suggestButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            <span class="tooltip">Vorschläge</span>
        `;
        suggestButton.onclick = (e) => {
            e.stopPropagation();
            showSuggestions(emailElement);
        };
        
        buttonContainer.appendChild(suggestButton);
    }
    
    buttonContainer.appendChild(improveButton);
    buttonContainer.appendChild(translateButton);
    
    emailElement.parentElement.insertBefore(buttonContainer, emailElement);
}

function findEmailContext() {
    // Sammle alle Emails in der Konversation
    const emailContainers = Array.from(document.querySelectorAll('.h7, .a3s.aiL'));
    let context = {
        latestEmail: '',
        previousEmails: [],
        senders: []
    };

    // Finde den aktuellen Benutzer (Gmail-Adresse)
    const userEmail = document.querySelector('.gb_d.gb_Na.gb_g')?.getAttribute('aria-label') || '';
    const currentUser = userEmail.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i)?.[1] || '';

    // Verarbeite die Emails in umgekehrter Reihenfolge (neueste zuerst)
    for (let container of emailContainers.reverse()) {
        // Finde Sender-Informationen
        const headerContainer = container.closest('.gs') || container.closest('.adn');
        let sender = '';
        let timestamp = '';
        
        if (headerContainer) {
            // Versuche den Sender zu finden
            const senderElement = headerContainer.querySelector('.gD') || 
                                headerContainer.querySelector('.g2') ||
                                headerContainer.querySelector('[email]');
            
            if (senderElement) {
                sender = senderElement.getAttribute('email') || senderElement.innerText;
            }

            // Versuche den Zeitstempel zu finden
            const timeElement = headerContainer.querySelector('.g3') || 
                              headerContainer.querySelector('.adx');
            if (timeElement) {
                timestamp = timeElement.innerText;
            }
        }

        let emailText = container.innerText.trim();
        
        // Bereinige den Email-Text
        emailText = emailText
            .replace(/^Am .*schrieb.*:\s*/gm, '')
            .replace(/^-{3,}\s*Weitergeleitete Nachricht\s*-{3,}.*$/gm, '')
            .replace(/^>.*$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (emailText.length > 0) {
            const emailInfo = {
                text: emailText,
                sender: sender,
                timestamp: timestamp,
                isCurrentUser: sender === currentUser
            };

            if (!context.latestEmail) {
                context.latestEmail = emailInfo;
            } else {
                context.previousEmails.push(emailInfo);
            }
        }
    }

    if (!context.latestEmail) {
        throw new Error('Keine Email-Konversation gefunden');
    }

    return context;
}

async function showSuggestions(emailElement) {
    // Entferne existierende Popups
    document.querySelectorAll('.suggestions-popup-overlay').forEach(overlay => overlay.remove());

    // Zeige Loading-Overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'suggestions-popup-overlay';
    
    const loadingContent = document.createElement('div');
    loadingContent.className = 'loading-content';
    loadingContent.innerHTML = `
        <div class="loading-spinner-large"></div>
        <div class="loading-text">Generiere Antwortvorschläge...</div>
    `;
    
    loadingOverlay.appendChild(loadingContent);
    document.body.appendChild(loadingOverlay);

    try {
        // Hole frischen Email-Kontext
        const emailContext = findEmailContext();
        if (!emailContext.latestEmail || !emailContext.latestEmail.text) {
            throw new Error('Keine aktuelle Email gefunden');
        }

        const apiKey = await chrome.storage.local.get(['groqApiKey']).then(result => result.groqApiKey);
        if (!apiKey) throw new Error('API Key nicht gefunden');

        const isFormal = await detectFormality(emailContext.latestEmail.text);

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
                        content: `Generate exactly 3 distinct ${isFormal ? 'formal' : 'informal'} email responses in the same language as the original email. Each response must be complete and self-contained. Responses must be separated by |||. Do not add any other text or explanations.`
                    },
                    {
                        role: "user",
                        content: `Current conversation:
                            Latest email to respond to (from ${emailContext.latestEmail.sender}):
                            "${emailContext.latestEmail.text}"

                            ${emailContext.previousEmails.length > 0 ? `
                            Previous messages:
                            ${emailContext.previousEmails.map(email => 
                                `From: ${email.sender}
                                Message: "${email.text}"`
                            ).join('\n---\n')}` : ''}
                            
                            Generate 3 different appropriate responses to the latest email.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
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

        // Stelle sicher, dass wir genau 3 Vorschläge haben
        if (suggestions.length < 3) {
            // Wenn weniger als 3, generiere fehlende Vorschläge
            const additionalResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                            content: `Generate ${3 - suggestions.length} different ${isFormal ? 'formal' : 'informal'} email responses. Separate with |||.`
                        },
                        {
                            role: "user",
                            content: `Generate additional responses for: ${emailContext.latestEmail.text}`
                        }
                    ],
                    temperature: 0.8
                })
            });
            
            const additionalData = await additionalResponse.json();
            const additionalSuggestions = additionalData.choices[0].message.content
                .split('|||')
                .map(s => s.trim())
                .filter(s => s.length > 0);
            
            suggestions = [...suggestions, ...additionalSuggestions].slice(0, 3);
        }

        // Erstelle Popup für Vorschläge
        const popupOverlay = document.createElement('div');
        popupOverlay.className = 'suggestions-popup-overlay';

        const popup = document.createElement('div');
        popup.className = 'suggestions-popup';

        const header = document.createElement('div');
        header.className = 'suggestions-header';
        header.innerHTML = `
            <h3>Antwortvorschläge</h3>
            <button class="close-button">×</button>
        `;
        popup.appendChild(header);

        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'suggestions-list';

        suggestions.forEach((suggestion, index) => {
            const suggestionCard = document.createElement('div');
            suggestionCard.className = 'suggestion-card';
            
            const preview = document.createElement('div');
            preview.className = 'suggestion-preview';
            preview.textContent = suggestion;
            
            const useButton = document.createElement('button');
            useButton.className = 'use-suggestion-button';
            useButton.textContent = 'Verwenden';
            useButton.onclick = () => {
                emailElement.innerText = suggestion;
                popupOverlay.remove();
            };

            suggestionCard.appendChild(preview);
            suggestionCard.appendChild(useButton);
            suggestionsContainer.appendChild(suggestionCard);
        });

        popup.appendChild(suggestionsContainer);
        popupOverlay.appendChild(popup);
        document.body.appendChild(popupOverlay);

        // Event-Listener für Schließen
        header.querySelector('.close-button').onclick = () => popupOverlay.remove();
        popupOverlay.onclick = (e) => {
            if (e.target === popupOverlay) popupOverlay.remove();
        };

    } catch (error) {
        console.error('Suggestion error:', error);
        showError('Vorschlagsfehler: ' + error.message);
    } finally {
        loadingOverlay.remove();
    }
}

function watchForComposeBox() {
    function addButtonsToComposeBox() {
        const emailBoxes = Array.from(document.querySelectorAll(`
            div[role="textbox"][aria-label*="Message Body"], 
            div[role="textbox"][aria-label*="Nachricht"],
            div[role="textbox"][aria-label*="Reply"],
            div[role="textbox"][aria-label*="Antworten"],
            div[aria-label*="Reply"][role="textbox"],
            div[aria-label*="Antworten"][role="textbox"],
            div.Am.Al.editable[role="textbox"],
            div[g_editable="true"],
            div.editable[contenteditable="true"],
            div[aria-label*="Antworten Sie"][role="textbox"]
        `));

        const replyContainers = document.querySelectorAll('.M9');
        replyContainers.forEach(container => {
            const editor = container.querySelector('[contenteditable="true"]');
            if (editor && !emailBoxes.includes(editor)) {
                emailBoxes.push(editor);
            }
        });
        
        emailBoxes.forEach(box => {
            const container = box.closest('.M9, .Am.Al') || box.parentElement;
            const existingButtons = container.querySelector('.email-assistant-container');
            
            if (!existingButtons && box.isContentEditable) {
                addButtons(box);
            }
        });
    }

    addButtonsToComposeBox();

    const observerConfig = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['role', 'aria-label', 'class', 'contenteditable'],
        characterData: false
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const isRelevantChange = 
                mutation.type === 'childList' ||
                (mutation.type === 'attributes' && 
                 (mutation.target.getAttribute('contenteditable') === 'true' ||
                  mutation.target.getAttribute('role') === 'textbox' ||
                  mutation.target.classList.contains('M9') ||
                  mutation.target.classList.contains('Am') ||
                  mutation.target.classList.contains('Al')));

            if (isRelevantChange) {
                setTimeout(addButtonsToComposeBox, 100);
                break;
            }
        }
    });

    observer.observe(document.body, observerConfig);

    document.addEventListener('click', (e) => {
        const replyButton = e.target.closest('[role="link"][aria-label*="Reply"], [role="link"][aria-label*="Antworten"]');
        if (replyButton) {
            const attempts = [100, 300, 500, 1000];
            attempts.forEach(delay => {
                setTimeout(addButtonsToComposeBox, delay);
            });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForComposeBox);
} else {
    watchForComposeBox();
}

document.addEventListener('load', watchForComposeBox);