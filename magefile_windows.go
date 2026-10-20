//go:build mage && windows

package main

import (
	"os/exec"
	"strconv"
	"syscall"
)

// setProcessGroup puts the command in a new Windows process group so the
// process tree can be torn down together. Only the e2e task uses this.
func setProcessGroup(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
	}
}

// killProcessGroup stops the command and its children. Windows has no
// POSIX process-group kill, so taskkill walks the tree.
func killProcessGroup(cmd *exec.Cmd) error {
	if cmd.Process == nil {
		return nil
	}
	kill := exec.Command("taskkill", "/T", "/F", "/PID", strconv.Itoa(cmd.Process.Pid))
	if err := kill.Run(); err != nil {
		return err
	}
	return cmd.Wait()
}
