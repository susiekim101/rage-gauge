class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this._buffer = []
        this._bufferLen = 0
        this._chunkSize = 4096
    }

    process(inputs) {
        const input = inputs[0]?.[0]
        if(!input) return true

        // Accumulate samples
        this._buffer.push(new Float32Array(input))
        this._bufferLen += input.length

        // Flush when we have enough
        if (this._bufferLen >= this._chunkSize) {
            const merged = new Float32Array(this._bufferLen)
            let offset = 0
            for(const chunk of this._buffer) {
                merged.set(chunk, offset)
                offset += chunk.length
            }
            this.port.postMessage(merged.buffer, [merged.buffer])
            this._buffer = []
            this._bufferLen = 0
        }
        return true
    }
}

registerProcessor('pcm-processor', PCMProcessor)