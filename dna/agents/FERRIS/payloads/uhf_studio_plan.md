# LEVEL 4: UHF STUDIO - LAYOUT PLAN

## 1. MATRIX ARCHITECTURE
A dedicated React-native split-screen terminal interface serving the MLB FanStack operation. 

## 2. VIEWPORT PARTITION (Split-Screen Container)
- Orientation: Dual-pane (50/50 Desktop split). `h-screen w-full flex flex-row bg-[#0f1115]`.
- Material: Vesper Aesthetic (Deep Void backgrounds, frosted glass panels).

## 3. PANE A: COMMAND (LEFT)
- Upper Quadrant: *Savant Query Terminal*. Diagnostic output from MLB Stats API.
- Lower Quadrant: *God Mode Array*. Dedicated admin override panel. JSON payload construction and force-injection forms. 
- CSS Classes: `flex flex-col border-r border-slate-800 w-1/2`.

## 4. PANE B: OBSERVATION (RIGHT)
- Quadrant: *FanStack Chat Matrix*.
- Functionality: Live observer window detailing persona LLM multi-agent conversations mapped to current MLB game state.
- CSS Classes: `w-1/2 p-4 h-full overflow-y-auto custom-scrollbar`.

## 5. OPERATION
Zero conversational padding. Direct bindings mapping React elements to backend outputs.
