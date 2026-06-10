# 在线练题系统 - PowerShell 启动脚本
$ErrorActionPreference = "Stop"

try {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "      在线练题系统 - 启动脚本" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    # 检查 TypeScript 是否需要编译
    Write-Host "[1/3] 正在检查 TypeScript 编译..." -ForegroundColor Yellow
    if (-not (Test-Path "js\main.js")) {
        Write-Host "        未找到编译文件，开始编译..." -ForegroundColor Gray
        & npx tsc
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[错误] TypeScript 编译失败！" -ForegroundColor Red
            Read-Host "按 Enter 键退出"
            exit 1
        }
        Write-Host "        编译完成！" -ForegroundColor Green
    } else {
        Write-Host "        编译文件已存在" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "[2/3] 正在启动本地服务器..." -ForegroundColor Yellow

    # 检查端口占用并找到可用端口
    $port = 8080
    $maxPort = 8090
    $availablePort = $null

    while ($port -le $maxPort) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if (-not $connection) {
            $availablePort = $port
            break
        }
        $port++
    }

    if (-not $availablePort) {
        Write-Host "[错误] 端口 8080-8090 都被占用了！" -ForegroundColor Red
        Read-Host "按 Enter 键退出"
        exit 1
    }

    Write-Host "        访问地址: http://127.0.0.1:$availablePort" -ForegroundColor Green
    Write-Host "        按 Ctrl+C 停止服务器" -ForegroundColor Gray
    Write-Host ""

    # 启动 http-server（阻塞模式）
    & npx -y http-server -p $availablePort -o

    Write-Host ""
    Write-Host "[提示] 服务器已停止" -ForegroundColor Yellow
} catch {
    Write-Host ""
    Write-Host "[错误] 发生异常: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "按 Enter 键退出"
