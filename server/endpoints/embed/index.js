const { v4: uuidv4 } = require("uuid");
const { reqBody, multiUserMode } = require("../../utils/http");
const { Telemetry } = require("../../models/telemetry");
const { streamChatWithForEmbed } = require("../../utils/chats/embed");
const { EmbedChats } = require("../../models/embedChats");
const {
  validEmbedConfig,
  canRespond,
  setConnectionMeta,
} = require("../../utils/middleware/embedMiddleware");
const {
  convertToChatHistory,
  writeResponseChunk,
} = require("../../utils/helpers/chat/responses");

function embeddedEndpoints(app) {
  if (!app) return;

  app.post(
    "/embed/:embedId/stream-chat",
    [validEmbedConfig, setConnectionMeta, canRespond],
    async (request, response) => {
      try {
        const embed = response.locals.embedConfig;
        const {
          sessionId,
          message,
          // optional keys for override of defaults if enabled.
          prompt = null,
          model = null,
          temperature = null,
          username = null,
        } = reqBody(request);

        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Connection", "keep-alive");
        response.flushHeaders();

        await streamChatWithForEmbed(response, embed, message, sessionId, {
          promptOverride: prompt,
          modelOverride: model,
          temperatureOverride: temperature,
          username,
        });
        await Telemetry.sendTelemetry("embed_sent_chat", {
          multiUserMode: multiUserMode(response),
          LLMSelection: process.env.LLM_PROVIDER || "openai",
          Embedder: process.env.EMBEDDING_ENGINE || "inherit",
          VectorDbSelection: process.env.VECTOR_DB || "lancedb",
        });
        response.end();
      } catch (e) {
        console.error(e);
        writeResponseChunk(response, {
          id: uuidv4(),
          type: "abort",
          sources: [],
          textResponse: null,
          close: true,
          error: e.message,
        });
        response.end();
      }
    }
  );

  app.get(
    "/embed/:embedId/:sessionId",
    [validEmbedConfig],
    async (request, response) => {
      try {
        const { sessionId } = request.params;
        const embed = response.locals.embedConfig;
        const history = await EmbedChats.forEmbedByUser(
          embed.id,
          sessionId,
          null,
          null,
          true
        );

        response.status(200).json({ history: convertToChatHistory(history) });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/embed/:embedId/:sessionId",
    [validEmbedConfig],
    async (request, response) => {
      try {
        const { sessionId } = request.params;
        const embed = response.locals.embedConfig;

        await EmbedChats.markHistoryInvalid(embed.id, sessionId);
        response.status(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/embed/:embedId/:sessionId/chat-feedback/:chatId",
    [validEmbedConfig],
    async (request, response) => {
      try {
        const { chatId } = request.params;
        const { feedback = null } = reqBody(request);
        const embed = response.locals.embedConfig;

        // Verify the chat belongs to this embed
        const existingChat = await EmbedChats.where({
          id: Number(chatId),
          embed_id: embed.id,
        });

        if (!existingChat || existingChat.length === 0) {
          response.status(404).json({ success: false, error: "Chat not found" });
          return;
        }

        const result = await EmbedChats.updateFeedbackScore(chatId, feedback);
        response.status(200).json({ success: result });
      } catch (error) {
        console.error("Error updating embed chat feedback:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  app.post(
    "/embed/:embedId/:sessionId/chat-feedback/:chatId/comment",
    [validEmbedConfig],
    async (request, response) => {
      try {
        const { chatId } = request.params;
        const { comment = null } = reqBody(request);
        const embed = response.locals.embedConfig;

        // Verify the chat belongs to this embed
        const existingChat = await EmbedChats.where({
          id: Number(chatId),
          embed_id: embed.id,
        });

        if (!existingChat || existingChat.length === 0) {
          response.status(404).json({ success: false, error: "Chat not found" });
          return;
        }

        const result = await EmbedChats.updateFeedbackComment(chatId, comment);
        response.status(200).json({ success: result });
      } catch (error) {
        console.error("Error updating embed chat feedback comment:", error);
        response.status(500).json({ success: false, error: error.message });
      }
    }
  );
}

module.exports = { embeddedEndpoints };
