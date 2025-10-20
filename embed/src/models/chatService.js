import { fetchEventSource } from "@microsoft/fetch-event-source";
import { v4 } from "uuid";

const ChatService = {
  embedSessionHistory: async function (embedSettings, sessionId) {
    const { embedId, baseApiUrl } = embedSettings;
    return await fetch(`${baseApiUrl}/${embedId}/${sessionId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Invalid response from server");
      })
      .then((res) => {
        return res.history.map((msg) => ({
          ...msg,
          id: v4(),
          sender: msg.role === "user" ? "user" : "system",
          textResponse: msg.content,
          close: false,
        }));
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  },
  resetEmbedChatSession: async function (embedSettings, sessionId) {
    const { baseApiUrl, embedId } = embedSettings;
    return await fetch(`${baseApiUrl}/${embedId}/${sessionId}`, {
      method: "DELETE",
    })
      .then((res) => res.ok)
      .catch(() => false);
  },
  streamChat: async function (sessionId, embedSettings, message, handleChat) {
    const { baseApiUrl, embedId, username } = embedSettings;
    const overrides = {
      prompt: embedSettings?.prompt ?? null,
      model: embedSettings?.model ?? null,
      temperature: embedSettings?.temperature ?? null,
    };

    const ctrl = new AbortController();
    await fetchEventSource(`${baseApiUrl}/${embedId}/stream-chat`, {
      method: "POST",
      body: JSON.stringify({
        message,
        sessionId,
        username,
        ...overrides,
      }),
      signal: ctrl.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) {
          return; // everything's good
        } else if (response.status >= 400) {
          await response
            .json()
            .then((serverResponse) => {
              handleChat(serverResponse);
            })
            .catch(() => {
              handleChat({
                id: v4(),
                type: "abort",
                textResponse: null,
                sources: [],
                close: true,
                error: `An error occurred while streaming response. Code ${response.status}`,
              });
            });
          ctrl.abort();
          throw new Error();
        } else {
          handleChat({
            id: v4(),
            type: "abort",
            textResponse: null,
            sources: [],
            close: true,
            error: `An error occurred while streaming response. Unknown Error.`,
          });
          ctrl.abort();
          throw new Error("Unknown Error");
        }
      },
      async onmessage(msg) {
        try {
          const chatResult = JSON.parse(msg.data);
          handleChat(chatResult);
        } catch {}
      },
      onerror(err) {
        handleChat({
          id: v4(),
          type: "abort",
          textResponse: null,
          sources: [],
          close: true,
          error: `An error occurred while streaming response. ${err.message}`,
        });
        ctrl.abort();
        throw new Error();
      },
    });
  },

  updateFeedback: async function (embedSettings, sessionId, chatId, feedbackScore) {
    const { baseApiUrl, embedId } = embedSettings;
    // send explicit boolean (true/false) or null per backend expectation
    const feedback = feedbackScore === null ? null : (feedbackScore ? true : false);

    const url = `${baseApiUrl}/${embedId}/${sessionId}/chat-feedback/${chatId}`;
    const body = { feedback };
    console.log("Enviando feedback para:", url, "payload:", body);

    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const text = await res.text();
        console.log("Resposta do servidor:", res.status, text);

        if (res.ok) {
          // try to parse JSON response, otherwise return success flag
          try {
            return JSON.parse(text);
          } catch (e) {
            return { success: true };
          }
        }
        // include response text in thrown error to aid debugging
        throw new Error(`Failed to update feedback: ${res.status} - ${text}`);
      })
      .catch((e) => {
        console.error("Error updating feedback:", e);
        throw e;
      });
  },

  updateFeedbackComment: async function (embedSettings, sessionId, chatId, comment) {
    const { baseApiUrl, embedId } = embedSettings;
    
    const url = `${baseApiUrl}/${embedId}/${sessionId}/chat-feedback/${chatId}/comment`;
    console.log("Enviando comentário para:", url);
    
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
    })
      .then(async (res) => {
        const text = await res.text();
        console.log("Resposta do servidor (comentário):", res.status, text);
        
        if (res.ok) {
          try {
            return JSON.parse(text);
          } catch (e) {
            return { success: true };
          }
        }
        throw new Error(`Failed to update feedback comment: ${res.status} - ${text}`);
      })
      .catch((e) => {
        console.error("Error updating feedback comment:", e);
        throw e;
      });
  },
};

export default ChatService;
