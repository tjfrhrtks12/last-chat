import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "안녕하세요! AI 어시스턴트입니다. 무엇을 도와드릴까요? 🤖",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 초기 높이 리셋
      textarea.style.height = 'auto';
      
      // 정확한 스크롤 높이 계산
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const paddingTop = parseInt(getComputedStyle(textarea).paddingTop);
      const paddingBottom = parseInt(getComputedStyle(textarea).paddingBottom);
      
      // 7줄 높이 계산 (패딩 포함)
      const sevenLineHeight = (lineHeight * 7) + paddingTop + paddingBottom;
      
      if (scrollHeight > sevenLineHeight) {
        // 8줄 이상일 때
        textarea.style.height = `${sevenLineHeight}px`;
        textarea.style.overflowY = 'auto';
        // 스크롤바가 나타날 때 추가 패딩 적용
        textarea.style.paddingRight = '20px';
      } else {
        // 7줄 이하일 때
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
        // 스크롤바가 없을 때 기본 패딩
        textarea.style.paddingRight = '16px';
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // 입력창 완전 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.overflowY = 'hidden';
      textareaRef.current.style.paddingRight = '16px';
    }

    try {
      // 백엔드 API 호출
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputText
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage: Message = {
          id: Date.now() + 1,
          text: data.response,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('AI 응답을 받지 못했습니다.');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`chatbot-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="chatbot-sidebar-content">
        <div className="chatbot-header">
          <div className="chatbot-title">
            <span className="chatbot-icon">🤖</span>
            <span>AI 어시스턴트</span>
          </div>
          <button 
            className="chatbot-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.isUser ? 'user' : 'ai'}`}
            >
              <div className="message-content">
                {message.text}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message ai">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            rows={1}
            ref={textareaRef}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="send-button"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 