# Fluxo — como instalar no seu celular (e usar offline)

Este pacote é um **PWA**: um app web que instala na tela inicial, abre em tela cheia
(sem barra do navegador) e funciona **sem internet** depois de instalado.

Todos os dados ficam salvos **no próprio aparelho** (localStorage). Nada vai pra nuvem.

---

## Opção A — Publicar no GitHub Pages (recomendada) · ~5 min

É a forma mais confiável de ter o offline funcionando de verdade. Você instala
uma vez conectado e depois roda offline pra sempre.

1. Crie um repositório no GitHub (ex.: `fluxo`).
2. Suba **todo o conteúdo desta pasta** (index.html, sw.js, manifest, /fonts, ícones).
3. No repositório: **Settings → Pages → Branch: main → /(root) → Save**.
4. Aguarde ~1 min. O GitHub te dá uma URL tipo `https://SEU-USUARIO.github.io/fluxo/`.
5. Abra essa URL **no Chrome do celular**.
6. Menu (⋮) → **Adicionar à tela inicial** / **Instalar app**.
7. Pronto: abre pelo ícone, tela cheia, e funciona no modo avião.

> Por que precisa de um host? O service worker (o que faz o offline) só liga em
> HTTPS. O GitHub Pages já serve em HTTPS de graça. Depois de instalado, a
> internet não é mais necessária.

---

## Opção B — Servir na sua rede local (você é dev, então rola fácil)

Na pasta do projeto, rode qualquer servidor estático:

```bash
# Python
python3 -m http.server 8080

# ou Node
npx serve .
```

Descubra o IP do seu PC (`ipconfig` no Windows) e, no celular **na mesma rede
Wi-Fi**, acesse `http://SEU-IP:8080`. O Chrome trata IP local como contexto
seguro o suficiente pra instalar. Bom pra testar; pro uso diário, prefira a Opção A.

---

## Opção C — Só abrir o arquivo (offline imediato, sem cara de app)

Copie a pasta pro celular e abra o `index.html` por um navegador que abra
arquivos locais. Funciona offline na hora, os dados salvam normalmente, mas
**não** vira ícone/tela cheia e o service worker não liga via `file://`.
Serve pra dar uma olhada rápida.

---

## Opção D — Virar um .APK de verdade (passo 2, se quiser)

Como já é um PWA válido, dá pra empacotar num APK instalável:

- **PWABuilder** (pwabuilder.com): cola a URL da Opção A, ele gera o APK Android.
- **Capacitor**: `npm i @capacitor/core @capacitor/cli`, `npx cap init`,
  copia esta pasta pro `webDir`, `npx cap add android`, abre no Android Studio
  e gera o APK. Esse caminho abre porta pra usar recursos nativos depois
  (notificação, biometria, etc.).

---

## Testando o offline

Depois de instalar pela Opção A: ative o **modo avião** e abra o app pelo ícone.
Ele deve carregar normal e manter suas transações.

## Atualizando o app

Alterou algum arquivo? Suba de novo e troque `const CACHE = 'fluxo-v1'` para
`'fluxo-v2'` no `sw.js`. Na próxima abertura online, o app pega a versão nova.
