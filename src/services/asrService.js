// Service to handle Vosk ASR logic
import { createModel } from 'vosk-browser';

class ASRService {
    constructor() {
        this.model = null;
        this.recognizer = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.source = null;
        this.processor = null;
        this.isReady = false;
        this.isListening = false;
    }

    async loadModel(modelUrl) {
        if (this.model) return;

        try {
            console.log(`Loading Vosk Model from ${modelUrl}...`);
            this.model = await createModel(modelUrl);

            this.recognizer = new this.model.KaldiRecognizer(16000);
            this.recognizer.setWords(true);

            this.isReady = true;
            console.log('Vosk Model loaded successfully.');
        } catch (error) {
            console.error('Failed to load ASR model:', error);
            throw error;
        }
    }

    async startListening(onResult, onPartialResult, grammarWords = null) {
        if (!this.isReady) throw new Error('Model not loaded. Call loadModel() first.');
        if (this.isListening) return;

        try {
            // Re-initialize recognizer with grammar if provided
            // This forces the model to only "hear" words from the list, improving accuracy MASSIVELY.
            if (grammarWords && this.model) {
                console.log("Applying Grammar/Vocabulary restriction...");

                // Cleanup old recognizer if exists
                if (this.recognizer) {
                    try {
                        this.recognizer.remove(); // Vosk-browser specific cleanup often named remove() or delete()
                    } catch (e) { /* ignore */ }
                }

                const grammarStr = JSON.stringify(grammarWords);
                this.recognizer = new this.model.KaldiRecognizer(16000, grammarStr);
                this.recognizer.setWords(true);
            }

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1,
                    sampleRate: 16000
                }
            });

            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.processor.onaudioprocess = (event) => {
                if (!this.recognizer) return;

                const inputBuffer = event.inputBuffer;
                const inputData = inputBuffer.getChannelData(0);

                // DEBUG: Check for silence
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                if (Math.random() < 0.05) { // Log occasional samples
                    console.log('Audio Level (RMS):', rms.toFixed(4));
                }

                try {
                    // Check if recognizer is valid
                    if (this.recognizer) {
                        const inProcess = this.recognizer.acceptWaveform(event.inputBuffer);
                    }
                } catch (e) {
                    console.error("Vosk acceptWaveform error:", e);
                }
            };

            // Re-attach Event listeners (since we might have recreated the recognizer)
            this.recognizer.on("result", (message) => {
                // console.log("Vosk Result Event:", message);
                if (onResult && message.result && message.result.text) {
                    console.log("Transcript:", message.result.text);
                    onResult(message.result.text);
                }
            });

            this.recognizer.on("partialresult", (message) => {
                // console.log("Vosk Partial:", message);
                if (onPartialResult && message.result && message.result.partial) {
                    onPartialResult(message.result.partial);
                }
            });

            this.isListening = true;
            console.log('ASR Started');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }

    stopListening() {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isListening = false;
        console.log('ASR Stopped');
    }

    terminate() {
        this.stopListening();
        if (this.model) {
            this.model.terminate();
            this.model = null;
        }
    }
}

export const asrService = new ASRService();
