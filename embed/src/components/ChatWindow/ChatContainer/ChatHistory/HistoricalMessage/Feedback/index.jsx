import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "@phosphor-icons/react";
import ChatService from "@/models/chatService";
import { embedderSettings } from "@/main";

export default function Feedback({ chatId, feedbackScore, sessionId }) {
  const [score, setScore] = useState(feedbackScore);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (newScore) => {
    try {
      // Se clicar no mesmo botão, remove o feedback
      const finalScore = score === newScore ? null : newScore;

      console.log("Feedback component - chatId:", chatId, "sessionId:", sessionId, "score:", finalScore);

      setScore(finalScore);

      // Envia o feedback para o backend
      // debug log to inspect exact payload sent
      console.debug("Sending feedback payload:", {
        url: `${embedderSettings.settings.baseApiUrl}/${embedderSettings.settings.embedId}/${sessionId}/chat-feedback/${chatId}`,
        feedback: finalScore,
      });

      await ChatService.updateFeedback(
        embedderSettings.settings,
        sessionId,
        chatId,
        finalScore
      );

      // Se for feedback negativo e não estava selecionado antes, abre o modal
      if (newScore === false && score !== false) {
        setShowCommentModal(true);
      }
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await ChatService.updateFeedbackComment(
        embedderSettings.settings,
        sessionId,
        chatId,
        comment
      );
      setShowCommentModal(false);
      setComment("");
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="allm-flex allm-gap-x-2 allm-mt-2">
        <button
          onClick={() => handleFeedback(true)}
          className={`allm-p-1.5 allm-rounded allm-border-none allm-cursor-pointer allm-transition-colors ${
            score === true
              ? "allm-bg-green-500/20 allm-text-green-500"
              : "allm-bg-transparent allm-text-gray-400 hover:allm-text-green-500 hover:allm-bg-green-500/10"
          }`}
          aria-label="Feedback positivo"
          title="Resposta útil"
        >
          <ThumbsUp size={16} weight={score === true ? "fill" : "regular"} />
        </button>

        <button
          onClick={() => handleFeedback(false)}
          className={`allm-p-1.5 allm-rounded allm-border-none allm-cursor-pointer allm-transition-colors ${
            score === false
              ? "allm-bg-red-500/20 allm-text-red-500"
              : "allm-bg-transparent allm-text-gray-400 hover:allm-text-red-500 hover:allm-bg-red-500/10"
          }`}
          aria-label="Feedback negativo"
          title="Resposta não útil"
        >
          <ThumbsDown size={16} weight={score === false ? "fill" : "regular"} />
        </button>
      </div>

      {/* Modal de Comentário */}
      {showCommentModal && (
        <div className="allm-fixed allm-inset-0 allm-bg-black/50 allm-flex allm-items-center allm-justify-center allm-z-[9999]">
          <div className="allm-bg-black-900 allm-rounded-lg allm-p-6 allm-max-w-md allm-w-full allm-mx-4 allm-shadow-xl allm-border allm-border-gray-700">
            <h3 className="allm-text-lg allm-font-bold allm-text-white allm-mb-3">
              O que podemos melhorar?
            </h3>
            <p className="allm-text-sm allm-text-gray-400 allm-mb-4">
              Seu comentário nos ajuda a melhorar as respostas. (Opcional)
            </p>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva o que não foi útil..."
              className="allm-w-full allm-bg-black allm-text-white allm-border allm-border-gray-700 allm-rounded allm-p-3 allm-text-sm allm-min-h-[100px] allm-resize-none focus:allm-outline-none focus:allm-border-cyan-400"
              maxLength={500}
            />

            <div className="allm-flex allm-gap-x-2 allm-mt-4 allm-justify-end">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setComment("");
                }}
                className="allm-px-4 allm-py-2 allm-bg-gray-700 allm-text-white allm-rounded allm-border-none allm-cursor-pointer hover:allm-bg-gray-600 allm-transition-colors"
                disabled={isSubmitting}
              >
                Pular
              </button>

              <button
                onClick={handleCommentSubmit}
                disabled={!comment.trim() || isSubmitting}
                className="allm-px-4 allm-py-2 allm-bg-cyan-500 allm-text-white allm-rounded allm-border-none allm-cursor-pointer hover:allm-bg-cyan-600 allm-transition-colors disabled:allm-opacity-50 disabled:allm-cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
