# Baseball Savant / Statcast Data Glossary

**Purpose:** This document serves as the Rosetta Stone for understanding the raw `game_pack_*.csv` files. It translates MLB's advanced telemetry into narrative context for analysts and podcasters.

## Key Statistical Columns

*   **`pitch_type` & `pitch_name`:** The specific classification of the pitch thrown (e.g., FF = Four-Seam Fastball, SL = Slider, CU = Curveball, CH = Changeup). Look for over-reliance on certain pitches during critical at-bats that led to blown leads.
*   **`release_speed`:** The velocity of the pitch in miles per hour (MPH) out of the pitcher's hand. Drops in velocity can indicate a tired or injured bullpen, a common theme in the Mets' 11-game losing streak.
*   **`release_spin_rate`:** How fast the baseball spins (RPM). Higher spin rates usually equal more movement.
*   **`description` & `events`:** Crucial for narrative building. `description` tells what happened on the pitch (called strike, swinging strike, foul, hit into play). `events` tells the outcome of the at-bat (strikeout, single, home run, double play).
*   **`launch_speed` & `launch_angle`:** Exit velocity (MPH) and the trajectory angle off the bat. A high launch speed (>95 MPH) combined with an optimal launch angle (10-30 degrees) results in extra-base hits or home runs. Notice how often Mets pitchers give up high exit velocities during this skid.
*   **`hit_distance_sc`:** Projected distance of a batted ball in feet.
*   **`delta_home_win_exp` (WPA):** Change in Home Team Win Probability. This is the single most important storytelling metric. If this is a massive negative number for a Mets pitcher, it means they mathematically choked the game away. If it's a massive positive number for an opposing hitter, it was a clutch hit that broke the Mets' backs.
*   **`delta_run_exp` (RE24):** The change in expected runs for the inning based on the outcome of the pitch.

## Connecting Data to Fan Psychology

When analyzing the `auto_export_20260421.md` log alongside these CSVs, cross-reference the fan meltdowns with the data:
1.  When **Terry** complains about "leaky bullpens," look at the `delta_home_win_exp` in the 8th and 9th innings of the CSVs. You will find empirical evidence of the collapses he is screaming about.
2.  When **Dot** talks about "optimizing player performance" or "strategic adjustments," she relies on these exact metrics (launch angle optimization, spin rate efficiency).
3.  When **Wardy** begs for a standing ovation, it highlights the desperate psychological contract fans make when the raw data (11 straight losses) offers zero hope.

*Instructions for AI Analysis/Podcasters: Synthesize the raw, depressing empirical data from the CSVs with the volatile, emotional fanaticism found in the chat logs. Contrast the cold hard analytics against the passionate irrationality of the New York sports fan.*
