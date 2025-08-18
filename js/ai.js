// --- AI Tutor Module ---

export class AiTutor {
    constructor(lessonPageInstance) {
        this.lessonPage = lessonPageInstance;
        this.apiKey = localStorage.getItem('geminiApiKey') || null;

        this.cacheDOMElements();
        this.bindEvents();

        this.chatHistory = [];
        this.isChatLoading = false;
    }

    cacheDOMElements() {
        this.fab = document.getElementById('ai-tutor-fab');
        this.overlay = document.getElementById('chat-overlay');
        this.closeBtn = document.getElementById('close-chat-btn');
        this.messagesContainer = document.getElementById('chat-messages');
        this.inputForm = document.getElementById('chat-input-form');
        this.input = document.getElementById('chat-input');
    }

    bindEvents() {
        this.fab.addEventListener('click', () => this.openChat());
        this.closeBtn.addEventListener('click', () => this.closeChat());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.closeChat();
        });
        this.inputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
    }

    openChat() {
        if (!this.apiKey) {
            this.apiKey = prompt("Please enter your Gemini API Key. It will be saved in your browser for future use.");
            if (this.apiKey) {
                localStorage.setItem('geminiApiKey', this.apiKey);
            } else {
                return; // User cancelled
            }
        }
        
        this.messagesContainer.innerHTML = '';
        this.chatHistory = [];
        const context = this.lessonPage.getCurrentContext();
        
        const systemPrompt = `You are an expert medical tutor. Your role is to help a medical student understand the provided context. Be encouraging, clear, and focus on clinical reasoning. The student is currently viewing the following content:\n\n${context}\n\nStart the conversation by welcoming the student and asking how you can help with this specific topic.`;
        
        this.chatHistory.push({ role: "system", parts: [{ text: systemPrompt }] });
        this.addMessageToChat('ai', "Welcome! I'm here to help. How can I clarify any part of this topic for you?");
        
        this.overlay.classList.add('visible');
        this.input.focus();
    }

    closeChat() {
        this.overlay.classList.remove('visible');
    }

    addMessageToChat(role, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', role);
        messageElement.textContent = text;
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showLoadingIndicator() {
        this.isChatLoading = true;
        const indicator = `
            <div class="chat-message ai loading" id="loading-indicator">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>`;
        this.messagesContainer.insertAdjacentHTML('beforeend', indicator);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    hideLoadingIndicator() {
        this.isChatLoading = false;
        const indicator = document.getElementById('loading-indicator');
        if (indicator) indicator.remove();
    }

    async handleSendMessage() {
        const userInput = this.input.value.trim();
        if (!userInput || this.isChatLoading) return;

        this.addMessageToChat('user', userInput);
        this.chatHistory.push({ role: "user", parts: [{ text: userInput }] });
        this.input.value = '';
        this.showLoadingIndicator();

        try {
            const aiResponse = await this.callGeminiAPI(this.chatHistory);
            this.hideLoadingIndicator();
            this.addMessageToChat('ai', aiResponse);
            this.chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
        } catch (error) {
            this.hideLoadingIndicator();
            this.addMessageToChat('ai', 'Sorry, an error occurred while trying to connect. Please try again.');
            console.error("Gemini API Error:", error);
        }
    }

    async callGeminiAPI(history, retries = 3, delay = 1000) {
        if (!this.apiKey) throw new Error("API Key is missing.");
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;
        
        const apiHistory = history.filter(msg => msg.role !== 'system').map(msg => ({
            role: msg.role === 'ai' ? 'model' : msg.role,
            parts: msg.parts
        }));
        
        const systemInstruction = history.find(msg => msg.role === 'system');
        const payload = {
            contents: apiHistory,
            systemInstruction: systemInstruction,
            generationConfig: {
                temperature: 0.7,
                topP: 1,
                topK: 1,
                maxOutputTokens: 2048,
            },
        };

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
                    return result.candidates[0].content.parts[0].text;
                } else {
                    return "I couldn't find an answer. Can you rephrase your question?";
                }
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            }
        }
    }
}
