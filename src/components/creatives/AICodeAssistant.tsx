import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Send, 
  Code2, 
  Palette, 
  CheckCircle2, 
  Copy, 
  Download,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICodeAssistantProps {
  className?: string;
}

export const AICodeAssistant: React.FC<AICodeAssistantProps> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'code' | 'design' | 'review'>('code');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Code copied successfully',
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-code-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content })).concat([
              { role: userMessage.role, content: userMessage.content }
            ]),
            mode,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: 'Rate limit exceeded',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive',
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: 'Credits required',
            description: 'Please add credits to continue using AI features.',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    
                    if (lastMessage?.role === 'assistant') {
                      newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        content: assistantContent,
                      };
                    } else {
                      newMessages.push({
                        role: 'assistant',
                        content: assistantContent,
                        timestamp: new Date(),
                      });
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = {
    code: [
      'Create a modern hero section component',
      'Build a pricing card with hover effects',
      'Generate a responsive navigation bar',
    ],
    design: [
      'Review my color scheme',
      'Suggest improvements for this layout',
      'Make this design more modern',
    ],
    review: [
      'Review this React component',
      'Check for performance issues',
      'Suggest accessibility improvements',
    ],
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
      isExpanded ? "h-[500px]" : "h-14",
      className
    )}>
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-14 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-between px-4 cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">AI Code Assistant</h3>
          {!isExpanded && messages.length > 0 && (
            <span className="text-white/70 text-sm">
              ({messages.length} messages)
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Main Content */}
      {isExpanded && (
        <div className="h-[calc(100%-56px)] bg-background border-t flex flex-col">
          {/* Mode Selector */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="border-b">
            <TabsList className="w-full grid grid-cols-3 rounded-none h-12">
              <TabsTrigger value="code" className="gap-2">
                <Code2 className="w-4 h-4" />
                Generate Code
              </TabsTrigger>
              <TabsTrigger value="design" className="gap-2">
                <Palette className="w-4 h-4" />
                Design Tips
              </TabsTrigger>
              <TabsTrigger value="review" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Code Review
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Quick Prompts */}
          {messages.length === 0 && (
            <div className="p-3 border-b bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts[mode].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="text-xs px-3 py-1.5 bg-background border rounded-full hover:bg-accent hover:border-primary/50 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {mode === 'code' && 'Ask me to generate any React component or web design'}
                    {mode === 'design' && 'Get expert design recommendations and tips'}
                    {mode === 'review' && 'Submit your code for a thorough review'}
                  </p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content.includes('```') ? (
                        <div className="space-y-2">
                          {message.content.split('```').map((part, i) => {
                            if (i % 2 === 0) {
                              return <p key={i} className="whitespace-pre-wrap m-0">{part}</p>;
                            }
                            const [lang, ...code] = part.split('\n');
                            const codeContent = code.join('\n');
                            return (
                              <div key={i} className="relative group">
                                <div className="flex items-center justify-between bg-muted-foreground/10 px-3 py-1 rounded-t">
                                  <span className="text-xs font-mono">{lang || 'code'}</span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(codeContent)}
                                      className="h-6 px-2"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <pre className="m-0 p-3 bg-muted-foreground/10 rounded-b overflow-x-auto">
                                  <code className="text-xs">{codeContent}</code>
                                </pre>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap m-0">{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  mode === 'code' 
                    ? "Describe the component you want to create..."
                    : mode === 'design'
                    ? "Describe what you want to improve..."
                    : "Paste your code for review..."
                }
                disabled={isLoading}
                className="min-h-[60px] max-h-[120px] resize-none"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-[60px] w-[60px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Powered by Lovable AI • Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
