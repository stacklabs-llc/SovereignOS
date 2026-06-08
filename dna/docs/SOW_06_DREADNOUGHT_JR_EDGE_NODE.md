# SOW 06: DREADNOUGHT JR. (MOBILE EDGE NODE)
**VERTICAL:** Field Telemetry, Zero-Trust Ingress & Acoustic Sentinel
**STATUS:** Field-Deployed / Active Hardware
**HARDWARE NODES:** Node .114 (Mando)

## 1. EXECUTIVE SUMMARY
Unlike the stationary components of the Sovereign OS, Dreadnought Jr. is a fully realized, field-deployed Mobile Edge Node. It is not conceptual; it is actively gathering acoustic and biological telemetry in the wild. Acting as the "Mobile Command Dreadnought," it eliminates latency by tracking the "Atomic Ground Truth" of an event locally, before feeding the telemetry back to the Master Node via an encrypted mesh.

## 2. HARDWARE & POWER PURITY
* **The Core:** An aluminum-cased Raspberry Pi Zero 2 W (Node .114 / Mando).
* **Power Purity (Pw):** Sips power at a maximum of 5V / 2.5A, running entirely off a pocket-sized "onn" 10,000mAh dual-port battery bank. This bypasses the strict power constraints of the Pi 5, ensuring zero voltage sag and delivering 24+ hours of uninterrupted field deployment.

## 3. ZERO-TRUST NETWORK INGRESS
* **The Tether:** Achieves full mobility by tethering to an iPhone 5G hotspot.
* **The Anchor:** Remains seamlessly tethered to the Sovereign Master Node (.73) in Smyrna via the Tailscale encrypted mesh.
* **Objective:** Creates a Zero-Trust remote pipeline that securely ingests raw JSON payloads from public spaces (like Truist Park), entirely bypassing unreliable public stadium Wi-Fi by routing everything securely within the 100.x.x.x Tailscale subnet.

## 4. THE ECHO PROTOCOL & ACOUSTIC SOVEREIGNTY
* **Sensory Array:** Physically equipped with a SuziePi USB Mini Microphone attached via an OTG hub adapter.
* **Fast Fourier Transform (FFT):** Runs local edge-computed FFT scripts (`acoustic_trigger.py`) to isolate the specific 2kHz–5kHz frequency band that defines the crack of a baseball bat.
* **Latency Bypass:** By passing the strict 20,000.0 baseline threshold power, the node instantly fires a `KINETIC_AUDIO_TRIGGER` JSON payload back to Node .73, mathematically proving our patent claims and yielding an 18-to-40 second temporal advantage over TV broadcasts.

## 5. BIOLOGICAL SNIFFING & FIELD OPERATIONS
* **PLIE-R Forward Scout:** Deployed to Section 318 at Truist Park to execute acoustic ground-truth capturing.
* **Bio-Oracle Sniffer:** Leverages its onboard Bluetooth radio as a mobile BLE sniffer, triangulating RSSI signals from Sovereign biological assets (e.g., Metsy .173, Sam .172) when they breach the standard home perimeter.
