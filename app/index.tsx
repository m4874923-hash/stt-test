import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export default function STTScreen() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');

  // Event handlers
  useSpeechRecognitionEvent('start', () => {
    console.log('[STT] START');
    setStatus('Started');
    setListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('[STT] END');
    setStatus('Ended');
    setListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    console.log('[STT] RESULT:', JSON.stringify(event));
    const text = event.results?.[0]?.transcript?.trim();
    if (text) {
      setTranscript(text);
      setStatus(event.isFinal ? 'Final result received' : 'Interim result received');
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log('[STT] ERROR:', event.error, event.message);
    setError(`${event.error}: ${event.message}`);
    setStatus('Error');
    setListening(false);
  });

  const startRecognition = useCallback(async () => {
    setError(null);
    setTranscript('');
    setStatus('Requesting permission...');

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      console.log('[STT] Permission:', JSON.stringify(permission));

      if (!permission.granted) {
        setError('Microphone permission not granted');
        setStatus('Permission denied');
        return;
      }

      setStatus('Starting...');
      ExpoSpeechRecognitionModule.start({
        lang: 'fa-IR',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch (cause: unknown) {
      const msg = cause instanceof Error ? cause.message : 'Unknown error';
      console.error('[STT] Start error:', cause);
      setError(msg);
      setStatus('Start failed');
    }
  }, []);

  const stopRecognition = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
      setStatus('Stopping...');
    } catch (cause: unknown) {
      const msg = cause instanceof Error ? cause.message : 'Unknown error';
      setError(msg);
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stopRecognition();
    } else {
      void startRecognition();
    }
  }, [listening, startRecognition, stopRecognition]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>STT Test</Text>
      <Text style={styles.subtitle}>Proof of Concept</Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusValue}>{status}</Text>
      </View>

      <View style={styles.transcriptBox}>
        <Text style={styles.transcriptLabel}>Transcript:</Text>
        <Text style={styles.transcriptValue}>
          {transcript || '(هنوز چیزی گفته نشده)'}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorLabel}>Error:</Text>
          <Text style={styles.errorValue}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, listening && styles.buttonActive]}
        onPress={toggle}
      >
        <Text style={styles.buttonText}>
          {listening ? '⏹ توقف' : '🎤 شروع'}
        </Text>
      </Pressable>

      <Text style={styles.hint}>
        {listening ? 'حالا فارسی صحبت کن...' : 'برای شروع لمس کن'}
      </Text>

      <Text style={styles.platform}>Platform: {Platform.OS}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C18',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    color: '#F4F7FB',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#98A5B9',
    fontSize: 14,
    marginBottom: 8,
  },
  statusBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#161E2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#303A50',
    width: '100%',
  },
  statusLabel: {
    color: '#98A5B9',
    fontSize: 13,
  },
  statusValue: {
    color: '#18D7E8',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  transcriptBox: {
    padding: 16,
    backgroundColor: '#161E2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#303A50',
    width: '100%',
    minHeight: 100,
  },
  transcriptLabel: {
    color: '#98A5B9',
    fontSize: 12,
    marginBottom: 8,
  },
  transcriptValue: {
    color: '#F4F7FB',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorBox: {
    padding: 12,
    backgroundColor: '#2A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF687F',
    width: '100%',
  },
  errorLabel: {
    color: '#FF687F',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorValue: {
    color: '#FF687F',
    fontSize: 12,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: '#8C7CFF',
    borderRadius: 20,
    marginTop: 16,
  },
  buttonActive: {
    backgroundColor: '#FF687F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hint: {
    color: '#65728B',
    fontSize: 14,
    marginTop: 8,
  },
  platform: {
    color: '#65728B',
    fontSize: 11,
    marginTop: 16,
  },
});
