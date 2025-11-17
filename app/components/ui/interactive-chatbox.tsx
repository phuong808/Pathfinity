'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { ArrowUp, Paperclip, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PLACEHOLDER_QUESTIONS = [
  "Hey, welcome to UH! Want to explore majors, careers, or just browse interests?",
  "What classes did you actually enjoy in high school, even just a little?",
  "Tell me about your dream job - what would you love to do?",
  "What subjects make you curious or excited to learn more?",
  "Which activities or hobbies do you spend the most time on?",
] as const;

const TYPING_SPEED = 50; // ms per character
const QUESTION_DISPLAY_TIME = 3000; // ms to display full question

export const InteractiveChatbox = memo(function InteractiveChatbox() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const currentQuestion = PLACEHOLDER_QUESTIONS[currentQuestionIndex];
    
    if (displayedText.length < currentQuestion.length) {
      // Typing animation - add one character at a time
      const timeout = setTimeout(() => {
        setDisplayedText(currentQuestion.slice(0, displayedText.length + 1));
      }, TYPING_SPEED);
      
      return () => clearTimeout(timeout);
    } else if (displayedText === currentQuestion) {
      // Finished typing, wait before moving to next question
      const timeout = setTimeout(() => {
        setDisplayedText('');
        setCurrentQuestionIndex((prev) => (prev + 1) % PLACEHOLDER_QUESTIONS.length);
      }, QUESTION_DISPLAY_TIME);
      
      return () => clearTimeout(timeout);
    }
  }, [displayedText, currentQuestionIndex]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        {/* Hover Tooltip */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          <div className="bg-gray-200 text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap">
            <span className="font-medium">Try Pathfinity</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* Clickable Chatbox */}
        <div 
          onClick={handleClick}
          className="relative bg-white/55 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ring-6 ring-white/30 cursor-pointer"
        >
          {/* Top Row - Display area with typewriter text */}
          <div className="px-6 pt-5 pb-3">
            <div className="w-full text-base text-black min-h-[24px]">
              {displayedText}
              <span className="animate-pulse">|</span>
            </div>
          </div>
          
          {/* Bottom Row - Paperclip and Submit button (decorative) */}
          <div className="flex items-center justify-between px-6 pb-5 pt-2">
            <button
              type="button"
              title="Attach file"
              aria-label="Attach file"
              onClick={handleClick}
              className="p-2 rounded-lg text-gray-400 cursor-pointer"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              title="Send message"
              aria-label="Send message"
              onClick={handleClick}
              className="p-2.5 rounded-full bg-black text-white cursor-pointer"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
