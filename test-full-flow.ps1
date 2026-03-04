# Step 1: Signin
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 1: Signin" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$signinBody = @{
    phoneNumber = "+919876543210"
    password = "Test@1234"
} | ConvertTo-Json

$signinResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signin" `
    -Method POST `
    -ContentType "application/json" `
    -Body $signinBody

Write-Host ($signinResponse | ConvertTo-Json -Depth 10)

$accessToken = $signinResponse.accessToken

if (-not $accessToken) {
    Write-Host "❌ Failed to get access token" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Got access token" -ForegroundColor Green
Write-Host ""

# Step 2: Profile Sync
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 2: Profile Sync (Create DynamoDB entry)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$syncResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/profile/sync" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $accessToken"
    }

Write-Host ($syncResponse | ConvertTo-Json -Depth 10)

Write-Host ""

# Step 3: Get Profile
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 3: Get Profile" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$profileResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/profile" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $accessToken"
    }

Write-Host ($profileResponse | ConvertTo-Json -Depth 10)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
