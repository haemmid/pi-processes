Run through all steps without waiting for confirmation. Keep messages short.

## Duplicate protection

1. Start `./test/test-output.sh` as a background process named `stream`.
2. Try to start another process with the same name: `process start "./test/test-output.sh" name="stream"`.
3. Verify that it returns an error about the process already running.
4. Start a process with `restart=true`: `process start "./test/test-output.sh" name="stream" restart=true`.
5. Verify that the new process started with a different id.

## Normal operations

6. Start `./test/test-exit-success.sh 2` as a background process named `success`.
7. Start `./test/test-exit-failure.sh 2` as a background process named `failure`.
8. Start `./test/test-ignore-term.sh` as a background process named `stubborn`.
9. Verify these behaviors via the `process` tool:
   - `process list` shows all processes with correct statuses
   - `process output id="stream"` returns stdout/stderr lines
   - `process logs id="success"` returns log file paths
   - `process kill id="stubborn" force=true` force-kills the stubborn process
   - `process list` shows `stubborn` as killed
10. After verification, clean up all remaining processes with `process clear`.
