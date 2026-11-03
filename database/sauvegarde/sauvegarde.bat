@echo off
REM ============================================================
REM sauvegarde.bat - Backup of the Miaoutic database (Windows, XAMPP)
REM
REM Usage, in a terminal opened at the root of the project:
REM   database\sauvegarde\sauvegarde.bat
REM
REM Creates the file backups\miaoutic_YYYY-MM-DD_HH-MM.sql
REM The backups\ folder is ignored by Git: a backup contains
REM personal data (emails, adoption requests).
REM
REM Optional variables (otherwise the default values of XAMPP):
REM   MYSQL_BIN  folder of mysqldump.exe (C:\xampp\mysql\bin)
REM   DB_USER    MySQL account used      (root)
REM ============================================================
setlocal

if not defined MYSQL_BIN set "MYSQL_BIN=C:\xampp\mysql\bin"
if not defined DB_USER set "DB_USER=root"
set "DB_NAME=miaoutic"

REM Folder backups at the root of the project (2 levels above this script)
set "BACKUP_DIR=%~dp0..\..\backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Date and time in the same format whatever the language of Windows
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set "HORODATAGE=%%i"
set "FICHIER=%BACKUP_DIR%\%DB_NAME%_%HORODATAGE%.sql"

echo Sauvegarde de la base %DB_NAME% dans %FICHIER%
echo Mot de passe de %DB_USER% : appuyez sur Entree s'il est vide (XAMPP par defaut).

REM --single-transaction: consistent copy without locking the site (InnoDB)
REM --databases + --add-drop-database: the restore recreates the whole database
REM --result-file: writes the file in UTF-8 (a ">" redirection in
REM PowerShell would write UTF-16, which mysql cannot read)
"%MYSQL_BIN%\mysqldump.exe" -u %DB_USER% -p --single-transaction --no-tablespaces --triggers --default-character-set=utf8mb4 --add-drop-database --databases %DB_NAME% --result-file="%FICHIER%"
if errorlevel 1 (
  echo ECHEC de la sauvegarde.
  if exist "%FICHIER%" del "%FICHIER%"
  exit /b 1
)

echo Sauvegarde terminee : %FICHIER%
endlocal
