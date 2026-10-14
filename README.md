# Conecta — Pesquisa Prática

Aplicativo Ionic + Vue + Capacitor com Supabase Auth, Database e Storage. Continuação da pesquisa teórica de Vinícius Cavilha.

## Executar

1. Instale as dependências com `npm install`.
2. Crie um projeto Supabase e execute `supabase/schema.sql` no SQL Editor **uma vez**, em um projeto sem tabela `profiles` e sem bucket `avatars` existentes.
3. Copie `.env.example` para `.env`. Preencha a URL e a chave **publishable ou anon** em Settings > API. Nunca use `service_role` ou uma chave secreta no frontend.
4. Em Authentication > URL Configuration, configure Site URL como `http://localhost:5173` e adicione `http://localhost:5173/home` às Redirect URLs. Use essa mesma URL em `VITE_AUTH_REDIRECT_URL`.
5. Habilite autenticação por e-mail e senha. Para demonstração, use um endereço ao qual tenha acesso e confirme o cadastro pelo e-mail recebido. O envio de e-mail está sujeito aos limites/configuração SMTP do projeto.
6. Execute `npm run dev` e abra o endereço mostrado. Se a porta mudar, ajuste as URLs anteriores. Reinicie o Vite depois de alterar `.env`.

Sem configuração, a interface abre com aviso e bloqueia o envio dos formulários. Não há login fictício nem dados simulados.

## Funcionalidades

- Cadastro, login, persistência da sessão e logout.
- Solicitação de recuperação por e-mail e formulário de nova senha ao receber o evento `PASSWORD_RECOVERY`.
- Boas-vindas com nome, nickname, e-mail e foto.
- Perfil com nome, nascimento e nickname no PostgreSQL.
- Upload de JPG/PNG/WebP até 2 MB no bucket privado `avatars`. Cada arquivo fica na pasta do usuário; a visualização usa URL assinada válida por uma hora. Recarregue a página após esse prazo para renovar a imagem.
- RLS no banco e no Storage: somente o titular acessa seus registros e arquivos.

## Validação

```sh
npm run build
npm run lint
npm run test:unit -- --run
```

Com o servidor em execução, `npm run test:e2e` verifica navegação pública. A verificação real de Auth/Database/Storage exige configurar o Supabase e executar o roteiro em `docs/pesquisa-pratica.md`. Não foi executada em uma conta remota durante a implementação.

## Capacitor e Android

O projeto já possui configuração Capacitor com `webDir: 'dist'`. Para gerar o projeto Android, em ambiente com Android Studio, SDK e JDK compatíveis com Capacitor 8:

```sh
npm install @capacitor/android@8
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

O build web não equivale a um APK testado. Android não foi compilado nesta entrega. O seletor HTML de arquivos permite escolher uma foto; não há plugin de câmera implementado. A recuperação de senha está preparada para o endereço **web** configurado; abrir o link de e-mail diretamente no aplicativo nativo exige configurar deep links, Android App Links/iOS Universal Links e tratar a URL recebida. Para a demonstração, realize a recuperação no navegador. iOS requer macOS e Xcode.

## Organização

- `src/views/HomePage.vue`: telas e operações de autenticação/perfil.
- `src/lib/supabase.ts`: cliente e configuração.
- `src/lib/validation.ts`: validação dos campos e fotos.
- `src/theme/variables.css`: interface responsiva.
- `supabase/schema.sql`: modelo de dados e políticas de acesso.
- `docs/pesquisa-pratica.md`: texto da pesquisa, arquitetura e roteiro de evidências.

As dependências herdadas do projeto podem apresentar alertas do npm audit; não publique em produção sem revisá-las.
