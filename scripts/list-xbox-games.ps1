Get-AppxPackage -AllUsers | ForEach-Object {
    if ($_.InstallLocation -and $_.InstallLocation -notlike "*WindowsApps*") {
        Write-Output "$($_.Name) | $($_.InstallLocation) | $($_.PackageFamilyName)"
    }
}
