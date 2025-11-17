"use client";

import { useState, useEffect, useRef, memo } from "react";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";

interface Course {
  name: string;
  credits: number;
}

interface Semester {
  semester_name: string;
  credits: number;
  courses: Course[];
}

interface Year {
  year_number: number;
  semesters: Semester[];
}

interface Pathway {
  program_name: string;
  institution: string;
  total_credits: number;
  years: Year[];
}

interface ChatMessage {
  id: number;
  role: "ai" | "user";
  content: string | React.ReactElement;
  delay: number;
  isPathwayChunk?: boolean; // To identify pathway-related messages
}

// Constants
const CONSISTENT_DELAY = 2500; // Consistent delay for all pathway chunks
const CONVERSATION_SWITCH_DELAY = 3000; // Wait time before switching conversations

// Helper function to format semester names
const formatSemesterName = (name: string) => {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Memoized Course List Component
const CourseList = memo(function CourseList({ courses }: { courses: Course[] }) {
  return (
    <ul className="pl-4 space-y-1">
      {courses.map((course, courseIdx) => (
        <li key={courseIdx} className="text-sm text-muted-foreground">
          • {course.name} - {course.credits} credits
        </li>
      ))}
    </ul>
  );
});

// Memoized Semester Component
const SemesterCard = memo(function SemesterCard({ semester }: { semester: Semester }) {
  return (
    <div className="space-y-2">
      <h5 className="text-base font-medium text-foreground">
        {formatSemesterName(semester.semester_name)} ({semester.credits} credits)
      </h5>
      <CourseList courses={semester.courses} />
    </div>
  );
});

// Memoized Message Component
const ChatMessageComponent = memo(function ChatMessageComponent({ 
  message 
}: { 
  message: ChatMessage 
}) {
  return (
    <div
      className={cn(
        "flex",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
          message.role === "user"
            ? "bg-primary text-primary-foreground shadow-md max-w-[80%]"
            : message.isPathwayChunk
            ? "bg-secondary text-secondary-foreground shadow-md sm:min-w-[60%] md:min-w-[60%] lg:min-w-[40%] min-w-[60%] max-w-[60%]"
            : "bg-secondary text-secondary-foreground shadow-md max-w-[80%]"
        )}
      >
        {typeof message.content === "string" ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
});

const pathways: Record<string, Pathway> = {
  biochemistry: {
    program_name: "Bachelor of Science (BS) in Biochemistry",
    institution: "University of Hawaiʻi at Mānoa",
    total_credits: 120,
    years: [
      {
        year_number: 1,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 15,
            courses: [
              { name: "CHEM 161 (DP)", credits: 3 },
              { name: "CHEM 161L (DY)", credits: 1 },
              { name: "MATH 241, 251A or 215 (FQ)", credits: 4 },
              { name: "BIOL 171 (DB)", credits: 3 },
              { name: "BIOL 171L", credits: 1 },
              { name: "FW", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 15,
            courses: [
              { name: "CHEM 162", credits: 3 },
              { name: "CHEM 162L", credits: 1 },
              { name: "MATH 242 or 252A", credits: 4 },
              { name: "BIOL 172", credits: 3 },
              { name: "BIOL 172L", credits: 1 },
              { name: "FG (A/B/C)", credits: 3 }
            ]
          }
        ]
      },
      {
        year_number: 2,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 16,
            courses: [
              { name: "CHEM 272", credits: 3 },
              { name: "CHEM 272L", credits: 2 },
              { name: "PHYS 170", credits: 4 },
              { name: "PHYS 170L", credits: 1 },
              { name: "HSL 101", credits: 3 },
              { name: "FG (A/B/C)", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 15,
            courses: [
              { name: "CHEM 273", credits: 3 },
              { name: "CHEM 273L", credits: 2 },
              { name: "PHYS 272", credits: 3 },
              { name: "PHYS 272L", credits: 1 },
              { name: "DS", credits: 3 },
              { name: "HSL 102", credits: 3 }
            ]
          }
        ]
      },
      {
        year_number: 3,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 17,
            courses: [
              { name: "BIOL 275", credits: 3 },
              { name: "BIOL 275L", credits: 2 },
              { name: "CHEM 372", credits: 3 },
              { name: "HSL 201", credits: 3 },
              { name: "DS", credits: 3 },
              { name: "DA/DH/DL", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 16,
            courses: [
              { name: "CHEM 274", credits: 3 },
              { name: "CHEM 274L", credits: 2 },
              { name: "Major Elective", credits: 3 },
              { name: "Major Elective", credits: 3 },
              { name: "Major Elective Lab", credits: 2 },
              { name: "HSL 202", credits: 3 }
            ]
          }
        ]
      },
      {
        year_number: 4,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 14,
            courses: [
              { name: "BIOL/MBBE 402", credits: 4 },
              { name: "CHEM 461", credits: 3 },
              { name: "Major Elective", credits: 3 },
              { name: "Major Elective Lab", credits: 2 },
              { name: "Elective", credits: 2 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 12,
            courses: [
              { name: "CHEM 462", credits: 3 },
              { name: "CHEM 462L", credits: 2 },
              { name: "Major Elective", credits: 3 },
              { name: "Elective (CHEM 380 rec.)", credits: 1 },
              { name: "DA/DH/DL", credits: 3 }
            ]
          }
        ]
      }
    ]
  },
  computerScience: {
    program_name: "Bachelor of Science (BS) in Computer Science",
    institution: "University of Hawaiʻi at Mānoa",
    total_credits: 120,
    years: [
      {
        year_number: 1,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 14,
            courses: [
              { name: "ICS 111", credits: 4 },
              { name: "MATH 215, 241 or 251A (FQ)", credits: 4 },
              { name: "FW", credits: 3 },
              { name: "FG (A/B/C)", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 17,
            courses: [
              { name: "ICS 141", credits: 3 },
              { name: "ICS 211", credits: 4 },
              { name: "MATH 242 or 252A", credits: 4 },
              { name: "FG (A/B/C)", credits: 3 },
              { name: "DS", credits: 3 }
            ]
          }
        ]
      },
      {
        year_number: 2,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 16,
            courses: [
              { name: "ICS 212", credits: 3 },
              { name: "ICS 241", credits: 3 },
              { name: "PHYS 151 or 170 (DP)", credits: 3 },
              { name: "PHYS 151L or 170L (DY)", credits: 1 },
              { name: "DA/DH/DL", credits: 3 },
              { name: "HSL 101", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 14,
            courses: [
              { name: "ICS 311", credits: 4 },
              { name: "ICS 314", credits: 3 },
              { name: "PHYS 152 or 272", credits: 3 },
              { name: "PHYS 152L or 272L", credits: 1 },
              { name: "HSL 102", credits: 3 }
            ]
          }
        ]
      },
      {
        year_number: 3,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 15,
            courses: [
              { name: "ICS 321", credits: 3 },
              { name: "ICS 312/331, 313/361 or 351/451", credits: 3 },
              { name: "MATH 307 or 372", credits: 3 },
              { name: "DS", credits: 3 },
              { name: "HSL 201", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 15,
            courses: [
              { name: "ICS 355", credits: 3 },
              { name: "ICS 312/331, 313/361 or 351/451", credits: 3 },
              { name: "DA/DH/DL 300+", credits: 3 },
              { name: "DB", credits: 3 },
              { name: "HSL 202", credits: 3 }
            ]
          }
        ]
      },
      {
        year_number: 4,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 16,
            courses: [
              { name: "ICS 332", credits: 3 },
              { name: "ICS 400+ Elective", credits: 3 },
              { name: "ICS 400+ Elective", credits: 3 },
              { name: "CHEM 161", credits: 3 },
              { name: "CHEM 161L", credits: 1 },
              { name: "Elective 300+", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 13,
            courses: [
              { name: "ICS 496", credits: 3 },
              { name: "ICS 400+ Elective", credits: 3 },
              { name: "ICS 400+ Elective", credits: 3 },
              { name: "CHEM 162", credits: 3 },
              { name: "CHEM 162L", credits: 1 }
            ]
          }
        ]
      }
    ]
  },
  finance: {
    program_name: "Bachelor of Business Administration (BBA) - Finance",
    institution: "University of Hawaiʻi at Mānoa",
    total_credits: 120,
    years: [
      {
        year_number: 1,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 15,
            courses: [
              { name: "ECON 130 (DS)", credits: 3 },
              { name: "PSY 100 or SOC 100 (DS)", credits: 3 },
              { name: "COMG 151 or 251 (DA)", credits: 3 },
              { name: "FW", credits: 3 },
              { name: "FG (A/B/C)", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 16,
            courses: [
              { name: "ECON 131 (DS)", credits: 3 },
              { name: "Calculus (FQ)", credits: 3 },
              { name: "FG (A/B/C)", credits: 3 },
              { name: "DH/DL", credits: 3 },
              { name: "DP (or DB)", credits: 3 },
              { name: "DY", credits: 1 }
            ]
          }
        ]
      },
      {
        year_number: 2,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 16,
            courses: [
              { name: "ACC 200", credits: 3 },
              { name: "Computer Competency", credits: 4 },
              { name: "DB (or DP)", credits: 3 },
              { name: "HSL 101 or Culture", credits: 3 },
              { name: "Elective", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 15,
            courses: [
              { name: "ACC 210", credits: 3 },
              { name: "BLAW 200", credits: 3 },
              { name: "BUS Communication", credits: 3 },
              { name: "HSL 102 or Culture", credits: 3 },
              { name: "Elective", credits: 3 }
            ]
          }
        ]
      },
      {
        year_number: 3,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 15,
            courses: [
              { name: "BUS 310", credits: 3 },
              { name: "BUS 311", credits: 3 },
              { name: "BUS 314", credits: 3 },
              { name: "Non-BUS Elective 300+", credits: 3 },
              { name: "HSL 201 or Culture", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 15,
            courses: [
              { name: "BUS 312/313", credits: 3 },
              { name: "BUS 315", credits: 3 },
              { name: "FIN 311", credits: 3 },
              { name: "FIN Elective 300+", credits: 3 },
              { name: "HSL 202 or Culture", credits: 3 }
            ]
          }
        ]
      },
      {
        year_number: 4,
        semesters: [
          {
            semester_name: "fall_semester",
            credits: 15,
            courses: [
              { name: "BUS 312/313", credits: 3 },
              { name: "FIN Elective 300+", credits: 3 },
              { name: "FIN Elective 300+", credits: 3 },
              { name: "Non-BUS / Non-major", credits: 3 },
              { name: "Elective 300+ (BUS 395 recommended)", credits: 3 }
            ]
          },
          {
            semester_name: "spring_semester",
            credits: 13,
            courses: [
              { name: "BUS 345", credits: 3 },
              { name: "FIN Elective 300+", credits: 3 },
              { name: "IB Elective", credits: 3 },
              { name: "Non-BUS / Non-major Elective 300+", credits: 3 },
              { name: "Elective", credits: 1 }
            ]
          }
        ]
      }
    ]
  }
};

// Helper function to create pathway message chunks
const createPathwayMessages = (pathway: Pathway, startId: number): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  let currentId = startId;

  // First message: Program info
  const programInfo = (
    <div className="space-y-2">
      <h3 className="text-xl font-bold text-foreground">{pathway.program_name}</h3>
      <p className="text-sm text-muted-foreground">{pathway.institution}</p>
      <p className="text-sm font-medium text-muted-foreground">
        Total Credits: {pathway.total_credits}
      </p>
    </div>
  );
  
  messages.push({
    id: currentId++,
    role: "ai",
    content: programInfo,
    delay: CONSISTENT_DELAY,
    isPathwayChunk: true,
  });

  // For each year
  pathway.years.forEach((year) => {
    // Year header message
    const yearHeader = (
      <div>
        <h4 className="text-lg font-semibold text-foreground border-b pb-2">
          Year {year.year_number}
        </h4>
      </div>
    );
    
    messages.push({
      id: currentId++,
      role: "ai",
      content: yearHeader,
      delay: CONSISTENT_DELAY,
      isPathwayChunk: true,
    });

    // For each semester in the year
    year.semesters
      .filter((semester) => semester.courses.length > 0)
      .forEach((semester) => {
        const semesterContent = <SemesterCard key={currentId} semester={semester} />;
        
        messages.push({
          id: currentId++,
          role: "ai",
          content: semesterContent,
          delay: CONSISTENT_DELAY,
          isPathwayChunk: true,
        });
      });
  });

  return messages;
};

const conversations: Record<string, ChatMessage[]> = {
  biochemistry: [
    {
      id: 1,
      role: "ai",
      content:
        "Based on what you've shared, I'm noticing some patterns: You're drawn to understanding how things work at a molecular level, and you have a strong interest in health sciences and research. Does that resonate with you?",
      delay: 1500,
    },
    {
      id: 2,
      role: "user",
      content: "That's spot on. I guess I do care a lot about understanding biological processes and how they impact human health.",
      delay: 2500,
    },
    {
      id: 3,
      role: "ai",
      content:
        "Here are a few directions that might align with what you've told me: Biochemistry (molecular biology and health applications), Molecular Cell Biology (cellular-level research), or Microbiology (disease and immune systems). What's your gut reaction to these?",
      delay: 3000,
    },
    {
      id: 4,
      role: "user",
      content: "Wait, Biochemistry could lead to the kind of work I'm interested in? Tell me more.",
      delay: 2500,
    },
    ...createPathwayMessages(pathways.biochemistry, 5),
  ],
  computerScience: [
    {
      id: 1,
      role: "ai",
      content:
        "Based on what you've shared, I'm noticing some patterns: You enjoy problem-solving, building things, and working with technology. You're interested in creating solutions that have real-world impact. Does that resonate with you?",
      delay: 1500,
    },
    {
      id: 2,
      role: "user",
      content: "That's spot on. I guess I do care a lot about using technology to solve problems and create innovative solutions.",
      delay: 2500,
    },
    {
      id: 3,
      role: "ai",
      content:
        "Here are a few directions that might align with what you've told me: Computer Science (software development and algorithms), Data Science (analytics and machine learning), or Information Technology (systems and networks). What's your gut reaction to these?",
      delay: 3000,
    },
    {
      id: 4,
      role: "user",
      content: "Wait, Computer Science could lead to the kind of work I'm interested in? Tell me more.",
      delay: 2500,
    },
    ...createPathwayMessages(pathways.computerScience, 5),
  ],
  finance: [
    {
      id: 1,
      role: "ai",
      content:
        "Based on what you've shared, I'm noticing some patterns: You're interested in markets, investments, and how money flows through economies. You enjoy analyzing data and making strategic decisions. Does that resonate with you?",
      delay: 1500,
    },
    {
      id: 2,
      role: "user",
      content: "That's spot on. I guess I do care a lot about understanding financial systems and helping people make smart investment decisions.",
      delay: 2500,
    },
    {
      id: 3,
      role: "ai",
      content:
        "Here are a few directions that might align with what you've told me: Finance (corporate finance and investments), Accounting (financial reporting and analysis), or Economics (market analysis and policy). What's your gut reaction to these?",
      delay: 3000,
    },
    {
      id: 4,
      role: "user",
      content: "Wait, Finance could lead to the kind of work I'm interested in? Tell me more.",
      delay: 2500,
    },
    ...createPathwayMessages(pathways.finance, 5),
  ],
};

export default function SampleConversation() {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentConversation, setCurrentConversation] = useState<keyof typeof conversations>("biochemistry");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const switchConversationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messages = conversations[currentConversation];

  useEffect(() => {
    if (currentIndex < messages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, messages[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, messages[currentIndex].delay);

      return () => clearTimeout(timer);
    } else {
      // All messages have been shown, wait 3 seconds then switch to next conversation
      if (switchConversationTimerRef.current) {
        clearTimeout(switchConversationTimerRef.current);
      }
      switchConversationTimerRef.current = setTimeout(() => {
        const conversationKeys = Object.keys(conversations) as (keyof typeof conversations)[];
        const currentIdx = conversationKeys.indexOf(currentConversation);
        const nextIdx = (currentIdx + 1) % conversationKeys.length;
        setCurrentConversation(conversationKeys[nextIdx]);
        setVisibleMessages([]);
        setCurrentIndex(0);
      }, CONVERSATION_SWITCH_DELAY);
    }
  }, [currentIndex, messages, currentConversation]);

  // Auto-scroll to bottom when new messages appear with smooth animation
  useEffect(() => {
    if (chatContainerRef.current && visibleMessages.length > 0) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [visibleMessages]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (switchConversationTimerRef.current) {
        clearTimeout(switchConversationTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full space-y-4 pointer-events-none">
      <Card className="bg-transparent backdrop-blur-none border-0 shadow-none">
        <div
          ref={chatContainerRef}
          className="h-[500px] overflow-y-auto space-y-4 p-6 scrollbar-hide"
        >
          {visibleMessages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
        </div>
      </Card>
    </div>
  );
}
