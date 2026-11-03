@echo off
REM ============================================================
REM restauration.bat - Restore of the Miaoutic database (Windows, XAMPP)
REM
REM Usage, in a terminal opened at the root of the project:
REM   database\sauvegarde\restauration.bat backups\miaoutic_2026-11-03_10-15.sql
REM
REM WARNING: the current database is dropped, then recreated from
REM the backup. The MySQL accounts (miaoutic_app) are kept.
REM ============================================================
setlocal

if "%~1"=="" (
  echo Utilisation : restauration.bat chemin\vers\sauvegarde.sql
  exit /b 1
)
if not exist "%~1" (
  echo Fichier introuvable : %~1
  exit /b 1
)

if not defined MYSQL_BIN set "MYSQL_BIN=C:\xampp\mysql\bin"
if not defined DB_USER set "DB_USER=root"

echo ATTENTION : la base miaoutic va etre remplacee par le contenu de %~1
set /p "CONFIRMATION=Tapez OUI pour continuer : "
if /i not "%CONFIRMATION%"=="OUI" (
  echo Restauration annulee.
  exit /b 1
)

echo Mot de passe de %DB_USER% : appuyez sur Entree s'il est vide (XAMPP par defaut).
"%MYSQL_BIN%\mysql.exe" -u %DB_USER% -p --default-character-set=utf8mb4 < "%~1"
if errorlevel 1 (
  echo ECHEC de la restauration.
  exit /b 1
)

echo Restauration terminee.
endlocal
