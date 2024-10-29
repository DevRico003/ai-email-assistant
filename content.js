console.log('Gmail Assistant Extension geladen');

const SUPPORTED_LANGUAGES = {
    'en': { name: 'English', flag: '🇬🇧' },
    'de': { name: 'Deutsch', flag: '🇩🇪' },
    'fr': { name: 'Français', flag: '🇫🇷' },
    'es': { name: 'Español', flag: '🇪🇸' },
    'it': { name: 'Italiano', flag: '🇮🇹' }
};

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
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    selector.style.position = 'fixed';
    selector.style.left = `${buttonRect.left}px`;
    selector.style.top = `${buttonRect.bottom + scrollTop + 5}px`;

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

    document.body.appendChild(selector);

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
    
    buttonContainer.appendChild(improveButton);
    buttonContainer.appendChild(translateButton);
    
    emailElement.parentElement.insertBefore(buttonContainer, emailElement);
}

function watchForComposeBox() {
    function addButtonsToComposeBox() {
        const composeBoxes = document.querySelectorAll('div[role="textbox"][aria-label*="Message Body"], div[role="textbox"][aria-label*="Nachricht"]');
        composeBoxes.forEach(box => {
            if (!box.previousElementSibling?.classList.contains('email-assistant-container')) {
                addButtons(box);
            }
        });
    }

    addButtonsToComposeBox();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                addButtonsToComposeBox();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForComposeBox);
} else {
    watchForComposeBox();
}

document.addEventListener('load', watchForComposeBox);