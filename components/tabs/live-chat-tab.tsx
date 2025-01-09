'use client';

import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { GetCurrentData } from '@/actions/form';


export default function UserChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState({ id: null, isSupport: false });

  // Fetch initial messages and current user
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${currentUser.id}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const user = await GetCurrentData();
      const res = await fetch(`/api/messages?userId=${user.id}`);
      const data = await res.json();
      setMessages(data);
      setCurrentUser(user);
      if (user?.id) {
        socket.emit('register', user.id); // Emit the register event with the user's ID
        console.log(`Registered user with ID: ${user.id}`);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    // fetchMessages();
  }, []);

  useEffect(() => {
    const socket = io('https://srv677099.hstgr.cloud', {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('chat message', (msg) => {
      console.log(msg)
      if (msg.userId === currentUser.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('chat message');
    };
  }, [currentUser.id]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = null;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('https://srv677099.hstgr.cloud/upload/', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('File upload failed');
        }

        const data = await res.json();
        imageUrl = data.fileUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        return;
      }
    }

    const messageData = {
      content: input.trim(),
      userId: currentUser.id,
      imageUrl,
      isSupportMessage: false,
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const savedMessage = await res.json();
      // Emit the message via Socket.IO for real-time updates
      socket.emit('chat message', savedMessage);
      console.log(savedMessage)
      setMessages((prevMessages) => [...prevMessages, savedMessage]);
      setInput('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  console.log(messages)
  return (
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Chat with Support</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] sm:h-[300px] overflow-y-auto p-4">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`mb-4 ${message.isSupportMessage ? 'text-left' : 'text-right'} message`}
                >
                  <p className={`${message.isSupportMessage ? 'text-blue-500' : 'text-white'}`}>
                    {message.isSupportMessage ? 'Support' : 'You'}: {message.content}
                  </p>
                  {message.imageUrl && (
                      <img
                          src={message.imageUrl}
                          alt="Uploaded"
                          className="mt-2 max-w-xs"
                      />
                  )}
                </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSendMessage}>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full"
                />
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Input
                      type="file"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                      id="fileInput"
                  />
                  <Label htmlFor="fileInput">
                    {file ? (
                        <span className="text-blue-500 font-semibold">Photo Selected</span>
                    ) : (
                        <Paperclip />
                    )}
                  </Label>
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  );
}
