interface VoiceGateResult {
  verified: boolean;
  text: string;
  similarity?: number;
  error?: string;
}

export async function verifyVoiceAuthorization(
  audioBase64: string,
  requiredPhrase: string = 'armor up'
): Promise<VoiceGateResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.DEXTER_VOICE_ID;

  if (!apiKey) {
    return { verified: false, text: '', error: 'ElevenLabs API key not configured' };
  }

  try {
    // 1. Speech to text - transcribe the audio
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });
    
    const formData = new FormData();
    formData.append('file', blob, 'audio.wav');
    formData.append('model_id', 'scribe_v1');

    const transcribeResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!transcribeResponse.ok) {
      const error = await transcribeResponse.text();
      return { verified: false, text: '', error: `Transcription failed: ${error}` };
    }

    const transcription = await transcribeResponse.json();
    const text = transcription.text?.toLowerCase() || '';

    // Check for required phrase
    if (!text.includes(requiredPhrase.toLowerCase())) {
      return { 
        verified: false, 
        text, 
        error: `Say "${requiredPhrase}" to authorize payment` 
      };
    }

    // 2. Voice verification (if voice ID is configured)
    if (voiceId) {
      const verifyFormData = new FormData();
      verifyFormData.append('audio', blob, 'audio.wav');

      const verifyResponse = await fetch(
        `https://api.elevenlabs.io/v1/voices/${voiceId}/verify`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
          },
          body: verifyFormData,
        }
      );

      if (verifyResponse.ok) {
        const verification = await verifyResponse.json();
        const similarity = verification.similarity || 0;
        
        if (similarity < 0.90) {
          return { 
            verified: false, 
            text, 
            similarity,
            error: 'Voice not recognized as Dexter Vann' 
          };
        }

        return { verified: true, text, similarity };
      }
    }

    // If no voice ID configured, just check the phrase
    return { verified: true, text };
  } catch (error) {
    return { verified: false, text: '', error: String(error) };
  }
}
