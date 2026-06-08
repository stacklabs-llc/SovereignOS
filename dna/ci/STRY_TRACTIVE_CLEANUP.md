# CHORE: Refactor & Cleanup Tractive Script Directory

**Description**: 
Based on the implementation of the `tractive_to_hmm.py` script for the Metsy Markov Predictor, the `scripts/tractive/` directory was created to house the new predictive routines separate from standard ingestion. 

A cleanup effort should be scheduled to migrate older tractive scripts from other locations (like `TRACTIVE_GROUND_TRUTH` or general `dna/ci` scripts) into `scripts/tractive/` to maintain the structure and cleanliness of the Sovereign codebase.

**Assignee**: Antigravity/Sovereign Core
**Priority**: Low
**Component**: `dna/scripts/tractive`
