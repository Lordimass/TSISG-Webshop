$envFile = ".env"

Write-Host "Starting Stripe listener..."
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "stripe"
$psi.Arguments = "listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed"
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $psi
$process.Start() | Out-Null

$stdout = $process.StandardOutput
$stderr = $process.StandardError
$secret = $null

Write-Host "Waiting for webhook secret..."

while (-not $stdout.EndOfStream -or -not $stderr.EndOfStream) {
    if (-not $stdout.EndOfStream) {
        $line = $stdout.ReadLine()
        Write-Host "[stripe] $line"
        if (-not $secret -and $line -match "Your webhook signing secret is (\w+)") {
            $secret = $matches[1]
            break
        }
    }

    if (-not $stderr.EndOfStream) {
        $errorLine = $stderr.ReadLine()
        Write-Host "[stripe-error] $errorLine"
        if (-not $secret -and $errorLine -match "Your webhook signing secret is (\w+)") {
            $secret = $matches[1]
            break
        }
    }
}

if ($secret) {
    Write-Host "`nFound webhook secret: $secret"

    # Read existing .env lines or create empty array if file doesn't exist
    if (Test-Path $envFile) {
        $lines = Get-Content $envFile
    }
    else {
        $lines = @()
    }

    $secretKey = "STRIPE_WEBHOOK_SECRET"
    $secretValue = $secret
    $found = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*$secretKey\s*=") {
            $lines[$i] = "$secretKey=$secretValue"
            $found = $true
            break
        }
    }

    if (-not $found) {
        $lines += "$secretKey=$secretValue"
    }

    # Write back updated .env content
    Set-Content -Path $envFile -Value $lines

    Write-Host "Saved STRIPE_WEBHOOK_SECRET to $envFile`n"

    Write-Host "Starting Netlify dev server..."
    Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c npx netlify dev"
}
else {
    Write-Host "Webhook secret not found. Exiting."
    exit 1
}
