
$limit = (Get-Date).AddMinutes(-180)
$files = Get-ChildItem -Recurse -File | Where-Object { $_.LastWriteTime -gt $limit } | Select-Object Name, Length, LastWriteTime, DirectoryName

Write-Host "--- FILES MODIFIED IN LAST 180 MINUTES ---"
$files | Format-Table -AutoSize

Write-Host "`n--- CHECKING FOR BUSINESS_LOGIC.md ---"
if (Test-Path "BUSINESS_LOGIC.md") {
    Write-Host "FOUND in root."
} else {
    $found = Get-ChildItem -Recurse -Filter "BUSINESS_LOGIC.md"
    if ($found) {
        Write-Host "FOUND at: $($found.FullName)"
    } else {
        Write-Host "NOT FOUND anywhere in the directory."
    }
}
