/**
 * @name WordleBlocker
 * @author ScottishHaze
 * @description Blocks Wordle celebrations and similar puzzle game results from chat
 * @version 1.14
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

        this.messageObserver = new MutationObserver(() => {
            setTimeout(() => {
                this.checkAllMessages();
            }, 50);
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
                characterData: true,
                attributes: true
            });
        }

        this.checkAllMessages();
        this.startPeriodicCheck();
        console.log('WordleBlocker: Active');
    }

    startPeriodicCheck() {
        this.periodicInterval = setInterval(() => {
            this.checkAllMessages();
        }, 5000);
    }

    processElement(element) {
        this.checkAndHideMessage(element);
        const messages = element.querySelectorAll('[class*="message"], [id*="message"], [class*="cozy"], [class*="compact"]');
        messages.forEach(msg => this.checkAndHideMessage(msg));
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
        if (this.periodicInterval) {
            clearInterval(this.periodicInterval);
            this.periodicInterval = null;
        }
        
        const hiddenMessages = document.querySelectorAll('[data-wordle-blocked="true"]');
        hiddenMessages.forEach(msg => {
            msg.style.display = '';
            msg.removeAttribute('data-wordle-blocked');
        });
    }

    checkAllMessages() {
        const messages = document.querySelectorAll('[class*="message"], [id*="message"], [class*="cozy"], [class*="compact"]');
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
            const mainMessage = messageElement.closest('[class*="message"][id]') || messageElement;
            this.hideMessage(mainMessage);
        }
    }

    hideMessage(messageElement) {
        const mainMessage = messageElement.closest('[class*="message"][id]') || messageElement;
        
        if (mainMessage.getAttribute('data-wordle-blocked')) {
            return;
        }
        
        mainMessage.setAttribute('data-wordle-blocked', 'true');
        mainMessage.style.display = 'none';
        console.log('WordleBlocker: Blocked message');
    }
};
