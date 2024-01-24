export interface ChatMessage {
  value: string;
}

interface FrontEndMessage {
  command: {
    name: string; // use enum
    data?: any; // define based on enum
  };
}