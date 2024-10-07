# AI Chatbot Project Setup Guide

This guide will walk you through setting up the AI Chatbot project from scratch, implementing the MVC design pattern using Next.js, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later) or yarn
- OpenAI API key
- Anthropic API key (optional, for Claude models)

## Step 1: Create a new Next.js project

1. Open your terminal and navigate to the directory where you want to create your project.
2. Run the following command to create a new Next.js project with TypeScript:

   ```bash
   npx create-next-app@latest ai-chatbot --typescript
   ```

3. When prompted, choose the following options:
   - Would you like to use ESLint? Yes
   - Would you like to use Tailwind CSS? Yes
   - Would you like to use `src/` directory? Yes
   - Would you like to use App Router? Yes
   - Would you like to customize the default import alias? No

4. Once the project is created, navigate into the project directory:

   ```bash
   cd ai-chatbot
   ```

## Step 2: Install additional dependencies

Install the required additional dependencies:

```bash
npm install ai openai-edge lucide-react
```

## Step 3: Set up the project structure

Create the following directories in your `src` folder:

```bash
mkdir src/models src/controllers src/components
```

## Step 4: Create the Model

Create a new file `src/models/ChatModel.ts` and add the following code:

```typescript
import { Configuration, OpenAIApi } from 'openai-edge'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface AIModel {
  id: string
  name: string
}

export class ChatModel {
  private openai: OpenAIApi
  private anthropicApiKey: string

  constructor() {
    const config = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.openai = new OpenAIApi(config)
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
  }

  async generateResponse(messages: Message[], model: string): Promise<ReadableStream> {
    if (model.startsWith('claude')) {
      const response = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        messages: messages.map((message) => ({
          content: message.content,
          role: message.role,
        })),
      })
      return response.body as ReadableStream;
    }
  }

  getAvailableModels(): AIModel[] {
    return [
      { id: 'gpt-3.5-turbo', name: 'GPT 3.5 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'claude-v1', name: 'Claude v1' },
      { id: 'claude-instant-v1', name: 'Claude Instant v1' },
      { id: 'text-davinci-003', name: 'Davinci' },
      { id: 'text-curie-001', name: 'Curie' },
    ]
  }
}
```

## Step 5: Create the Controller

Create a new file `src/controllers/ChatController.ts` and add the following code:

```typescript
import { ChatModel, Message, AIModel } from '../models/ChatModel'

export class ChatController {
  private model: ChatModel

  constructor() {
    this.model = new ChatModel()
  }

  async generateResponse(messages: Message[], selectedModel: string): Promise<ReadableStream> {
    return this.model.generateResponse(messages, selectedModel)
  }

  getAvailableModels(): AIModel[] {
    return this.model.getAvailableModels()
  }
}
```

## Step 6: Create the View (React Component)

Create a new file `src/components/AIChatbot.tsx` and add the following code:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Send, Loader2 } from 'lucide-react'
import { useChat } from 'ai/react'
import { ChatController } from '../controllers/ChatController'
import { Message, AIModel } from '../models/ChatModel'

export default function AIChatbot() {
  const controller = new ChatController()
  const aiModels = controller.getAvailableModels()

  const [selectedModel, setSelectedModel] = useState(aiModels[0].id)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    body: { model: selectedModel },
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Chatbot</h1>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <span>{aiModels.find(model => model.id === selectedModel)?.name}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id)
                    setIsDropdownOpen(false)
                  }}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-700 \${
                    selectedModel === model.id ? 'bg-indigo-600' : ''
                  }`}
                >
                  {model.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-3/4 \${
              message.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div
              className={`p-3 rounded-lg \${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center">
            An error occurred: {error.message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
```

## Step 7: Create the API route

Create a new file `src/app/api/chat/route.ts` and add the following code:

```typescript
import { ChatController } from '../../../controllers/ChatController'
import { StreamingTextResponse } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages, model } = await req.json()
  const controller = new ChatController()

  const stream = await controller.generateResponse(messages, model)

  return new StreamingTextResponse(stream)
}
```

## Step 8: Update the main page

Replace the contents of `src/app/page.tsx` with the following code:

```tsx
import AIChatbot from '../components/AIChatbot'

export default function Home() {
  return <AIChatbot />
}
```

## Step 9: Set up environment variables

Create a `.env.local` file in the root of your project and add the following:

```
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Replace `your_openai_api_key_here` and `your_anthropic_api_key_here` with your actual API keys.

## Step 10: Update .gitignore

Add the following line to your `.gitignore` file to ensure your API keys are not committed to version control:

```
.env.local
```

## Step 11: Run the development server

Start the development server by running:

```bash
npm run dev
```

Your AI Chatbot should now be running on `http://localhost:3000`.

## Next Steps

1. Implement error handling for API key configuration.
2. Add user authentication if required.
3. Implement message history persistence using a database.
4. Add more features like file uploads or voice input.
5. Optimize the chatbot for performance and responsiveness.

Congratulations! You've successfully set up the AI Chatbot project from scratch, implementing the MVC design pattern. This structure provides a solid foundation for further development and scaling of your chatbot application.
```

This guide provides a comprehensive walkthrough for setting up the AI Chatbot project from scratch, including all necessary steps and code snippets. It covers project initialization, dependency installation, implementation of the MVC pattern, component creation, and basic setup for running the application. The guide also includes suggestions for next steps to further enhance the chatbot functionality.


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
