' GenTech boot launcher - starts the server hidden on Windows startup.
' Does NOT open the browser (so it doesn't pop up every time you log in).
Set sh = CreateObject("WScript.Shell")
sh.Run """" & "C:\Users\Usama\Desktop\New folder\Start GenTech.bat" & """", 0, False
