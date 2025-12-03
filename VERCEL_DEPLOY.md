# 🚀 Guia de Deploy na Vercel - Suno API

Este guia vai te ajudar a fazer o deploy do Suno API na Vercel em poucos minutos.

## 📋 Pré-requisitos

Antes de começar, você precisa ter:

1. ✅ **Conta no Suno.ai** (com plano pago recomendado)
2. ✅ **Cookie do Suno** (veja como obter abaixo)
3. ✅ **Conta no 2Captcha/ruCaptcha** com saldo
4. ✅ **Chave API do 2Captcha**
5. ✅ **Conta na Vercel** (gratuita)

---

## 🍪 Passo 1: Obter o Cookie do Suno

1. Acesse [suno.com/create](https://suno.com/create) no seu navegador
2. Abra as Ferramentas do Desenvolvedor (`F12`)
3. Vá na aba **Network** (Rede)
4. Atualize a página (`F5`)
5. Procure por uma requisição que contenha `?__clerk_api_version` no nome
6. Clique nela e vá na aba **Headers** (Cabeçalhos)
7. Encontre a seção **Cookie** e copie todo o valor

**Exemplo do cookie:**
```
__client=eyJhbGc...; __client_uat=1234567890...
```

> ⚠️ **Importante**: O cookie expira. Se a API parar de funcionar, pegue um novo cookie.

---

## 🔑 Passo 2: Obter a Chave do 2Captcha

1. Crie uma conta em [2captcha.com](https://2captcha.com/auth/register)
   - Se estiver na Rússia/Belarus, use [rucaptcha.com](https://rucaptcha.com)
2. Adicione saldo na sua conta (aceita várias formas de pagamento)
   - Preço: ~$2.99 por 1000 hCaptchas
3. Pegue sua API Key em [2captcha.com/enterpage](https://2captcha.com/enterpage)

**Exemplo da chave:**
```
1abc234de56789fghi0jklm12nop3qrs
```

---

## 🌐 Passo 3: Deploy na Vercel

### Opção A: Deploy via Interface Web (Recomendado)

1. **Acesse**: [vercel.com](https://vercel.com) e faça login
2. **Clique em**: "Add New..." → "Project"
3. **Importe**: Selecione o repositório `SunFlower-Nz/suno-api`
4. **Configure o Framework**: Vercel detecta automaticamente Next.js
5. **Adicione as Variáveis de Ambiente**:

   Clique em "Environment Variables" e adicione:

   | Nome | Valor | Obrigatório |
   |------|-------|-------------|
   | `SUNO_COOKIE` | *Seu cookie copiado* | ✅ Sim |
   | `TWOCAPTCHA_KEY` | *Sua chave 2Captcha* | ✅ Sim |
   | `BROWSER` | `chromium` | ⚪ Opcional |
   | `BROWSER_HEADLESS` | `true` | ⚪ Opcional |
   | `BROWSER_LOCALE` | `en-US` | ⚪ Opcional |
   | `BROWSER_GHOST_CURSOR` | `true` | ⚪ Opcional |

6. **Deploy**: Clique em "Deploy" e aguarde

---

### Opção B: Deploy via CLI

1. **Instale o Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Faça login**:
   ```bash
   vercel login
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   vercel env add SUNO_COOKIE
   # Cole seu cookie quando solicitado

   vercel env add TWOCAPTCHA_KEY
   # Cole sua chave quando solicitado
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

---

## ✅ Passo 4: Verificar o Deploy

Após o deploy, você receberá uma URL como: `https://seu-projeto.vercel.app`

### Teste os endpoints:

1. **Homepage**: `https://seu-projeto.vercel.app`
2. **Documentação**: `https://seu-projeto.vercel.app/docs`
3. **API Health**: `https://seu-projeto.vercel.app/api/get_limit`

---

## 🧪 Passo 5: Testar a API

### Exemplo: Gerar uma música

```bash
curl -X POST https://seu-projeto.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Energetic synthwave track with retro 80s vibes",
    "make_instrumental": false,
    "model": "chirp-v3-5",
    "wait_audio": false
  }'
```

### Exemplo: Gerar música customizada

```bash
curl -X POST https://seu-projeto.vercel.app/api/custom_generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A romantic ballad about eternal love",
    "tags": "romance,ballad,piano",
    "title": "Amor Infinito",
    "make_instrumental": false,
    "wait_audio": false
  }'
```

### Exemplo: Verificar créditos

```bash
curl https://seu-projeto.vercel.app/api/get_limit
```

---

## 📊 Gerenciar Variáveis de Ambiente

Você pode atualizar as variáveis a qualquer momento:

1. Acesse o [dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Edite ou adicione novas variáveis
5. Faça um **Redeploy** para aplicar as mudanças

---

## ⚙️ Configurações Avançadas

### Timeout das Funções

Por padrão, configurei `maxDuration: 60` segundos. Se precisar de mais tempo:

1. Edite `vercel.json`:
   ```json
   {
     "functions": {
       "src/app/api/**/*.ts": {
         "maxDuration": 300
       }
     }
   }
   ```
2. **Nota**: Planos gratuitos têm limite de 10s. Pro: 60s. Enterprise: até 900s.

### Usar Proxy (Opcional)

Se você tiver um proxy para reduzir CAPTCHAs:

```bash
vercel env add HTTP_PROXY
# Digite: http://usuario:senha@proxy.com:8080

# Ou para SOCKS5:
vercel env add SOCKS_PROXY
# Digite: socks5://usuario:senha@proxy.com:1080
```

### Região Preferencial

Edite `vercel.json` para mudar a região:

```json
{
  "regions": ["iad1"]
}
```

Regiões disponíveis: `iad1` (US East), `sfo1` (US West), `fra1` (Frankfurt), etc.

---

## 🐛 Troubleshooting

### ❌ Erro: "Cookie inválido ou expirado"
**Solução**: Obtenha um novo cookie do Suno e atualize a variável `SUNO_COOKIE`.

### ❌ Erro: "2Captcha sem saldo"
**Solução**: Adicione saldo na sua conta 2Captcha/ruCaptcha.

### ❌ Erro: "Function execution timed out"
**Solução**: Use `wait_audio: false` nas requisições e consulte o status depois em `/api/get`.

### ❌ Muitos CAPTCHAs sendo solicitados
**Soluções**:
- Use um proxy residencial/rotativo
- Configure `BROWSER_GHOST_CURSOR=true`
- Aumente o saldo do 2Captcha
- Considere rodar localmente em macOS (menos CAPTCHAs)

### ❌ Erro: "Module not found"
**Solução**: Certifique-se de que o `vercel.json` está configurado para usar Node.js runtime.

---

## 📚 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/generate` | POST | Gera música a partir de prompt |
| `/api/custom_generate` | POST | Gera música customizada |
| `/api/extend_audio` | POST | Estende um clipe existente |
| `/api/concat` | POST | Concatena clipes |
| `/api/generate_stems` | POST | Separa vocal/instrumental |
| `/api/generate_lyrics` | POST | Gera letras |
| `/api/get_aligned_lyrics` | GET | Obtém letras sincronizadas |
| `/api/get` | GET | Lista músicas |
| `/api/get_limit` | GET | Verifica créditos |
| `/api/persona` | GET | Gerencia personas |
| `/api/clip` | GET | Detalhes de um clipe |

---

## 💡 Dicas de Uso

1. **Use `wait_audio: false`** para evitar timeouts e consulte depois
2. **Monitore seus créditos** com `/api/get_limit`
3. **Cache os resultados** localmente para economizar requisições
4. **Use webhooks** se disponível no seu plano Suno
5. **Mantenha o cookie atualizado** regularmente

---

## 🔒 Segurança

- ⚠️ Nunca compartilhe seu `SUNO_COOKIE` ou `TWOCAPTCHA_KEY`
- ⚠️ Use variáveis de ambiente (nunca comite no código)
- ⚠️ Considere adicionar autenticação na API se for pública
- ⚠️ Monitore o uso para evitar abusos

---

## 📞 Suporte

- **Documentação**: [https://seu-projeto.vercel.app/docs](https://seu-projeto.vercel.app/docs)
- **Issues**: [GitHub Issues](https://github.com/SunFlower-Nz/suno-api/issues)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

## ✅ Checklist Final

Antes de usar em produção:

- [ ] Cookie do Suno configurado
- [ ] Chave do 2Captcha configurada e com saldo
- [ ] Deploy realizado com sucesso
- [ ] Teste de geração de música funcionando
- [ ] Endpoint `/api/get_limit` retornando créditos
- [ ] Documentação `/docs` acessível

---

🎉 **Pronto! Sua API Suno está no ar!**

Acesse `https://seu-projeto.vercel.app/docs` para ver a documentação interativa.
