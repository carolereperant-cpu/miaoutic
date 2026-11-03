@echo off
REM ============================================================
REM sauvegarde.bat - Sauvegarde de la base Miaoutic (Windows, XAMPP)
REM
REM Utilisation, dans un terminal ouvert a la racine du projet :
REM   database\sauvegarde\sauvegarde.bat
REM
REM Cree le fichier backups\miaoutic_AAAA-MM-JJ_HH-MM.sql
REM Le dossier backups\ est ignore par Git : une sauvegarde contient
REM des donnees personnelles (e-mails, demandes d'adoption).
REM
REM Variables facultatives (sinon valeurs par defaut de XAMPP) :
REM   MYSQL_BIN  dossier de mysqldump.exe (C:\xampp\mysql\bin)
REM   DB_USER    compte MySQL utilise    (root)
REM ============================================================
setlocal

if not defined MYSQL_BIN set "MYSQL_BIN=C:\xampp\mysql\bin"
if not defined DB_USER set "DB_USER=root"
set "DB_NAME=miaoutic"

REM Dossier backups a la racine du projet (2 niveaux au-dessus du script)
set "BACKUP_DIR=%~dp0..\..\backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Date et heure au meme format quelle que soit la langue de Windows
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set "HORODATAGE=%%i"
set "FICHIER=%BACKUP_DIR%\%DB_NAME%_%HORODATAGE%.sql"

echo Sauvegarde de la base %DB_NAME% dans %FICHIER%
echo Mot de passe de %DB_USER% : appuyez sur Entree s'il est vide (XAMPP par defaut).

REM --single-transaction : copie coherente sans bloquer le site (InnoDB)
REM --databases + --add-drop-database : la restauration recree la base entiere
REM --result-file : ecrit le fichier en UTF-8 (une redirection ">" sous
REM PowerShell l'ecrirait en UTF-16, illisible par mysql)
"%MYSQL_BIN%\mysqldump.exe" -u %DB_USER% -p --single-transaction --no-tablespaces --triggers --default-character-set=utf8mb4 --add-drop-database --databases %DB_NAME% --result-file="%FICHIER%"
if errorlevel 1 (
  echo ECHEC de la sauvegarde.
  if exist "%FICHIER%" del "%FICHIER%"
  exit /b 1
)

echo Sauvegarde terminee : %FICHIER%
endlocal
