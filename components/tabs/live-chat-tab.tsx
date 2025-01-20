'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import io from 'socket.io-client';
import {Settings, ChevronDown, Paperclip, Send, X, ImageIcon} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { GetCurrentData } from '@/actions/form';
import Image from "next/image";

const socket = io('https://srv677099.hstgr.cloud', {
  path: '/socket.io',
  transports: ['websocket'],
  withCredentials: true,
});

export default function UserChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentUser, setCurrentUser] = useState({ id: null, isSupport: false });
  const [isTyping, setIsTyping] = useState(false);

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
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      socket.emit('register', currentUser.id);
      console.log(`Registered user with ID: ${currentUser.id}`);
    }
    socket.on('chat message', (msg) => {
      console.log(msg);
      if (msg.userId === currentUser.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('chat message');
    };
  }, [currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(previewUrl);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

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
      socket.emit('chat message', savedMessage);
      console.log(savedMessage);
      setMessages((prevMessages) => [...prevMessages, savedMessage]);
      setInput('');
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      adjustTextareaHeight();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };


  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '35px';
      textareaRef.current.style.height = (textareaRef.current.scrollHeight) + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  return (
      <div className={'h-full sm:h-full  w-full'}>
        <div
            className="w-full max-w-full h-full sm:h-[60vh] bg-white dark:bg-background rounded-[20px] overflow-hidden shadow-xl flex flex-col">
          {/* Header */}
          <div
              className="bg-sidebar dark:bg-sidebar-dark text-sidebar-foreground dark:text-sidebar-foreground-dark px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-gray-300 w-10 h-10 rounded-full flex items-center justify-center">
                <svg
                    className="w-6 h-6 text-sidebar dark:text-sidebar-dark"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium">CHAT WITH</div>
                <div className="text-lg font-bold">Support</div>
              </div>
            </div>

          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
                <div
                    key={message.id}
                    className={`flex ${message.isSupportMessage ? 'justify-start' : 'justify-end'} animate-fadeIn message`}
                >
                  <div
                      className={`max-w-[75%] rounded-[20px] px-4 py-3 ${
                          message.isSupportMessage
                              ? 'bg-sidebar-accent dark:bg-sidebar-accent-dark text-sidebar-accent-foreground dark:text-sidebar-accent-foreground-dark rounded-tl-none animate-slideInLeft'
                              : 'bg-sidebar dark:bg-sidebar-dark text-sidebar-foreground dark:text-sidebar-foreground-dark rounded-tr-none animate-slideInRight'
                      }`}
                  >
                    <p className="text-[15px] leading-[1.35] whitespace-pre-wrap">{message.content}</p>
                    {message.imageUrl && (
                        <Image
                            layout="responsive" // Ensures responsiveness
                            width={800} // Aspect ratio width
                            height={600} // Aspect ratio height
                            quality={75} // Optional: Adjust image quality
                            src={message.imageUrl || "/placeholder.svg"}
                            alt="Uploaded"
                            priority // Ensures above-the-fold image loads faster
                            className="mt-2 max-w-full rounded-lg cursor-pointer"
                            onClick={() => setFullSizeImage(message.imageUrl)}
                        />
                    )}
                  </div>
                </div>
            ))}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-border bg-white dark:bg-sidebar p-4">
            <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
              {file && (
                  <div className="relative bg-gray-100 dark:bg-sidebar p-2 rounded-md">
                    <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
              )}
              <div className="flex items-end gap-2 bg-gray-100 dark:bg-sidebar-border rounded-2xl p-2">
                <label htmlFor="fileInput" className="cursor-pointer p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                  <ImageIcon className={`h-5 w-5 ${file ? 'text-sidebar dark:text-sidebar-dark' : 'text-gray-400 dark:text-sidebar-accent'}`} />
                </label>
                <input
                    type="file"
                    id="fileInput"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                />
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none max-h-[100px]  py-1"
                    style={{ overflow: 'auto' }}
                />
                <button
                    type="submit"
                    className={`p-2 rounded-full ${input.trim() || file ? 'bg-sidebar dark:bg-sidebar-dark text-white' : 'bg-gray-200 dark:bg-sidebar-border text-gray-400 dark:text-sidebar-accent'} hover:opacity-90 transition-all duration-200`}
                    disabled={!input.trim() && !file}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Full-size Image Modal */}
        {fullSizeImage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                 onClick={() => setFullSizeImage(null)}>
              <div className="max-w-[90%] max-h-[90%]">
                <img src={fullSizeImage || "/placeholder.svg"} alt="Full-size"
                     className="max-w-full max-h-full object-contain"/>
              </div>
            </div>
        )}
      </div>
  );
}

