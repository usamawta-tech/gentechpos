' GenTech silent stopper - shuts down the hidden server
Set sh = CreateObject("WScript.Shell")
sh.Run """" & "C:\Users\Usama\Desktop\New folder\Stop GenTech.bat" & """", 0, True
MsgBox "GenTech POS has been stopped.", 64, "GenTech"
