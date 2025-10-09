import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Canvas as FabricCanvas } from 'fabric';
import { useWebBuilderAI } from '@/hooks/useWebBuilderAI';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  fabricCanvas: FabricCanvas | null;
  onTemplateGenerated?: (template: any) => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose, fabricCanvas, onTemplateGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I can help you create web designs. Try saying:\n\n• "Create a hero section with a heading and button"\n• "Add a navigation bar"\n• "Design a contact form"\n• "Create a pricing card"\n• "Add a footer section"'
    }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  // Use null for fabricCanvas since we're using GrapeJS now
  const { loading, generateTemplate } = useWebBuilderAI(
    null,
    onTemplateGenerated
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');

    // Always generate full templates for GrapeJS
    const response = await generateTemplate(userInput);

    if (response) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.explanation || 'Design created successfully!'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } else {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error creating that design. Please try again with a different prompt.'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    'Create a landing page for a SaaS product',
    'Generate a portfolio website template',
    'Add a hero section',
    'Design a pricing card',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h2 className="font-semibold text-white">AI Design Assistant</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-b bg-gray-50">
        <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="text-xs px-2 py-1 bg-white border rounded-full hover:bg-purple-50 hover:border-purple-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm text-gray-600">Creating your design...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to create..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Powered by Lovable AI • Press Enter to send
        </p>
      </div>
    </div>
  );
};