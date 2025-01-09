import { memo, useCallback, useState } from 'react';
import { Markdown } from './Markdown';
import type { JSONValue } from 'ai';
import { classNames } from '~/utils/classNames';
import WithTooltip from '~/components/ui/Tooltip';
import { useVoiceSettings } from '~/lib/hooks/useVoiceSettings';

interface AssistantMessageProps {
  content: string;
  annotations?: JSONValue[];
}

export const AssistantMessage = memo(({ content, annotations }: AssistantMessageProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { settings: voiceSettings } = useVoiceSettings();

  const filteredAnnotations = (annotations?.filter(
    (annotation: JSONValue) => annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
  ) || []) as { type: string; value: any }[];

  const usage: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  } = filteredAnnotations.find((annotation) => annotation.type === 'usage')?.value;

  const speak = useCallback(() => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'fr-FR';
      if (voiceSettings.voice) utterance.voice = voiceSettings.voice;
      utterance.volume = voiceSettings.volume;
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  }, [content, isSpeaking, voiceSettings]);

  return (
    <div className="overflow-hidden w-full">
      <div className="flex justify-between items-start mb-2">
        {usage && (
          <div className="text-sm text-bolt-elements-textSecondary">
            Tokens: {usage.totalTokens} (prompt: {usage.promptTokens}, completion: {usage.completionTokens})
          </div>
        )}
        <WithTooltip tooltip={isSpeaking ? "Arrêter la lecture" : "Lire le message"}>
          <button
            onClick={speak}
            className={classNames(
              'text-xl text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors',
              isSpeaking ? 'i-ph:speaker-high' : 'i-ph:speaker-none'
            )}
          />
        </WithTooltip>
      </div>

      <Markdown html>{content}</Markdown>
    </div>
  );
});
