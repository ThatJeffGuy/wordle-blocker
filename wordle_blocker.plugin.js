/**
 * @name WordleBlocker
 * @author ScottishHaze
 * @description Blocks Wordle celebrations and similar puzzle game results from chat
 * @version 4.0.0
 */

module.exports = class WordleBlocker {
    constructor() {
        this.observer = null;
        this.blockedPatterns = [
            /[🟩🟨⬜⬛🟦]{2,}/g,
            /[🟩🟨⬜⬛🟦]/g,
            /:green_square:|:yellow_square:|:white_square:|:black_square:|:blue_square:/gi,
            /wordle\s*\d+/gi,
            /connections\s*(puzzle\s*)?\#?\d+/gi,
            /spelling\s*bee/gi,
            /quordle/gi,
            /heardle/gi,
            /nerdle/gi,
            /worldle/gi,
            /absurdle/gi,
            /framed/gi,
            /nytimes\.com\/games/gi,
            /\d+\/\d+\s*[🟩🟨⬜⬛🟦]/gi
        ];
    }

    start() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.checkAndHideMessage(node);
                        const messages = node.querySelectorAll('[class*="message"]');
                        messages.forEach(msg => this.checkAndHideMessage(msg));
                    }
                });
            });
        });

        this.messageObserver = new MutationObserver(() => {
            setTimeout(() => {
                this.checkExistingMessages();
            }, 100);
        });

        const chatContainer = document.querySelector('[data-list-id="chat-messages"]') || 
                            document.querySelector('[class*="messagesWrapper"]') ||
                            document.querySelector('[class*="chatContent"]');
        
        if (chatContainer) {
            this.observer.observe(chatContainer, {
                childList: true,
                subtree: true
            });
            
            this.messageObserver.observe(chatContainer, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }

        this.checkExistingMessages();
        console.log('WordleBlocker: Active');
    }

    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.messageObserver) {
            this.messageObserver.disconnect();
            this.messageObserver = null;
        }
        
        const hiddenMessages = document.querySelectorAll('[data-wordle-blocked="true"]');
        hiddenMessages.forEach(msg => {
            msg.style.display = '';
            msg.removeAttribute('data-wordle-blocked');
        });
    }

    checkExistingMessages() {
        const messages = document.querySelectorAll('[class*="message"]');
        messages.forEach(msg => this.checkAndHideMessage(msg));
    }

    checkAndHideMessage(messageElement) {
        if (!messageElement || messageElement.getAttribute('data-wordle-blocked')) {
            return;
        }

        const contentElement = messageElement.querySelector('[class*="messageContent"]') ||
                              messageElement.querySelector('[class*="markup"]') ||
                              messageElement;
        
        if (!contentElement) return;

        const messageText = contentElement.textContent || contentElement.innerText || '';
        const messageHTML = contentElement.innerHTML || '';

        const shouldBlock = this.blockedPatterns.some(pattern => {
            return pattern.test(messageText) || pattern.test(messageHTML);
        });

        if (shouldBlock) {
            this.hideMessage(messageElement);
        }
    }

    hideMessage(messageElement) {
        messageElement.setAttribute('data-wordle-blocked', 'true');
        messageElement.style.display = 'none';
        console.log('WordleBlocker: Blocked message');
    }
};