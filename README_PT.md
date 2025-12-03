<div align="center">
  <h1 align="center">
      Suno AI API
  </h1>
  <p>Use a API para chamar a IA de geração de música da Suno.ai e integre facilmente em agentes como GPTs.</p>
  <p>👉 Atualizamos rapidamente, dê uma estrela!</p>
</div>
<p align="center">
  <a target="_blank" href="./README.md">English</a> 
  | <a target="_blank" href="./README_CN.md">简体中文</a> 
  | <a target="_blank" href="./README_RU.md">русский</a> 
  | <a target="_blank" href="./README_PT.md">Português</a>
</p>

![suno-api banner](https://github.com/gcui-art/suno-api/blob/main/public/suno-banner.png)

## Introdução

Suno é um serviço incrível de IA para música. Embora a API oficial ainda não esteja disponível, não pudemos esperar para integrar suas capacidades.

Descobrimos que alguns usuários têm necessidades semelhantes, então decidimos abrir o código-fonte deste projeto, esperando que você goste.

Esta implementação usa o serviço pago [2Captcha](https://2captcha.com/about) (também conhecido como ruCaptcha) para resolver os desafios hCaptcha automaticamente.

## Funcionalidades

- ✅ **Geração de Música**: Criação de músicas a partir de prompts de texto.
- ✅ **Modo Customizado**: Controle total sobre letra, estilo e título.
- ✅ **Extensão de Áudio**: Continue músicas existentes a partir de qualquer ponto.
- ✅ **Concatenação**: Junte clipes para formar uma música completa.
- ✅ **Geração de Stems**: Separe vocais e instrumental de suas músicas.
- ✅ **Geração de Letras**: Crie letras automaticamente com IA.
- ✅ **Alinhamento de Letras**: Obtenha o timing exato de cada palavra.
- ✅ **Gestão de Personas**: Liste e gerencie suas personas.
- ✅ **Infraestrutura Robusta**:
  - **TLS Fingerprinting**: Bypass de detecção JA3/JA4 usando CycleTLS.
  - **Suporte a Proxy**: HTTP e SOCKS5 para evitar rate limits.
  - **Rotação de Fingerprints**: Simula diferentes dispositivos (Android/iOS).
  - **Captcha Solver**: Integração automática com 2Captcha.
- ✅ **Compatibilidade**: Formato `/v1/chat/completions` da OpenAI.
- ✅ **Deploy Fácil**: Docker e Vercel.

## Endpoints da API

### Geração
- `/api/generate`: Gera música a partir de descrição simples.
- `/api/custom_generate`: Gera música com letra e estilo personalizados.
- `/api/generate_lyrics`: Gera letras para músicas.

### Manipulação
- `/api/extend_audio`: Estende um clipe de áudio existente.
- `/api/concat`: Concatena clipes (ex: Parte 1 + Parte 2).
- `/api/generate_stems`: Separa os stems (vocal/instrumental).

### Informações
- `/api/get`: Obtém detalhes de músicas.
- `/api/get_limit`: Verifica limites de uso e créditos.
- `/api/get_aligned_lyrics`: Obtém letras sincronizadas.
- `/api/persona`: Gerencia personas.
- `/api/clip`: Obtém detalhes de um clipe específico.

## Arquitetura

O projeto foi refatorado com uma arquitetura modular:

```
src/lib/
├── SunoApi.ts              # Camada de compatibilidade
├── utils.ts                # Utilitários
├── fingerprints/
│   └── index.ts            # Pool de perfis + FingerprintManager
├── http/
│   ├── HttpClient.ts       # Cliente HTTP com TLS + Proxy
│   └── index.ts
└── suno/
    ├── types.ts            # Definições de tipos
    ├── AuthService.ts      # Autenticação Clerk + JWT
    ├── CaptchaService.ts   # Resolução de CAPTCHA
    ├── GenerationService.ts# Geração de música
    ├── SunoApi.ts          # Facade principal
    └── index.ts
```

## Como Começar

### 1. Obter o cookie da sua conta Suno

1. Acesse [suno.com/create](https://suno.com/create) no seu navegador
2. Abra o console do desenvolvedor: pressione `F12` ou acesse as `Ferramentas do Desenvolvedor`
3. Navegue até a aba `Network` (Rede)
4. Atualize a página
5. Identifique a requisição mais recente que contenha `?__clerk_api_version`
6. Clique nela e vá para a aba `Header`
7. Localize a seção `Cookie`, passe o mouse sobre ela e copie o valor

![get cookie](https://github.com/gcui-art/suno-api/blob/main/public/get-cookie-demo.gif)

### 2. Registrar no 2Captcha e adicionar saldo

[2Captcha](https://2captcha.com/about) é um serviço pago de resolução de CAPTCHA que usa trabalhadores reais para resolver o CAPTCHA com alta precisão.

[Crie](https://2captcha.com/auth/register?userType=customer) uma conta no 2Captcha, [adicione saldo](https://2captcha.com/pay) e [obtenha sua chave de API](https://2captcha.com/enterpage#recognition).

> [!NOTE]
> Se você está no Brasil, o 2Captcha aceita pagamentos via PIX.

### 3. Clonar e fazer deploy do projeto

#### Rodar localmente

```bash
git clone https://github.com/SunFlower-Nz/suno-api.git
cd suno-api
npm install
```

#### Docker

```bash
docker compose build && docker compose up
```

### 4. Configurar suno-api

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
SUNO_COOKIE=<seu_cookie>
TWOCAPTCHA_KEY=<sua_chave_2captcha>
BROWSER=chromium
BROWSER_GHOST_CURSOR=false
BROWSER_LOCALE=en
BROWSER_HEADLESS=true
```

#### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `SUNO_COOKIE` | Cookie obtido no passo 1 |
| `TWOCAPTCHA_KEY` | Chave de API do 2Captcha |
| `BROWSER` | Navegador para CAPTCHA (`chromium` ou `firefox`) |
| `BROWSER_GHOST_CURSOR` | Simular movimentos suaves do mouse (`true`/`false`) |
| `BROWSER_LOCALE` | Idioma do navegador (`en`, `pt`, `ru`) |
| `BROWSER_HEADLESS` | Rodar navegador sem janela (`true`/`false`) |

### 5. Rodar suno-api

```bash
npm run dev
```

Teste acessando: `http://localhost:3000/api/get_limit`

Se retornar algo como:

```json
{
  "credits_left": 50,
  "period": "day",
  "monthly_limit": 50,
  "monthly_usage": 50
}
```

O programa está funcionando corretamente.

## Referência da API

### Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/generate` | POST | Gerar música |
| `/api/custom_generate` | POST | Gerar música (Modo Customizado) |
| `/api/generate_lyrics` | POST | Gerar letras |
| `/api/get` | GET | Obter informações de música por ID |
| `/api/get_limit` | GET | Obter informações de quota |
| `/api/extend_audio` | POST | Estender duração do áudio |
| `/api/generate_stems` | POST | Separar faixas (vocal e instrumental) |
| `/api/get_aligned_lyrics` | GET | Obter timestamps das letras |
| `/api/clip` | GET | Obter informações do clip |
| `/api/concat` | POST | Gerar música completa de extensões |
| `/v1/chat/completions` | POST | Compatível com API OpenAI |

### Uso com Proxy

```typescript
import { sunoApi } from '@/lib/SunoApi';

const api = await sunoApi({
  cookie: process.env.SUNO_COOKIE,
  proxy: {
    url: 'http://usuario:senha@proxy.exemplo.com:8080'
  },
  rotateFingerprints: true,
  rotationStrategy: 'round-robin'
});

const audio = await api.generate('uma música de rock brasileiro', false, undefined, true);
```

## Exemplos de Código

### Python

```python
import time
import requests

base_url = 'http://localhost:3000'

def gerar_musica(payload):
    url = f"{base_url}/api/generate"
    response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
    return response.json()

def obter_info_audio(audio_ids):
    url = f"{base_url}/api/get?ids={audio_ids}"
    response = requests.get(url)
    return response.json()

def obter_quota():
    url = f"{base_url}/api/get_limit"
    response = requests.get(url)
    return response.json()

if __name__ == '__main__':
    data = gerar_musica({
        "prompt": "Uma música de MPB sobre o pôr do sol na praia, cantada por uma voz feminina suave.",
        "make_instrumental": False,
        "wait_audio": False
    })

    ids = f"{data[0]['id']},{data[1]['id']}"
    print(f"IDs: {ids}")

    for _ in range(60):
        data = obter_info_audio(ids)
        if data[0]["status"] == 'streaming':
            print(f"{data[0]['id']} ==> {data[0]['audio_url']}")
            print(f"{data[1]['id']} ==> {data[1]['audio_url']}")
            break
        time.sleep(5)
```

### JavaScript

```js
const baseUrl = "http://localhost:3000";

async function gerarMusica(payload) {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
}

async function obterInfoAudio(audioIds) {
  const response = await fetch(`${baseUrl}/api/get?ids=${audioIds}`);
  return response.json();
}

async function main() {
  const data = await gerarMusica({
    prompt: "Uma música de forró sobre festa junina, alegre e animada.",
    make_instrumental: false,
    wait_audio: false,
  });

  const ids = `${data[0].id},${data[1].id}`;
  console.log(`IDs: ${ids}`);

  for (let i = 0; i < 60; i++) {
    const info = await obterInfoAudio(ids);
    if (info[0].status === "streaming") {
      console.log(`${info[0].id} ==> ${info[0].audio_url}`);
      console.log(`${info[1].id} ==> ${info[1].audio_url}`);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

main();
```

## Perfis de Fingerprint

O sistema inclui 6 perfis de dispositivos para rotação:

| ID | Dispositivo | Plataforma |
|----|-------------|------------|
| `pixel8-chrome130` | Google Pixel 8 | Android |
| `galaxy-s24-chrome130` | Samsung Galaxy S24 Ultra | Android |
| `oneplus12-chrome130` | OnePlus 12 | Android |
| `xiaomi14-chrome130` | Xiaomi 14 Pro | Android |
| `iphone15-safari17` | iPhone 15 Pro | iOS |
| `iphone14-safari17` | iPhone 14 Pro Max | iOS |

### Estratégias de Rotação

- `round-robin` - Alterna em ordem
- `random` - Seleção aleatória
- `least-used` - Usa o menos utilizado
- `platform-sticky` - Mantém na mesma plataforma

## Contribuindo

Existem quatro formas de apoiar este projeto:

1. **Fork e Pull Requests**: PRs que melhorem funcionalidade, APIs, tempo de resposta e disponibilidade são bem-vindos!
2. **Abrir Issues**: Sugestões razoáveis e relatórios de bugs são apreciados.
3. **Doar**: Se este projeto te ajudou, considere fazer uma doação.
4. **Divulgar**: Recomende este projeto para outros, dê uma estrela no repo.

## Dúvidas, Sugestões ou Bugs?

Usamos [GitHub Issues](https://github.com/SunFlower-Nz/suno-api/issues) para gerenciar feedback. Fique à vontade para abrir uma issue.

## Licença

A licença deste projeto é LGPL-3.0 ou posterior. Veja [LICENSE](LICENSE) para mais informações.

## Links Relacionados

- Repositório do projeto: [github.com/SunFlower-Nz/suno-api](https://github.com/SunFlower-Nz/suno-api)
- Site oficial do Suno: [suno.ai](https://suno.ai)

## Aviso Legal

suno-api é um projeto open source não oficial, destinado apenas para fins de aprendizado e pesquisa.
