#!/bin/bash
ssh -o StrictHostKeyChecking=accept-new james@192.168.1.168 "bash /home/james/SovereignOS/scripts/trigger_burn.sh"
rsync -avz -e "ssh -o StrictHostKeyChecking=accept-new" james@192.168.1.168:/home/james/SovereignOS/dna/archives/uat_evidence/ /home/james/SovereignOS/dna/archives/uat_evidence/
rsync -avz -e "ssh -o StrictHostKeyChecking=accept-new" james@192.168.1.168:/home/james/SovereignOS/dna/logs/CMDB_GPU_BURN.log /home/james/SovereignOS/dna/logs/
