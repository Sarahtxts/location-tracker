@echo off
echo ========================================
echo SQL Server Status Checker
echo ========================================
echo.

echo Checking SQL Server Service Status...
sc query "MSSQL$SQLEXPRESS" | findstr "STATE"
echo.

echo Checking SQL Server Browser Service Status...
sc query "SQLBrowser" | findstr "STATE"
echo.

echo ========================================
echo Testing SQL Server Connection...
echo ========================================
sqlcmd -S localhost\SQLEXPRESS -E -Q "SELECT @@VERSION" 2>nul
if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS: SQL Server connection works!
    echo.
) else (
    echo.
    echo ❌ ERROR: Cannot connect to SQL Server
    echo.
    echo Please check:
    echo 1. SQL Server service is running
    echo 2. Instance name is SQLEXPRESS
    echo 3. Windows Authentication is enabled
    echo.
    echo Run 'services.msc' to check service status
    echo.
)

echo ========================================
echo Press any key to exit...
pause >nul
