// Cold Boot Gem Pro – lightweight voice synthesis for mobile
// Load this script via <script src="/cold_boot_gem_pro.js"></script>
// Usage: ColdBootGem.speak('Hello, world!');

const ColdBootGem = (function() {
  // Private helper to select a suitable voice (prefer English, fallback to default)
  function getVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    // Prefer a voice with language starting with 'en'
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    return enVoice || voices[0];
  }

  // Ensure voices are loaded before speaking (some browsers need a short async delay)
  function ensureVoicesReady() {
    return new Promise(resolve => {
      if (window.speechSynthesis.getVoices().length) {
        resolve();
      } else {
        window.speechSynthesis.onvoiceschanged = () => resolve();
      }
    });
  }

  async function speak(text, options = {}) {
    if (!('speechSynthesis' in window)) {
      console.warn('ColdBootGem: Speech Synthesis API not supported in this browser.');
      return;
    }
    await ensureVoicesReady();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = getVoice();
    if (voice) utter.voice = voice;
    // Default rate 1.25x as per project spec, allow override via options
    utter.rate = options.rate || 1.25;
    utter.pitch = options.pitch || 1;
    utter.volume = options.volume || 1;
    // Optional callback when finished
    if (typeof options.onEnd === 'function') {
      utter.onend = options.onEnd;
    }
    window.speechSynthesis.speak(utter);
  }

  // Expose a simple API
  return {
    speak,
    // Convenience: speak and then execute a callback (e.g., after voice finishes)
    speakThen: async function(text, callback) {
      await speak(text, { onEnd: callback });
    }
  };
})();

// Export for module environments (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColdBootGem;
}
