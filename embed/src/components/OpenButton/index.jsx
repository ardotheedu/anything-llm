import {
  Plus,
  ChatCircleDots,
  Headset,
  Binoculars,
  MagnifyingGlass,
  MagicWand,
} from "@phosphor-icons/react";
import { useState } from "react";

const CHAT_ICONS = {
  plus: Plus,
  chatBubble: ChatCircleDots,
  support: Headset,
  search2: Binoculars,
  search: MagnifyingGlass,
  magic: MagicWand,
};

export default function OpenButton({ settings, isOpen, toggleOpen }) {
  const [isHovered, setIsHovered] = useState(false);
  
  if (isOpen) return null;
  
  return (
    <div className="allm-relative allm-flex allm-items-center allm-gap-x-3">
      {/* Mensagem de hover */}
      <div
        className={`allm-bg-white allm-text-gray-800 allm-px-4 allm-py-2 allm-rounded-lg allm-shadow-lg allm-whitespace-nowrap allm-transition-all allm-duration-300 ${
          isHovered ? "allm-opacity-100 allm-translate-x-0" : "allm-opacity-0 allm-translate-x-4 allm-pointer-events-none"
        }`}
        style={{
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        Olá, eu sou o Ohmnis. Posso ajudar?
      </div>
      
      {/* Botão */}
      <button
        style={{
          backgroundColor: settings.buttonColor,
          padding: 0,
          width: isHovered ? 64 : 56,
          height: isHovered ? 64 : 56,
          transition: "width 0.3s ease, height 0.3s ease",
        }}
        id="anything-llm-embed-chat-button"
        onClick={toggleOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hover:allm-cursor-pointer allm-border-none allm-flex allm-items-center allm-justify-center allm-rounded-full allm-text-white allm-text-2xl hover:allm-opacity-95`}
        aria-label="Toggle Menu"
      >
        <img
          src={settings.brandImageUrl}
          alt="Brand"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />
      </button>
    </div>
  );
}
