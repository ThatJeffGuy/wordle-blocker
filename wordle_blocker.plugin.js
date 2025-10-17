/**
 * @name WordleBlocker
 * @author ScottishHaze
 * @description Blocks Wordle celebrations and similar puzzle game results from chat
 * @version 3.0 - Final?
 * @donate https://www.paypal.com/donate?token=TDoql1alt1c365GK9gdbysf0hHFKmbjjHgW93Kn_al8__EduYfvG41Peg_H_TNpI64JiGHs5l5Nvpu2w
 * @patreon None -- PayPal link above.
 * @website https://www.everydaysciencestuff.com/
 * @source https://github.com/ThatJeffGuy/wordle-blocker/blob/beta/wordle_blocker.plugin.js
 * @updateUrl https://github.com/ThatJeffGuy/wordle-blocker/blob/beta/wordle_blocker.plugin.js
 */

module.exports = class WordleBlocker {
    constructor() {
        this.observer = null;
        this.blockedPatterns = [
            /[⬜⬛🟩🟨🟦🟥🟧🟪🟫◼️◻️▫️▪️]{3,}/g,
            /:(?:green_square|yellow_square|white_square|black_square|blue_square|red_square|orange_square|purple_square|brown_square|black_large_square|white_large_square){3,}/gi,
            /wordle\s+\d+[,\s]+\d+\/6\*?/gi,
            /(?:absurdle|dordle|quordle|octordle|sedecordle|worldle|heardle|nerdle)\s+\d+/gi,
            /\d+\/\d+\s*\*?\s*[⬜⬛🟩🟨🟦🟥🟧🟪🟫◼️◻️▫️▪️]/g,
            /[🔲🔳◾◽▪▫]{3,}/g
        ];
        
        this.contextPatterns = [
            /\b(?:wordle|puzzle|daily|streak|guess|attempt)\b/gi,
            /\d+\/6\*?/g,
            /\d+\/\d+\s*attempts?/gi
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

        this.channelObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target && mutation.target.getAttribute && 
                    mutation.target.getAttribute('data-list-id') === 'chat-messages') {
                    setTimeout(() => {
                        this.scanChannelMessages();
                    }, 100);
                }
            });
        });

        const chatContainer = document.querySelector('[data-list-id="chat-messages"]');
        const appContainer = document.querySelector('#app-mount');
        
        if (chatContainer) {
            this.observer.observe(chatContainer, {
                childList: true,
                subtree: false
            });
        }

        if (appContainer) {
            this.channelObserver.observe(appContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-list-id']
            });
        }

        this.scanChannelMessages();
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
        if (this.channelObserver) {
            this.channelObserver.disconnect();
            this.channelObserver = null;
        }
        
        const hiddenMessages = document.querySelectorAll('[data-wordle-blocked="true"]');
        hiddenMessages.forEach(msg => {
            msg.style.display = '';
            msg.removeAttribute('data-wordle-blocked');
        });
    }

    scanChannelMessages() {
        const messages = document.querySelectorAll('[data-list-id="chat-messages"] [class*="messageListItem"]');
        messages.forEach(msg => {
            if (msg.querySelector && !msg.getAttribute('data-wordle-blocked')) {
                this.checkAndHideMessage(msg);
            }
        });
    }

    checkAndHideMessage(messageElement) {
        if (!messageElement || messageElement.getAttribute('data-wordle-blocked')) {
            return;
        }

        try {
            const mainMessage = messageElement.closest('[id*="chat-messages-"]') || messageElement;
            
            if (mainMessage.getAttribute('data-wordle-blocked')) {
                return;
            }

            const allContentElements = [
                ...mainMessage.querySelectorAll('[class*="messageContent"]'),
                ...mainMessage.querySelectorAll('[class*="markup"]'),
                ...mainMessage.querySelectorAll('[class*="repliedTextContent"]'),
                ...mainMessage.querySelectorAll('[class*="content"]')
            ];

            let fullMessageText = '';
            let fullMessageHTML = '';

            allContentElements.forEach(element => {
                const text = element.textContent || element.innerText || '';
                const html = element.innerHTML || '';
                fullMessageText += text + '\n';
                fullMessageHTML += html + '\n';
            });

            if (!fullMessageText.trim()) return;

            const hasGameEmojis = this.blockedPatterns.some(pattern => {
                return pattern.test(fullMessageText) || pattern.test(fullMessageHTML);
            });

            const hasGameContext = this.contextPatterns.some(pattern => {
                return pattern.test(fullMessageText);
            });

            if (hasGameEmojis || (hasGameContext && this.hasSquareEmojis(fullMessageText + fullMessageHTML))) {
                this.hideMessage(mainMessage);
            }

        } catch (e) {
        }
    }

    hasSquareEmojis(text) {
        const squareEmojiPattern = /[⬜⬛🟩🟨🟦🟥🟧🟪🟫◼️◻️▫️▪️🔲🔳◾◽▪▫]/;
        return squareEmojiPattern.test(text);
    }

    hideMessage(messageElement) {
        if (messageElement.getAttribute('data-wordle-blocked')) {
            return;
        }
        
        try {
            messageElement.setAttribute('data-wordle-blocked', 'true');
            messageElement.style.display = 'none';
        } catch (e) {
        }
    }
};
