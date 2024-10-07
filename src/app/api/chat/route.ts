import { ChatController } from '../../../controllers/ChatControllers'
import { StreamingTextResponse } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages, model } = await req.json()
  const controller = new ChatController()

  const stream = await controller.generateResponse(messages, model)

  return new StreamingTextResponse(stream)
}