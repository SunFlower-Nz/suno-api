#!/usr/bin/env pwsh
# Script de configuração de variáveis de ambiente para Vercel
# Este script facilita a configuração das env vars necessárias

Write-Host "🚀 Suno API - Configurador de Variáveis Vercel" -ForegroundColor Cyan
Write-Host ""

# Verificar se Vercel CLI está instalado
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI não encontrado!" -ForegroundColor Red
    Write-Host "📦 Instalando Vercel CLI..." -ForegroundColor Yellow
    npm i -g vercel
    Write-Host "✅ Vercel CLI instalado com sucesso!" -ForegroundColor Green
    Write-Host ""
}

# Login na Vercel
Write-Host "🔐 Fazendo login na Vercel..." -ForegroundColor Yellow
vercel login

Write-Host ""
Write-Host "📝 Vamos configurar as variáveis de ambiente necessárias:" -ForegroundColor Cyan
Write-Host ""

# SUNO_COOKIE
Write-Host "1️⃣  SUNO_COOKIE (obrigatório)" -ForegroundColor Green
Write-Host "   Como obter: Acesse suno.com/create → F12 → Network → Requisição com '?__clerk_api_version' → Cookie" -ForegroundColor Gray
$sunoCookie = Read-Host "   Cole o cookie completo"

if ([string]::IsNullOrWhiteSpace($sunoCookie)) {
    Write-Host "❌ Cookie não pode estar vazio!" -ForegroundColor Red
    exit 1
}

Write-Host "   Configurando SUNO_COOKIE..." -ForegroundColor Yellow
Write-Output $sunoCookie | vercel env add SUNO_COOKIE production
Write-Host ""

# TWOCAPTCHA_KEY
Write-Host "2️⃣  TWOCAPTCHA_KEY (obrigatório)" -ForegroundColor Green
Write-Host "   Como obter: 2captcha.com → Criar conta → Adicionar saldo → Copiar API Key" -ForegroundColor Gray
$captchaKey = Read-Host "   Cole a chave do 2Captcha"

if ([string]::IsNullOrWhiteSpace($captchaKey)) {
    Write-Host "❌ Chave do 2Captcha não pode estar vazia!" -ForegroundColor Red
    exit 1
}

Write-Host "   Configurando TWOCAPTCHA_KEY..." -ForegroundColor Yellow
Write-Output $captchaKey | vercel env add TWOCAPTCHA_KEY production
Write-Host ""

# Variáveis opcionais
Write-Host "⚙️  Configurando variáveis opcionais..." -ForegroundColor Cyan

Write-Output "chromium" | vercel env add BROWSER production
Write-Output "true" | vercel env add BROWSER_HEADLESS production
Write-Output "en-US" | vercel env add BROWSER_LOCALE production
Write-Output "true" | vercel env add BROWSER_GHOST_CURSOR production

Write-Host ""
Write-Host "✅ Todas as variáveis foram configuradas!" -ForegroundColor Green
Write-Host ""

# Proxy (opcional)
Write-Host "🌐 Deseja configurar um proxy? (opcional)" -ForegroundColor Yellow
Write-Host "   Proxy ajuda a reduzir CAPTCHAs e evitar rate limits" -ForegroundColor Gray
$useProxy = Read-Host "   Configurar proxy? (s/N)"

if ($useProxy -eq "s" -or $useProxy -eq "S") {
    Write-Host ""
    Write-Host "Escolha o tipo de proxy:" -ForegroundColor Cyan
    Write-Host "  1) HTTP Proxy" -ForegroundColor White
    Write-Host "  2) SOCKS5 Proxy" -ForegroundColor White
    $proxyType = Read-Host "Opção"
    
    $proxyUrl = Read-Host "URL do proxy (ex: http://user:pass@proxy.com:8080)"
    
    if (-not [string]::IsNullOrWhiteSpace($proxyUrl)) {
        if ($proxyType -eq "1") {
            Write-Output $proxyUrl | vercel env add HTTP_PROXY production
        } else {
            Write-Output $proxyUrl | vercel env add SOCKS_PROXY production
        }
        Write-Host "✅ Proxy configurado!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute: vercel --prod" -ForegroundColor White
Write-Host "   2. Aguarde o deploy" -ForegroundColor White
Write-Host "   3. Teste a API na URL fornecida" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação completa: VERCEL_DEPLOY.md" -ForegroundColor Gray
Write-Host ""

# Perguntar se quer fazer deploy agora
$doDeploy = Read-Host "Deseja fazer o deploy agora? (s/N)"

if ($doDeploy -eq "s" -or $doDeploy -eq "S") {
    Write-Host ""
    Write-Host "🚀 Iniciando deploy..." -ForegroundColor Yellow
    vercel --prod
} else {
    Write-Host ""
    Write-Host "Para fazer o deploy depois, execute: vercel --prod" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Pronto! Sua API Suno está configurada!" -ForegroundColor Green
