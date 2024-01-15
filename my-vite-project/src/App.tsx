// import { vscode } from "./utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useEffect } from "react";

function App() {
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

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []); // The empty array means this effect runs once on mount and cleanup on unmount

  function handleHowdyClick() {
    // console.log("vscode", vscode);
    // vscode.postMessage({
    //   command: "openUsfmConverter",
    //   text: "Hey there partner! 🤠",
    // });
  }
  // console.log("getState", vscode.getState());
  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    console.log({ message });
    switch (message.command) {
      case "setState": {
        // Handle the 'setState' message and update webview state
        const state = message.data;
        console.log({ state });
        // Use the state to update your webview content
        break;
      }
    }
  });
  return (
    <main>
      <h1>Chat Window</h1>
      <div className="chat-container">
        {/* Chat messages will be displayed here */}
        {/* This is a placeholder for chat content */}
        <div className="chat-content">
          <p>User: Hello!</p>
          <p>\v 1 γιMuo la oro rorongmana tampungkae, ngae kao tu rong. Kao tu la Nutu nena kao I Nutu kena.</p>
          {/* More chat messages */}
        </div>
        {/* Input for sending messages */}
        <div className="chat-input">
          <VSCodeTextField placeholder="Type a message..." />
          <VSCodeButton onClick={() => handleHowdyClick()}>Send</VSCodeButton>
        </div>
      </div>
    </main>
  );
}

export default App;
