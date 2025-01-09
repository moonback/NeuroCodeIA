import { useState, useEffect } from 'react';

export interface VoiceSettings {
  voice: SpeechSynthesisVoice | null;
  volume: number;
  rate: number;
  pitch: number;
}

const VOICE_SETTINGS_KEY = 'neurocode_voice_settings';

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(VOICE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          voice: null, // On ne peut pas sérialiser la voix, on la réinitialise au chargement
          volume: parsed.volume ?? 1,
          rate: parsed.rate ?? 1,
          pitch: parsed.pitch ?? 1
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres vocaux:', error);
    }
    return {
      voice: null,
      volume: 1,
      rate: 1,
      pitch: 1
    };
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Voix disponibles:', voices);
      const googleFrenchVoice = voices.find(voice => voice.name.includes('Google') && voice.lang.startsWith('fr'));
      const frenchVoices = voices.filter(voice => voice.lang.startsWith('fr'));
      setAvailableVoices(frenchVoices);
      if (googleFrenchVoice) {
        setSettings(prev => ({ ...prev, voice: googleFrenchVoice }));
      } else if (frenchVoices.length > 0 && !settings.voice) {
        setSettings(prev => ({ ...prev, voice: frenchVoices[0] }));
      }
    };

    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    // On sauvegarde les paramètres sans la voix
    const { voice, ...settingsToSave } = settings;
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settingsToSave));
  }, [settings]);

  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    availableVoices,
    updateSettings
  };
} 