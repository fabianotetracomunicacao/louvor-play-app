import { pipeline, env } from '@xenova/transformers';

// Configuration: Force remote execution but allow caching
env.allowLocalModels = false;
env.useBrowserCache = true; // Re-enable cache for performance
env.useFS = false; // Browser implementation

// Fix for Vite/Webpack returning 404/HTML for WASM files
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';

// Reduce ONNX verbosity
env.backends.onnx.logLevel = 'fatal';
env.backends.onnx.debug = false;

class WhisperService {
    constructor() {
        this.transcriber = null;
        this.modelName = 'Xenova/whisper-base'; // Balanced: Better than tiny, faster than small
        this.isReady = false;
        this.isListening = false;

        this.audioContext = null;
        this.mediaStream = null;
        this.processor = null;
        this.source = null;

        this.audioQueue = []; // Accumulates Float32 data
        this.isProcessing = false;
        this.chunkDuration = 2000; // ms to buffer before processing
        this.lastProcessTime = 0;
    }

    async loadModel(onProgress) {
        if (this.isReady) return;

        console.log("Loading Whisper Model:", this.modelName);

        // Helper to suppress specific verbose warnings from onnxruntime-web/transformers.js
        const restoreConsole = this._suppressConsoleWarnings();

        try {
            this.transcriber = await pipeline('automatic-speech-recognition', this.modelName, {
                progress_callback: (data) => {
                    if (onProgress) onProgress(data);
                }
            });
            this.isReady = true;
            console.log("Whisper Model Loaded Successfully");
        } catch (error) {
            console.error("Failed to load Whisper model:", error);
            throw error;
        } finally {
            // Always restore console, even if loading fails
            restoreConsole();
        }
    }

    // Temporary console wrapper to filter noise
    _suppressConsoleWarnings() {
        const originalWarn = console.warn;
        const originalLog = console.log;

        console.warn = (...args) => {
            const msg = args[0];
            if (typeof msg === 'string') {
                // Filter "Unable to determine content-length"
                if (msg.includes('Unable to determine content-length')) return;
                // Filter ONNX runtime graph optimization warnings
                if (msg.includes('CleanUnusedInitializersAndNodeArgs')) return;
                if (msg.includes('Removing initializer')) return;
            }
            originalWarn.apply(console, args);
        };

        // Some ONNX logs might come through log/error depending on build
        // leaving error alone to catch real issues, but filtering known noisy logs if they appear elsewhere is good practice.

        return () => {
            console.warn = originalWarn;
            console.log = originalLog;
        };
    }

    async startListening(onResult) {
        // Auto-heal: If HMR or other issue caused state reset, reload model silently.
        if (!this.isReady) {
            console.warn("WhisperService not ready (State lost?). Reloading model...");
            await this.loadModel();
        }

        if (this.isListening) return;

        this.isListening = true;
        this.audioQueue = [];

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

            // Resume context if suspended (common browser policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // --- AUDIO WORKLET IMPLEMENTATION ---
            // We use a Blob to inline the worker logic avoiding external file loading issues
            const workletCode = `
                class RecorderProcessor extends AudioWorkletProcessor {
                    process(inputs, outputs, parameters) {
                        const input = inputs[0];
                        if (input && input.length > 0) {
                            // Send the first channel data to main thread
                            this.port.postMessage(input[0]);
                        }
                        return true; // Keep alive
                    }
                }
                registerProcessor('recorder-processor', RecorderProcessor);
            `;

            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const workletUrl = URL.createObjectURL(blob);

            await this.audioContext.audioWorklet.addModule(workletUrl);

            this.processor = new AudioWorkletNode(this.audioContext, 'recorder-processor');

            this.processor.port.onmessage = (e) => {
                if (!this.isListening) return;

                const inputData = e.data; // Float32Array from worklet
                // Clone/Buffer logic
                this.audioQueue.push(new Float32Array(inputData));
                this.checkProcess(onResult);
            };

            this.source.connect(this.processor);
            // Worklets don't strictly need to connect to destination if they don't output audio,
            // but some browsers garbage collect them if unconnected.
            this.processor.connect(this.audioContext.destination);

        } catch (error) {
            console.error("Mic access error:", error);
            this.isListening = false;
            throw error;
        }
    }

    async checkProcess(onResult) {
        if (this.isProcessing) return;

        // Simple logic: If we have enough audio accumulated, assume it's a chunk and process it.
        // Better logic: Detect silence.

        // Total samples collected
        const totalSamples = this.audioQueue.reduce((acc, chunk) => acc + chunk.length, 0);
        const durationSec = totalSamples / 16000;

        // If > 3 seconds of audio (Balanced for Base model latency), let's process
        if (durationSec > 3.0) {
            this.isProcessing = true;

            // Merge chunks
            const merged = new Float32Array(totalSamples);
            let offset = 0;
            for (const chunk of this.audioQueue) {
                merged.set(chunk, offset);
                offset += chunk.length;
            }

            // Simple RMS (Root Mean Square) check for silence
            let sumSq = 0;
            for (let i = 0; i < merged.length; i++) {
                sumSq += merged[i] * merged[i];
            }
            const rms = Math.sqrt(sumSq / merged.length);
            // console.log("Audio RMS:", rms);

            // Silence threshold (experimental)
            if (rms < 0.01) {
                console.log("Silence detected (RMS < 0.01), skipping inference");
                this.audioQueue = []; // Clear silent buffer
                this.isProcessing = false;
                return;
            }

            // Let's clear queue for now to assume "Streaming" blocks.
            this.audioQueue = [];

            try {
                // Run Inference
                // console.log("Processing Chunk...", durationSec.toFixed(2) + "s");
                const result = await this.transcriber(merged, {
                    language: 'portuguese',
                    task: 'transcribe'
                });

                // console.log("Whisper Result:", result);
                if (result && result.text && result.text.length > 0) {
                    onResult(result.text.trim());
                }

            } catch (e) {
                console.error("Inference Error:", e);
            } finally {
                this.isProcessing = false;
            }
        }
    }

    stopListening() {
        this.isListening = false;
        if (this.source) this.source.disconnect();
        if (this.processor) this.processor.disconnect();
        if (this.mediaStream) this.mediaStream.getTracks().forEach(t => t.stop());
        if (this.audioContext) this.audioContext.close();

        this.source = null;
        this.processor = null;
        this.mediaStream = null;
        this.audioContext = null;
    }
}

export const whisperService = new WhisperService();
