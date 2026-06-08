# 🐎 Node .168 (Pegasus) — Hardware Manifest & Recommissioning Plan
**Status:** Ω=17.5 (PROVISIONING_USB_SSD)
**Last Updated:** April 1, 2026 (01:20 AM)

The Pegasus node is a 13-year-old self-built workstation recommissioned as the **LLM Dreadnought Engine** for the Sovereign OS. Its primary mission is to offload memory-intensive LLM personas (e.g., Tom A Hawk, Philly Phuck) from Node .73 to preserve flagship thermal stability and provide dedicated GPU horsepower.

---

## ⚙️ I. HARDWARE SPECIFICATIONS
*   **CPU**: Intel® Core™ i7-4790K @ 4.00GHz (4 Cores, 8 Threads).
*   **Memory (RAM)**: 16 GB Physical DDR3 (17 GB Total Virtual).
*   **GPU**: NVIDIA GeForce GTX 980 (4 GB VRAM).
    *   *Architecture*: Maxwell (Compute 5.2). Supported by Ollama via CUDA 11 fallback or OpenCL.
*   **Target Boot Drive**: **128GB USB 3.0 SSD** (repurposed from the Node .73 storage pool). 
    *   *Strategy*: Full installation of Ubuntu Server 24.04 LTS to the 128GB external SSD. This bypasses the need for shrunken partitions or Windows Boot Manager (GRUB) interference, satisfying Sovereign Rule 1 (Never Delete User Files). BIOS must be targeted to prioritizing the USB mass storage device.
    *   *Outcome*: Pegasus ONLY operates as the Sovereign LLM Dreadnought when booted into Ubuntu via the USB-SSD. It must NEVER be booted into Windows for Sovereign tasks.
*   **Secondary Storage (Data)**: Seagate ST3000DM001 (3TB HDD / 2.72TB Formatted). 
    *   *Mount Protocol*: Auto-mount to `/mnt/storage` in Linux. `/mnt/storage/ollama/models` established as the repository for all 7B+ parameter weights.
    *   *Windows Partition*: Accessible via NTFS-3G in read-only or read-write mode for cross-OS data persistence.

---

### 1. Bare-Metal Ubuntu Server 24.04 LTS (Headless)
To maximize the 4GB VRAM on the GTX 980, Node .168 must run a **Headless (CLI-only)** installation.
*   **WSL2 vs. Bare-Metal**: While WSL2 exists on the Windows 10 side, the GPU overhead and virtual network NAT make it inferior for Sovereign Node operations. Dual-booting into a dedicated Ubuntu Server environment reclaims ~1.2GB of VRAM and places the node directly on the local mesh.
*   **Provisioning**: The 128GB USB SSD provides ample speed for the OS and model caching without impacting internal drive partitions.

### 2. The Storage Logic (The HDD Mount)
Due to the high frequency of LLM model expansion (Mistral 7B = 4.1GB, Llama-3 8B = 4.7GB), the boot SSD must be protected from capacity crashes.
*   **Mount Point**: The 2.7TB Mechanical HDD must be mounted.
*   **Environment Var**: `OLLAMA_MODELS` must be explicitly pointed to the HDD mount path.
*   **Performance**: While loading models from HDD is slower than SSD (~10s vs ~2s), once the weights are in VRAM/RAM, inference speed is dictated by the GPU/CPU.

---

## 🤖 III. COGNITIVE LOADOUT (OLLAMA TARGETS)

| Model Name | Parameter Size | Usage Profile | VRAM Fit |
| :--- | :--- | :--- | :--- |
| **TinyLlama** | 1.1B | High-speed antagonist personas. | 100% in VRAM |
| **Mistral** | 7B | Complex reasoning / logic checks. | Partial Offload (VRAM + RAM) |
| **Llama-3** | 8B | Emotional fan personas. | Partial Offload |

---

## 🛠️ IV. RECOMMISSIONING CHECKLIST
1.  **Prep SSD**: Clear 128GB USB SSD from Node .73.
2.  **OS Flash**: Install Ubuntu Server 24.04 (Headless) directly to the external 128GB drive.
3.  **Tailscale Mesh**: Join the Sovereign Mesh as Node .168 (`192.168.1.168`).
4.  **GPU Drivers**: Install NVIDIA proprietary drivers (`ubuntu-drivers autoinstall`).
5.  **Ollama Config**:
    *   Install Ollama.
    *   Create `/mnt/storage/ollama/models`.
    *   Set `OLLAMA_MODELS=/mnt/storage/ollama/models` in the `systemd` service override.
6.  **FanStack Handshake**: Configure `fanstack_chatbots.py` to point to `100.90.6.117:11434` (Windows) or `192.168.1.168:11434` (Linux) for offloaded inference.

## 🏁 V. CMDB REGISTRATION
Node .168 was formally registered in the Sovereign CMDB on 2026-04-01:
```python
cmdb.register_node(
    node_id='Node .168', 
    hardware='Intel Core i7-4790K / GTX 980 / 16GB RAM', 
    agent_class='LLM Dreadnought Engine', 
    status='PROVISIONING', 
    primary_directives=['Serve Mistral/Llama3 via Ollama', 'Host VRAM-heavy AI operations'], 
    manifest_path='/home/james/apiary/dna/ci/pegasus.md'
)
```

---
` [ NODE_168 : DREADNOUGHT | STATUS: PROVISIONING_USB_SSD | Ω=17.5 ] `
