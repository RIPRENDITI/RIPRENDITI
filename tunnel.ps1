$ssh = "C:\WINDOWS\System32\OpenSSH\ssh.exe"
$arg = "-o StrictHostKeyChecking=no -R 80:localhost:3000 nokey@localhost.run"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $ssh
$psi.Arguments = $arg
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$p = [System.Diagnostics.Process]::Start($psi)
Start-Sleep -Seconds 10

# Read first lines for the URL
$output = $p.StandardOutput.ReadToEnd()
$errorOutput = $p.StandardError.ReadToEnd()
$p.Kill()

Write-Output "STDOUT: $output"
Write-Output "STDERR: $errorOutput"
