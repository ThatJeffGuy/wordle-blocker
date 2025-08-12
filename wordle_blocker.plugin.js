/**
 * @name WordleBlocker
 * @author ScottishHaze
 * @description Blocks Wordle celebrations and similar puzzle game results from chat
 * @version 1.15
 */

module.exports = class WordleBlocker {
    constructor() {
        this.observer = null;
        this.blockedPatterns = [
            /[🟩🟨⬜⬛🟦⬛️⬜️🟩️🟨️🟦️⬆️⬇️⬅️➡️◼️◻️▫️▪️]/g,
            /:green_square:|:yellow_square:|:white_square:|:black_square:|:blue_square:|:black_large_square:|:white_large_square:/gi,
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
            /\d+\/\d+\s*[🟩🟨⬜⬛🟦⬛️⬜️🟩️🟨️🟦️◼️◻️]/gi
        ];
    }

    start() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.processElement(node);
                    }
                });
            });
        });

        const chatContainer = document.querySelector('[data-list-id="chat-messages"]');
        
        if (chatContainer) {
            this.observer.observe(chatContainer, {
                childList: true,
                subtree: false
            });
        }

        this.checkAllMessages();
        console.log('WordleBlocker: Active');
    }

    processElement(element) {
        if (element.classList && element.classList.toString().includes('message')) {
            this.checkAndHideMessage(element);
        }
        
        const messages = element.querySelectorAll('[class*="messageListItem"], [class*="message-"]');
        messages.forEach(msg => {
            if (msg.querySelector) {
                this.checkAndHideMessage(msg);
            }
        });
    }

    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        const hiddenMessages = document.querySelectorAll('[data-wordle-blocked="true"]');
        hiddenMessages.forEach(msg => {
            msg.style.display = '';
            msg.removeAttribute('data-wordle-blocked');
        });
    }

    checkAllMessages() {
        const messages = document.querySelectorAll('[data-list-id="chat-messages"] [class*="messageListItem"]');
        messages.forEach(msg => {
            if (msg.querySelector && !msg.getAttribute('data-wordle-checked')) {
                this.checkAndHideMessage(msg);
                msg.setAttribute('data-wordle-checked', 'true');
            }
        });
    }

    checkAndHideMessage(messageElement) {
        if (!messageElement || messageElement.getAttribute('data-wordle-blocked')) {
            return;
        }

        try {
            const contentElement = messageElement.querySelector('[class*="messageContent"]') ||
                                  messageElement.querySelector('[class*="markup"]');
            
            if (!contentElement) return;

            const messageText = contentElement.textContent || '';
            const messageHTML = contentElement.innerHTML || '';

            const shouldBlock = this.blockedPatterns.some(pattern => {
                return pattern.test(messageText) || pattern.test(messageHTML);
            });

            if (shouldBlock) {
                this.hideMessage(messageElement);
            }
        } catch (e) {
            console.log('WordleBlocker: Error processing message', e);
        }
    }

    hideMessage(messageElement) {
        if (messageElement.getAttribute('data-wordle-blocked')) {
            return;
        }
        
        try {
            messageElement.setAttribute('data-wordle-blocked', 'true');
            messageElement.style.display = 'none';
            console.log('WordleBlocker: Blocked message');
        } catch (e) {
            console.log('WordleBlocker: Error hiding message', e);
        }
    }
};
