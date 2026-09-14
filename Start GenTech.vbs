' GenTech silent launcher - starts the app hidden and opens the browser
Set sh = CreateObject("WScript.Shell")

' Start the server hidden (0 = hidden window, False = don't wait)
sh.Run """" & "C:\Users\Usama\Desktop\New folder\Start GenTech.bat" & """", 0, False

' Give the server a few seconds to boot, then open the browser
WScript.Sleep 5000
sh.Run "http://localhost:3000", 1, False
