@echo off
REM ============================================================
REM restauration.bat - Restauration de la base Miaoutic (Windows, XAMPP)
REM
REM Utilisation, dans un terminal ouvert a la racine du projet :
REM   database\sauvegarde\restauration.bat backups\miaoutic_2026-11-03_10-15.sql
REM
REM ATTENTION : la base actuelle est supprimee puis recreee a partir
REM de la sauvegarde. Les comptes MySQL (miaoutic_app) sont conserves.
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
