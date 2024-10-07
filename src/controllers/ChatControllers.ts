import { ChatModel, Message, AiModel } from "@/models/ChatModel";

export class ChatController {
    private model: ChatModel

    constructor() {
        this.model = new ChatModel()
    }

    async generateResponse( messages: Message[], selectedModel: string): Promise<ReadableStream> {
        return this.model.generateResponse(messages, selectedModel)
    }

    getAvailableModels(): AiModel[] {
        return this.model.getAvailableModels()
    }
}