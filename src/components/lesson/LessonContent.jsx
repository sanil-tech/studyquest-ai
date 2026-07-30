import React from "react";
import ReactMarkdown from "react-markdown";
import InfoCard from "./InfoCard";

export default function LessonContent({ content }) {
  // Remove IMAGE tags from markdown content (they're rendered separately)
  const cleanContent = content.replace(/\[IMAGE:[^\]]*\]/g, "");
  
  // Parse info cards from markdown content
  const parseContent = (text) => {
    const parts = [];
    let lastIndex = 0;
    
    // Match info cards: [REMEMBER]...[/REMEMBER], [EXAMPLE]...[/EXAMPLE], etc.
    const cardRegex = /\[(REMEMBER|EXAMPLE|MISTAKE|TIP|FACT|STORY)\]([\s\S]*?)\[\/\1\]/g;
    let match;
    
    while ((match = cardRegex.exec(text)) !== null) {
      // Add text before the card
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      
      // Add the card
      const cardType = match[1].toLowerCase();
      parts.push({ type: "card", cardType, content: match[2].trim() });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.slice(lastIndex) });
    }
    
    return parts;
  };

  const parts = parseContent(cleanContent);

  return (
    <div className="lesson-content space-y-4">
      {parts.map((part, idx) => {
        if (part.type === "card") {
          return (
            <InfoCard key={idx} type={part.cardType}>
              <ReactMarkdown>{part.content}</ReactMarkdown>
            </InfoCard>
          );
        }
        
        return (
          <div key={idx} className="text-base">
            <ReactMarkdown>{part.content}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}