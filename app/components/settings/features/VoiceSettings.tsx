import { useCallback } from 'react';
import { useVoiceSettings } from '~/lib/hooks/useVoiceSettings';

export const VoiceSettingsComponent = () => {
  const { settings, availableVoices, updateSettings } = useVoiceSettings();

  const testVoice = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Test de la voix en français");
      utterance.lang = 'fr-FR';
      if (settings.voice) utterance.voice = settings.voice;
      utterance.volume = settings.volume;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.onerror = (event) => {
        console.error('Erreur lors de la synthèse vocale:', event);
        alert('Une erreur est survenue lors de la synthèse vocale. Veuillez réessayer.');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      alert('La synthèse vocale n\'est pas prise en charge par votre navigateur.');
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-bolt-elements-textPrimary">Paramètres de la voix</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
            Voix
          </label>
          <select
            value={settings.voice?.name || ''}
            onChange={(e) => {
              const voice = availableVoices.find(v => v.name === e.target.value);
              updateSettings({ voice });
            }}
            className="w-full px-3 py-2 bg-bolt-elements-item-backgroundDefault text-bolt-elements-textPrimary rounded border border-bolt-elements-item-borderDefault"
          >
            {availableVoices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
            Volume: {settings.volume.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
            Vitesse: {settings.rate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.rate}
            onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
            Hauteur: {settings.pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <button
          onClick={testVoice}
          className="px-4 py-2 bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundHover text-bolt-elements-textPrimary rounded border border-bolt-elements-item-borderDefault transition-colors"
        >
          Tester la voix
        </button>
      </div>
    </div>
  );
}; 