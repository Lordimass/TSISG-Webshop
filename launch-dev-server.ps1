# Define your listeners here
$listeners = @(
    @{
        Name       = "stripe_webhook"
        Variable   = "STRIPE_HOOK_SECRET"
        ForwardTo  = "localhost:8888/.netlify/functions/stripeWebhook"
        Events     = "checkout.session.completed,refund.created"
    }
)

# Build up one wt.exe command string with all the tabs
$wtCommand = @()

# Iterate through each of the listeners and build a command
foreach ($listener in $listeners) {
    $listenerArgs = "stripe listen --forward-to $($listener.ForwardTo) --events $($listener.Events)"
    $wtCommand += "wt -w 0 new-tab PowerShell -NoExit -Command $listenerArgs"
}

# Join them with semicolons (Windows Terminal expects this)
$fullCommand = ($wtCommand -join " ; ")

Write-Host "Launching Stripe Listeners..."
Write-Host "Please be aware that you must set the STRIPE_HOOK_SECRET in .env to test Stripe Webhooks locally."
Write-Host "Launching Netlify Local Development Server..."
Start-Process wt.exe -ArgumentList $fullCommand

netlify dev