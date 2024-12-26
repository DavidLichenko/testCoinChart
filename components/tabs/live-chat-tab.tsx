import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from 'lucide-react'

export default function LiveChatTab() {
  const [message, setMessage] = useState('')

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Live Chat</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] sm:h-[200px] overflow-y-auto p-4">
          {/* Chat messages would go here */}
          <p>Welcome to live chat support!</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full"
            />
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Input type="file" className="w-full sm:w-auto" />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

