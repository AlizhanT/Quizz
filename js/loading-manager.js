// Loading Manager - Centralized loading animation management
class LoadingManager {
    constructor() {
        this.activeLoadings = new Set();
        this.overlay = null;
        this.init();
    }

    init() {
        // Create overlay if it doesn't exist
        if (!document.getElementById('loadingOverlay')) {
            this.createOverlay();
        }
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'loadingOverlay';
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner large"></div>
                <div class="loading-text">Loading...</div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }

    // Show loading overlay with custom text
    showOverlay(text = 'Loading...') {
        if (!this.overlay) {
            this.createOverlay();
        }
        
        const textElement = this.overlay.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = text;
        }
        
        this.overlay.classList.add('show');
        this.activeLoadings.add('overlay');
    }

    // Hide loading overlay
    hideOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
        }
        this.activeLoadings.delete('overlay');
    }

    // Show loading state on a button
    showButtonLoading(button, originalText = '') {
        if (!button) return;
        
        // Store original text if not already stored
        if (!button.dataset.originalText && originalText) {
            button.dataset.originalText = originalText;
        }
        
        button.classList.add('loading');
        button.disabled = true;
        this.activeLoadings.add(button);
    }

    // Hide loading state on a button
    hideButtonLoading(button) {
        if (!button) return;
        
        button.classList.remove('loading');
        button.disabled = false;
        this.activeLoadings.delete(button);
    }

    // Show loading state on a card
    showCardLoading(card) {
        if (!card) return;
        
        card.classList.add('loading');
        this.activeLoadings.add(card);
    }

    // Hide loading state on a card
    hideCardLoading(card) {
        if (!card) return;
        
        card.classList.remove('loading');
        this.activeLoadings.delete(card);
    }

    // Show loading state on a form
    showFormLoading(form) {
        if (!form) return;
        
        form.classList.add('form-loading');
        this.activeLoadings.add(form);
    }

    // Hide loading state on a form
    hideFormLoading(form) {
        if (!form) return;
        
        form.classList.remove('form-loading');
        this.activeLoadings.delete(form);
    }

    // Create skeleton cards for grid loading
    createSkeletonCards(container, count = 3) {
        if (!container) return;
        
        // Clear container and add skeleton cards
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'quiz-card skeleton-card';
            skeletonCard.innerHTML = `
                <div class="skeleton-header">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton-actions">
                        <div class="skeleton skeleton-btn"></div>
                        <div class="skeleton skeleton-btn"></div>
                    </div>
                </div>
                <div class="skeleton-info">
                    <div class="skeleton-stats">
                        <div class="skeleton skeleton-stat"></div>
                        <div class="skeleton skeleton-stat"></div>
                    </div>
                    <div class="skeleton skeleton-description"></div>
                    <div class="skeleton skeleton-description"></div>
                </div>
                <div class="skeleton-footer">
                    <div class="skeleton skeleton-footer-btn"></div>
                </div>
            `;
            container.appendChild(skeletonCard);
        }
        
        this.activeLoadings.add(container);
    }

    // Remove skeleton cards
    removeSkeletonCards(container) {
        if (!container) return;
        
        const skeletonCards = container.querySelectorAll('.skeleton-card');
        skeletonCards.forEach(card => card.remove());
        
        this.activeLoadings.delete(container);
    }

    // Show inline spinner
    showInlineSpinner(container, size = 'small') {
        if (!container) return;
        
        const spinner = document.createElement('div');
        spinner.className = `loading-spinner ${size}`;
        
        // Store original content
        if (!container.dataset.originalContent) {
            container.dataset.originalContent = container.innerHTML;
        }
        
        container.innerHTML = '';
        container.appendChild(spinner);
        this.activeLoadings.add(container);
    }

    // Hide inline spinner and restore original content
    hideInlineSpinner(container) {
        if (!container) return;
        
        if (container.dataset.originalContent) {
            container.innerHTML = container.dataset.originalContent;
            delete container.dataset.originalContent;
        }
        
        this.activeLoadings.delete(container);
    }

    // Show dots loading animation
    showDotsLoading(container, text = '') {
        if (!container) return;
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'loading-dots';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dotsContainer.appendChild(dot);
        }
        
        if (text) {
            const textSpan = document.createElement('span');
            textSpan.textContent = text;
            textSpan.style.marginLeft = '8px';
            dotsContainer.appendChild(textSpan);
        }
        
        // Store original content
        if (!container.dataset.originalContent) {
            container.dataset.originalContent = container.innerHTML;
        }
        
        container.innerHTML = '';
        container.appendChild(dotsContainer);
        this.activeLoadings.add(container);
    }

    // Hide dots loading
    hideDotsLoading(container) {
        if (!container) return;
        
        if (container.dataset.originalContent) {
            container.innerHTML = container.dataset.originalContent;
            delete container.dataset.originalContent;
        }
        
        this.activeLoadings.delete(container);
    }

    // Show progress bar
    showProgressBar(container) {
        if (!container) return;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = '<div class="progress-fill"></div>';
        
        // Store original content
        if (!container.dataset.originalContent) {
            container.dataset.originalContent = container.innerHTML;
        }
        
        container.innerHTML = '';
        container.appendChild(progressBar);
        this.activeLoadings.add(container);
    }

    // Hide progress bar
    hideProgressBar(container) {
        if (!container) return;
        
        if (container.dataset.originalContent) {
            container.innerHTML = container.dataset.originalContent;
            delete container.dataset.originalContent;
        }
        
        this.activeLoadings.delete(container);
    }

    // Clear all active loading states
    clearAll() {
        this.activeLoadings.forEach(element => {
            if (element === 'overlay') {
                this.hideOverlay();
            } else if (element && element.tagName) {
                // Handle different element types
                if (element.classList.contains('btn') || element.classList.contains('button')) {
                    this.hideButtonLoading(element);
                } else if (element.classList.contains('quiz-card')) {
                    this.hideCardLoading(element);
                } else if (element.classList.contains('form') || element.tagName === 'FORM') {
                    this.hideFormLoading(element);
                } else if (element.classList.contains('skeleton-card')) {
                    element.remove();
                } else {
                    // Generic cleanup
                    element.classList.remove('loading', 'form-loading');
                    if (element.dataset.originalContent) {
                        element.innerHTML = element.dataset.originalContent;
                        delete element.dataset.originalContent;
                    }
                }
            }
        });
        
        this.activeLoadings.clear();
    }

    // Check if any loading is active
    isLoading() {
        return this.activeLoadings.size > 0;
    }

    // Get count of active loading states
    getLoadingCount() {
        return this.activeLoadings.size;
    }
}

// Create global instance
window.loadingManager = new LoadingManager();

// Utility functions for common loading patterns
window.LoadingUtils = {
    // Wrap async function with loading overlay
    async withLoadingOverlay(asyncFn, loadingText = 'Loading...') {
        window.loadingManager.showOverlay(loadingText);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            window.loadingManager.hideOverlay();
        }
    },

    // Wrap async function with button loading
    async withButtonLoading(button, asyncFn, originalText = '') {
        window.loadingManager.showButtonLoading(button, originalText);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            window.loadingManager.hideButtonLoading(button);
        }
    },

    // Wrap async function with skeleton loading
    async withSkeletonLoading(container, asyncFn, skeletonCount = 3) {
        window.loadingManager.createSkeletonCards(container, skeletonCount);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            window.loadingManager.removeSkeletonCards(container);
        }
    },

    // Wrap async function with inline spinner
    async withInlineSpinner(container, asyncFn, size = 'small') {
        window.loadingManager.showInlineSpinner(container, size);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            window.loadingManager.hideInlineSpinner(container);
        }
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoadingManager, LoadingUtils };
}
