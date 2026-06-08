Antigravity Centralized Brain Symlink Setup (Desktop)
Follow these exact steps on your Windows desktop to centralize your Antigravity AI IDE brain to Node 183.

1. Map the Samba Share
Open Windows Explorer.
Right-click on This PC and select Map network drive...
Choose a drive letter (e.g., X:).
Set the Folder to: \\clio\gemini (or \\192.168.1.183\gemini).
Ensure "Reconnect at sign-in" is checked.
Click Finish.
2. Prepare the Local Directory
Note: Ensure your Antigravity IDE is completely closed before doing this to prevent "File in Use" errors.

Navigate to your local Windows user folder: C:\Users\YOUR_USERNAME\.gemini\
Delete the physical antigravity folder if it exists. (Do not worry about losing data, as the source of truth is now safely stored on \\clio\gemini\antigravity thanks to your laptop upload).
3. Execute the Symlink
Open the Windows Start Menu.
Type cmd, right-click Command Prompt, and select Run as administrator.
Run the following command (replace jc2po with your desktop's exact Windows username if it's different, and X: with the drive letter you chose in Step 1):
cmd
mklink /D C:\Users\jc2po\.gemini\antigravity X:\antigravity
You should receive a confirmation saying symbolic link created.

4. Verify
Open the Antigravity IDE on your desktop. Your session history should immediately populate with the exact same chat threads you had on the laptop, meaning your centralized Sovereig