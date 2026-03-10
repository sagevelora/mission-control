#!/bin/bash
# Mission Control - Iteration 7 Timer Script
# Sets up a timer for the duration of Iteration 7 (March 11, 2026 - March 25, 2026)

WORKSPACE="/home/sage/.openclaw/workspace/mission-control"
LOG_FILE="$WORKSPACE/iteration_7_timer.log"

# Function to log messages with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Initialize log file
echo "Starting Iteration 7 timer on $(date)" > "$LOG_FILE"
echo "=========================================" >> "$LOG_FILE"

# Set timer for completion date (March 25, 2026)
COMPLETION_DATE="2026-03-25 23:59:59"
CURRENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')

log_message "Iteration 7 started on: $CURRENT_DATE"
log_message "Target completion date: $COMPLETION_DATE"

# Calculate days remaining
DAYS_REMAINING=$(( ($(date -d "$COMPLETION_DATE" +%s) - $(date +%s)) / 86400 ))
log_message "Days remaining: $DAYS_REMAINING"

# Schedule daily progress checks
echo "Setting up daily progress checks..."

# Add cron job for daily monitoring (runs at 9 AM Brisbane time)
CRON_JOB="0 9 * * * cd $WORKSPACE && ./ITERATION_7_MONITOR.sh >> $LOG_FILE 2>&1"
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

log_message "Daily monitoring scheduled via cron"

echo "Iteration 7 timer initialized successfully"
echo "Log file: $LOG_FILE"