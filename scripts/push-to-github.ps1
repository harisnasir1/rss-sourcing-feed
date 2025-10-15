<#
PowerShell helper to stage, commit, and push local changes to GitHub.
Usage: run this from the repository root (where this file lives):

  cd C:\rss-sourcing-feed
  .\scripts\push-to-github.ps1 -CommitMessage "My changes"

This script checks for git, lets you set remote/branch if needed, and pushes.
#>
param(
  [string]$CommitMessage = "Update frontend: auth, animations, and layout",
  [string]$Remote = "origin",
  [string]$Branch = "main"
)

function ExitWith($msg) {
  Write-Host $msg -ForegroundColor Red
  exit 1
}

# Ensure git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  ExitWith "git is not installed or not on PATH. Install git and re-run this script. https://git-scm.com/downloads"
}

# Show status
git status

Write-Host "Staging all changes..."
git add -A

Write-Host "Committing with message: $CommitMessage"
try {
  git commit -m $CommitMessage
} catch {
  Write-Host "No changes to commit or commit failed: $_"
}

# Ensure remote exists
$remotes = git remote
if (-not ($remotes -contains $Remote)) {
  Write-Host "Remote '$Remote' not found. Please add it (example):"
  Write-Host "git remote add $Remote https://github.com/<OWNER>/<REPO>.git"
  ExitWith "Add remote and re-run this script."
}

Write-Host "Pushing to $Remote/$Branch..."
try {
  git push $Remote $Branch
  Write-Host "Push complete." -ForegroundColor Green
} catch {
  ExitWith "Push failed: $_"
}
