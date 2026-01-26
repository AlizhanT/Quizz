// Simple Static Language Management System
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'kk';
        this.translations = {};
        this.translationObserver = null;
    }

    async loadLanguage() {
        try {
            // Load specific language file
            const response = await fetch(`../assets/${this.currentLanguage}.json`);
            const langData = await response.json();
            this.translations[this.currentLanguage] = langData[this.currentLanguage];
            
            // Also load English as fallback if not already loaded
            if (this.currentLanguage !== 'en' && !this.translations['en']) {
                const enResponse = await fetch('../assets/en.json');
                const enData = await enResponse.json();
                this.translations['en'] = enData['en'];
            }
            
            // Apply translations to page once
            this.applyTranslations();
            
            // Start observing for dynamic elements
            this.startTranslationObserver();
        } catch (error) {
            console.error('Error loading language file:', error);
            // Fallback to English if file fails to load
            this.currentLanguage = 'en';
            try {
                const enResponse = await fetch('../assets/en.json');
                const enData = await enResponse.json();
                this.translations['en'] = enData['en'];
                this.applyTranslations();
                this.startTranslationObserver();
            } catch (enError) {
                console.error('Error loading fallback English file:', enError);
            }
        }
    }

    async setLanguage(lang) {
        this.currentLanguage = lang;
        await this.loadLanguage(); // Load and apply translations
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                // Fallback to English if key not found in current language
                translation = this.translations['en'];
                for (const k of keys) {
                    if (translation && translation[k]) {
                        translation = translation[k];
                    } else {
                        return key; // Return key if translation not found
                    }
                }
                break;
            }
        }
        
        // Replace parameters in translation
        if (typeof translation === 'string') {
            return translation.replace(/\{(\w+)\}/g, (match, param) => params[param] || match);
        }
        
        return translation || key;
    }

    applyTranslations() {
        // Update elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.t(key);
            
            if (translation && translation !== key) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    // Use innerHTML to support HTML markup in translations
                    element.innerHTML = translation;
                }
            }
        });

        // Update elements with data-translate-title attribute
        document.querySelectorAll('[data-translate-title]').forEach(element => {
            const key = element.getAttribute('data-translate-title');
            const translation = this.t(key);
            
            if (translation && translation !== key) {
                element.title = translation;
            }
        });

        // Update elements with data-translate-value attribute
        document.querySelectorAll('[data-translate-value]').forEach(element => {
            const key = element.getAttribute('data-translate-value');
            const translation = this.t(key);
            
            if (translation && translation !== key) {
                element.value = translation;
            }
        });

        // Update elements with data-translate-placeholder attribute
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = this.t(key);
            
            if (translation && translation !== key) {
                element.placeholder = translation;
            }
        });

        // Update elements with data-translate-title attribute
        document.querySelectorAll('[data-translate-title]').forEach(element => {
            const key = element.getAttribute('data-translate-title');
            const translation = this.t(key);
            
            if (translation && translation !== key) {
                element.title = translation;
            }
        });

        // Update language selector
        this.updateLanguageSelector();
    }

    startTranslationObserver() {
        // Stop existing observer if any
        if (this.translationObserver) {
            this.translationObserver.disconnect();
        }

        // Create new observer to watch for dynamically added elements
        this.translationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Apply translations to the new element and its children
                        this.applyTranslationsToElement(node);
                    }
                });
            });
        });

        // Start observing the entire document for child additions
        this.translationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    applyTranslationsToElement(element) {
        // Apply to the element itself
        this.applyTranslationToSingleElement(element);
        
        // Apply to all descendants
        element.querySelectorAll('[data-translate], [data-translate-title], [data-translate-value], [data-translate-placeholder]').forEach(child => {
            this.applyTranslationToSingleElement(child);
        });
    }

    applyTranslationToSingleElement(element) {
        // Handle data-translate attribute
        const translateKey = element.getAttribute('data-translate');
        if (translateKey) {
            const translation = this.t(translateKey);
            if (translation && translation !== translateKey) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        }

        // Handle data-translate-title attribute
        const titleKey = element.getAttribute('data-translate-title');
        if (titleKey) {
            const translation = this.t(titleKey);
            if (translation && translation !== titleKey) {
                element.title = translation;
            }
        }

        // Handle data-translate-value attribute
        const valueKey = element.getAttribute('data-translate-value');
        if (valueKey) {
            const translation = this.t(valueKey);
            if (translation && translation !== valueKey) {
                element.value = translation;
            }
        }

        // Handle data-translate-placeholder attribute
        const placeholderKey = element.getAttribute('data-translate-placeholder');
        if (placeholderKey) {
            const translation = this.t(placeholderKey);
            if (translation && translation !== placeholderKey) {
                element.placeholder = translation;
            }
        }
    }

    updateLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.value = this.currentLanguage;
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getAvailableLanguages() {
        return ['en', 'ru', 'kk'];
    }
}

// Create global language manager instance
window.languageManager = new LanguageManager();

// Helper function for translations
window.t = (key, params) => window.languageManager.t(key, params);

// При загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    const lang = localStorage.getItem('selectedLanguage') || 'kk';
    await languageManager.loadLanguage(); // Ждем загрузки языка
    
    // При выборе языка пользователем
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            const lang = e.target.value;
            localStorage.setItem('selectedLanguage', lang);
            location.reload(); // Перезагрузка с новым языком
        });
    }
});
