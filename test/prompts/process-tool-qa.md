Run through all steps without waiting for confirmation. Keep messages short.

1. Start `./test/test-output.sh` as a background process named `stream`.
2. Start `./test/test-exit-success.sh 2` as a background process named `success`.
3. Start `./test/test-exit-failure.sh 2` as a background process named `failure`.
4. Start `./test/test-ignore-term.sh` as a background process named `stubborn`.
5. Verify these behaviors via the `process` tool:
   - `process list` shows all four processes with correct statuses
   - `process output id="stream"` returns stdout/stderr lines
   - `process logs id="success"` returns log file paths
   - `process kill id="stubborn" force=true` force-kills the stubborn process
   - `process list` shows `stubborn` as killed
6. After verification, clean up all remaining processes with `process clear`.
