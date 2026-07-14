# SOW 11: CMDB PORT MAPPING ALIGNMENT (PORTAL RECOVERY)
**VERTICAL:** Sovereign OS Infrastructure & Core Registry Alignment
**STATUS:** Blueprinting / Jam Session (Pending Spark Work Order Generation)

## 1. EXECUTIVE SUMMARY
The Active Stacks Grid in the Sovereign OS Portal (`01_Sovereign_Portal`, Port 3016) queries the CMDB application registry (`cmdb_ci_appl` table in `/home/james/SovereignOS/dna/sovereign_now.db`) to render interactive cards for accessing various mission stacks. Due to config drift between the physical Vite dev servers launched by `restart_stack.sh` and the hardcoded seed list in `scripts/sync_modules_db.py`, the ports, names, and icons on the cards have become severely misaligned. 

This document defines the exact extent of this mapping drift so that automated agents (such as Spark) can generate accurate remediation scripts.

---

## 2. CONFIGURATION DRIFT ANALYSIS

There is a fundamental mismatch between the **Vite Launch Configuration** (defined in `restart_stack.sh`) and the **CMDB Seed Config** (defined in `sync_modules_db.py`). 

### Port Mappings Conflict Grid

| Target Port | Actual Vite Instance (Launched by `restart_stack.sh`) | Database Registry Assignment (`sync_modules_db.py`) | Resulting UI Defect |
| :--- | :--- | :--- | :--- |
| **`3016`** | **Sovereign OS Portal** (`01_Sovereign_Portal`) | `gonzas` (Gonzas Convenience & Cantina) | The main base portal on port 3016 displays a card pointing to itself labeled **Gonzas Convenience & Cantina**. |
| **`3017`** | **Storybook Station** (`23_EileenStack` - Eileen's Stack) | `gardenstack` (GardenStack) | Accessing Eileen's Stack loads port 3017, but the card in the UI claims it is **GardenStack** (which is directory `21_Wildseed_GardenStack` and is not running). |
| **`3022`** | **Clio Cockpit Dashboard** (`apps/clio_cockpit`) | `anvil_twine` (Anvil & Twine) | Accessing Clio Cockpit loads port 3022, but the card in the UI claims it is **Anvil & Twine** (which is not running). |
| **`3000`** | **StackLabs Monolith** (`16_StackLabsLLC`) | `stacklabs` (StackLabs LLC) | This mapping is functionally correct, but the default URL `https://clio.taila01894.ts.net/` is expected to load the main portal (which is currently on `3016`), causing path routing confusion. |
| **`3024`** | **SamTracker Frontend** (`14_SamTracker`) | `samtracker` (Port `3004` in DB) | The physical frontend runs on port 3024, but the registry points to port 3004, breaking the "Access Stack" hyperlink. |

---

## 3. PHYSICAL DIRECTORIES TO PORTS DEFINITION (THE GROUND TRUTH)

The following represents the true structural mappings of the React/Vite stacks inside `/home/james/SovereignOS/`:

*   **`01_Sovereign_Portal`**: Sovereign OS Portal (Base of operations) $\rightarrow$ **Port 3016**
*   **`02_Sovereign_Media`**: Sovereign Cinema (Streaming Portal) $\rightarrow$ **Port 3008**
*   **`14_SamTracker`**: SamTracker Frontend $\rightarrow$ **Port 3024**
*   **`15_FanStack`**: FanStack Creator Portal $\rightarrow$ **Port 3009**
*   **`16_StackLabsLLC`**: StackLabs Monolith $\rightarrow$ **Port 3000**
*   **`17_GonzasCantina`**: Gonzas Cantina (Decommissioned/Staged) $\rightarrow$ **No Port / Port 3026**
*   **`18_BarbStack`**: Barb's Stack (Smyrna Heights) $\rightarrow$ **Port 3020**
*   **`19_Sovereign_Sports`**: Sovereign Sports Dashboard $\rightarrow$ **Port 3010**
*   **`20_AetherVet`**: AetherVet Telemedicine Portal $\rightarrow$ **Port 3015**
*   **`21_Wildseed_GardenStack`**: GardenStack (Botanical) $\rightarrow$ **Port 3021** (or Staged)
*   **`22_SpiteSlice`**: Spite Slice (Culinary Vengeance) $\rightarrow$ **Port 3019** (Decommissioned/Inactive)
*   **`23_EileenStack`**: Eileen's Stack (Storybook Station) $\rightarrow$ **Port 3017**
*   **`apps/clio_cockpit`**: Clio Cockpit Dashboard $\rightarrow$ **Port 3022**

---

## 4. ARCHITECTURAL RESOLUTION PROTOCOL (REMEDIATION SPEC)

To permanently resolve this configuration drift, the following steps must be taken during the execution phase:

### Step 4.1: Align `scripts/sync_modules_db.py`
The hardcoded `apps` array in `sync_modules_db.py` must be rewritten to match the actual ports defined in Section 3.
*   Update `eileenstack` to be named **Storybook Station / Eileen's Stack** on Port **`3017`**.
*   Update `gardenstack` to be on Port **`3021`** (or set `active=0` if not running).
*   Update `gonzas` to be on a separate port (e.g., **`3026`**) or set `active=0`.
*   Update `samtracker` to Port **`3024`**.
*   Update `clio_cockpit` to be a registered stack on Port **`3022`**.

### Step 4.2: Update `ActiveStacksGrid.tsx` Filters
Ensure the main base portal (`01_Sovereign_Portal` on port 3016) is either excluded from the active mission grid cards (as it is the base dashboard itself) or rendered cleanly with a distinct "Primary Outpost" design, rather than being overshadowed by `gonzas`.

### Step 4.3: Automate Synchronization
Introduce a configuration verification step in `restart_stack.sh` that checks if the database matches the ports being launched, or has `restart_stack.sh` invoke `sync_modules_db.py` dynamically on startup to ensure the DB state is automatically reconciled with the running processes.
