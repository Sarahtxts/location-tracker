# Open Port 5000 for Location Tracker Backend
$port = 5000
$ruleName = "Location Tracker Backend"

Write-Host "Checking for existing rule..."
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Rule '$ruleName' already exists. Removing old rule..."
    Remove-NetFirewallRule -DisplayName $ruleName
}

Write-Host "Creating new Inbound Rule for TCP Port $port..."
New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow -Profile Any

Write-Host "Success! Port $port is now open."
Write-Host "You should now be able to connect from your phone."
Pause
