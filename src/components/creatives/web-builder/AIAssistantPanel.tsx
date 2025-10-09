import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, X } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AIAssistantPanel = ({ isOpen, onToggle }: AIAssistantPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-web-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            context: "Web builder interface",
          }),
        }
      );

      if (!response.ok || !response.body) {
        const error = await response.json();
        toast.error(error.error || "Failed to get AI response");
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to communicate with AI assistant");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`border-t border-white/10 bg-[#1a1a1a] transition-all duration-300 ${
        isOpen ? "h-80" : "h-12"
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full h-12 border-b border-white/10 flex items-center justify-between px-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-white">AI Assistant</span>
          {!isOpen && (
            <span className="text-xs text-white/50">Click to expand</span>
          )}
        </div>
        <div className="text-white/50 text-xs">
          {isOpen ? "Click to minimize" : "Get design help"}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="flex flex-col h-[calc(100%-3rem)]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center text-white/50 mt-4">
                <Sparkles className="h-10 w-10 mx-auto mb-3 text-blue-500/50" />
                <p className="text-sm">Ask me anything about web design!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-600/20 ml-auto max-w-[70%]"
                        : "bg-white/5 mr-auto max-w-[70%]"
                    }`}
                  >
                    <div className="text-xs text-white/50 mb-1">
                      {msg.role === "user" ? "You" : "AI"}
                    </div>
                    <div className="text-sm text-white/90 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask for design help..."
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
