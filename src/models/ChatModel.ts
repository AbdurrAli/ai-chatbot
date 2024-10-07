import { promises } from "dns";
import { Configuration, OpenAIApi } from "openai-edge";

export interface Message {
    role: 'user' | 'assistant'
    content: string 
}

export interface AiModel {
    id: string
    name: string 
}

export class ChatModel {
    private openai: OpenAIApi
    private anthropicApiKey: string

    constructor() {
        const config = new Configuration({
            apiKey: process.env.OPEN_API_KEY
        })
        this.openai = new OpenAIApi(config)
        this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
    }

    async generateResponse(messages: Message[], model: string): Promise<ReadableStream> {
        if (model.startsWith('claude')) {
            const response = await fetch('https://api.anthropic.com/v1/complete', {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'X-API-Key': this.anthropicApiKey,
                },
                body: JSON.stringify({
                    prompt: messages.map((m) => `\${m.role}: \${m.content}`).join('\n') + '\nassistant:',
                    model: model,
                    max_tokens_to_sample: 1000,
                    stream: true,
                }),
            });
            return response.body as ReadableStream;
        } else {
            const response = await this.openai.createChatCompletion({
                model: model || 'gpt-3.5-turbo',
                stream: true,
                messages: messages.map((messages) => ({
                    content: messages.content,
                    role: messages.role,
                })),
            })
            return response.body as ReadableStream
        }
    }
    
    getAvailableModels(): AiModel[] {
        return [
            {id: 'gpt-3.5-turbo', name: 'GPT 3.5 Turbo'},
            {id: 'gpt-4', name: 'GPT-4'},
            {id: 'claude-v1', name: 'Claude v1'},
            {id: 'claude-instant-v1', name: 'Claude Instant v1'},
            {id: 'text-davinci-003', name: 'Davinci'},
            {id: 'text-curie-001', name: 'Curie'},
        ]
    }

}