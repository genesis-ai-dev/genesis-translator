import { useState, useEffect } from "react";
import "./App.css";
import { ChatMessage, FrontEndMessage } from "../../types";
import ChatSection from "./components/chat-section";
const vscode = acquireVsCodeApi();

function App() {
  const [message, setMessage] = useState<ChatMessage>({ value: "" });
  const [messageLog, setMessageLog] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log({ message });
      switch (message.command) {
        case "setState": {
          const state = message.data;
          console.log({ state });
          break;
        }
        // Handle other cases
      }
    };

    window.addEventListener("message", handleMessage);

    const frontEndMessage: FrontEndMessage = {
      command: { name: "startChatServer" },
    };

    vscode.postMessage(frontEndMessage);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []); // The empty array means this effect runs once on mount and cleanup on unmount

  function handleHowdyClick() {
    setMessageLog([...messageLog, { value: message?.value }]);
    const frontEndMessage: FrontEndMessage = {
      command: { name: "handleChatRequest", data: { message } },
    };

    vscode.postMessage(frontEndMessage);
    // vscode.postMessage({
    //   command: "sendMessage",
    //   message: message, // Use the state variable here
    // });
    setMessage({ value: "" });
  }
  console.log("handleHowdyClick", handleHowdyClick);
  window.addEventListener(
    "message",
    (
      event: MessageEvent<{
        value: { message: ChatMessage };
        type: string;
      }>,
    ) => {
      // const message = event.data; // The JSON data our extension sent
      console.log({ event });
      setMessageLog([
        ...messageLog,
        { value: event.data.value.message?.value },
      ]);
      // switch (message.command) {
      //   case "setState": {
      //     // Handle the 'setState' message and update webview state
      //     const state = message.data;
      //     console.log({ state });
      //     // Use the state to update your webview content
      //     break;
      //   }
      // }
    },
  );
  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <ChatSection apiBaseUrl={apiBaseUrl} />
    </main>
  );
}

export default App;
