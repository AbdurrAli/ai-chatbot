'use client'

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Send, Loader2 } from "lucide-react"
import { useChat } from "ai/react"
import { ChatController } from "@/controllers/ChatControllers"
import { Message, AiModel } from "../models/ChatModel"

export default function AIChatbot() {
    const controller = new ChatController()
    const aiModel = controller.getAvailableModels()

    const [selectedModel, setSelectedModel] = useState(aiModel[0].id)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)

    const {messages, input, handleInputChange, handleSubmit, isLoading, error} = useChat({
        api: '/api/chat',
        body: { model: selectedModel},
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
              <span>{aiModel.find(model => model.id === selectedModel)?.name}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                {aiModel.map((model) => (
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