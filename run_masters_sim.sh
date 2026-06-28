#!/bin/bash
# run_masters_sim.sh
# Starts the Masters 2025 Offline Simulation environment including the relay, chatbot engine, and simulator.

PROJECT_DIR="/home/james/SovereignOS"
PYTHON_BIN="$PROJECT_DIR/.venv/bin/python"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

echo "Stopping any existing Masters services..."
pkill -f "masters_relay.py" || true
pkill -f "masters_server_2025_sim.py" || true
pkill -f "masters_chatbots.py" || true
sleep 1

echo "Starting Masters Relay (Port 8001 & 8009)..."
"$PYTHON_BIN" -u "$PROJECT_DIR/08_FanCast/masters_relay.py" > "$LOG_DIR/masters_relay.log" 2>&1 &

sleep 2 # Wait for relay to boot

echo "Starting Masters Chatbot MARD Engine..."
"$PYTHON_BIN" -u "$PROJECT_DIR/scripts/masters_chatbots.py" > "$LOG_DIR/masters_chatbots.log" 2>&1 &

echo "Starting Masters 2025 Offline Simulator..."
"$PYTHON_BIN" -u "$PROJECT_DIR/08_FanCast/masters_server_2025_sim.py" > "$LOG_DIR/masters_server_2025_sim.log" 2>&1 &

echo "Masters simulation services deployed."
echo "Access the Butler Cabin command deck at: http://localhost:8001/08_FanCast/masters_desk.html"
echo "Check logs at $LOG_DIR/"
