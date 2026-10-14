# Pesquisa Prática: Ionic, Vue, Capacitor e Supabase

**Autor:** Vinícius Cavilha  
**Projeto:** Conecta — cadastro e perfil de usuário

## 1. Objetivo e relação com a pesquisa anterior

A pesquisa teórica apresentou Ionic como ferramenta de interface, Vue.js como responsável pela lógica reativa, Capacitor como ponte para plataformas móveis e Supabase como provedor de autenticação, banco e arquivos. Esta etapa aplica esses conceitos em um aplicativo de perfil. A proposta contempla login, recuperação de senha, boas-vindas e edição de nome, data de nascimento, nickname e foto.

O cadastro foi acrescentado para permitir criar usuários e testar o fluxo completo. A implementação está no repositório; a demonstração com dados reais depende de configurar um projeto Supabase conforme o README.

## 2. Conceitos e ferramentas utilizadas

**Ionic Framework:** fornece a estrutura visual com `IonPage`, `IonHeader`, `IonToolbar`, `IonContent` e `IonButton`. O layout se adapta à largura do dispositivo. Os campos HTML possuem rótulos, tipos de entrada e validações apropriadas.

**Vue.js:** organiza a tela como componente de arquivo único. A Composition API usa `ref` e `reactive` para atualizar a interface quando a sessão, os dados e o estado de carregamento mudam. A renderização condicional alterna login, cadastro, recuperação, boas-vindas e perfil.

**Capacitor:** o projeto contém configuração para empacotar os arquivos web de `dist`. O mesmo código pode ser incorporado a um projeto Android ou iOS. Esta entrega prepara essa arquitetura, mas não inclui um APK validado nem integração de câmera por plugin. A escolha de foto utiliza o seletor de arquivos do dispositivo/navegador.

**Supabase:** o SDK JavaScript conecta a aplicação ao Auth, ao PostgreSQL e ao Storage. O frontend utiliza apenas uma chave pública, e a autorização efetiva é feita por políticas RLS no servidor.

**Ferramentas de desenvolvimento:** TypeScript, Vite, npm, Vitest, Cypress e editor de código. O arquivo `package-lock.json` registra as versões resolvidas das dependências.

## 3. Arquitetura

```text
Usuário → interface Ionic → estado e ações Vue → cliente Supabase
                                                 ├─ Auth: sessão e senha
                                                 ├─ Database: perfil
                                                 └─ Storage: foto privada

Build Vite → dist → Capacitor → projeto Android/iOS
```

O Auth fornece o identificador do usuário autenticado. Esse identificador é a chave primária de `profiles` e também o nome da pasta que guarda suas fotos. As políticas comparam esse valor com `auth.uid()`, impedindo acesso a dados de outro usuário mesmo se alguém modificar a interface.

## 4. Modelo de dados e segurança

| Campo em profiles | Tipo | Finalidade |
| --- | --- | --- |
| id | uuid | Identificador ligado a auth.users |
| name | text | Nome de 2 a 100 caracteres |
| birth_date | date | Nascimento entre 1900 e a data atual |
| nickname | text | De 3 a 30 letras, números ou sublinhados |
| avatar_path | text, opcional | Caminho da foto dentro da pasta do usuário |

O nickname não é único globalmente. As senhas são gerenciadas pelo Supabase Auth e não são salvas na tabela de perfil. O banco permite ler, inserir e atualizar apenas a própria linha. O bucket é privado, restringe tamanho e formatos e permite ler, inserir e excluir apenas arquivos na própria pasta. Uma URL assinada concede acesso temporário à foto; ela não deve ser compartilhada indiscriminadamente.

O script `supabase/schema.sql` cria a estrutura e as políticas em uma transação. Ele deve ser executado em um projeto novo para evitar conflitos com tabelas ou políticas existentes.

## 5. Implementação dos requisitos

### Autenticação e recuperação

O login chama `supabase.auth.signInWithPassword`. O cadastro usa `signUp`, respeitando a confirmação por e-mail configurada no projeto. O cliente restaura a sessão ao abrir a aplicação e acompanha mudanças com `onAuthStateChange`. O logout usa `signOut`.

A recuperação tem duas etapas: `resetPasswordForEmail` envia o link para a URL autorizada; ao receber `PASSWORD_RECOVERY`, a interface solicita a nova senha e chama `updateUser`. A senha precisa ter pelo menos oito caracteres e coincidir com sua confirmação. O fluxo de recuperação implementado usa navegador e URL web; deep links nativos ficam como evolução.

### Boas-vindas

Após entrar, o usuário visualiza uma saudação com seu nome, nickname, e-mail e foto, quando cadastrados. O botão de edição abre o perfil. As áreas privadas só são exibidas com sessão, enquanto as políticas do servidor protegem o acesso aos dados.

### Perfil no Database

O carregamento consulta `profiles` filtrando pelo usuário. O formulário valida os campos e usa `upsert` para criar ou atualizar o registro. As restrições do banco complementam as validações do navegador. Datas futuras e nicknames fora do formato são recusados.

### Foto no Storage

A aplicação aceita JPG, PNG e WebP até 2 MB. O upload usa um nome aleatório na pasta do usuário e salva o caminho no perfil. Depois, `createSignedUrl` fornece uma URL temporária para exibir a foto. Ao trocar a foto, a anterior é removida depois da gravação do perfil. Se a gravação falhar, o código tenta remover o novo upload; falhas de rede podem exigir limpeza posterior de arquivos órfãos.

## 6. Procedimento para reprodução

Siga o README para instalar dependências, executar o SQL, preencher `.env`, autorizar URLs de redirecionamento e iniciar o Vite. Crie uma conta com e-mail acessível, confirme o cadastro e entre. Preencha os dados, selecione uma foto e salve. Volte ao início para visualizar a saudação personalizada.

## 7. Roteiro de testes e evidências

Os itens abaixo são um roteiro de validação, não resultados remotos já obtidos. Registre as evidências após conectar o seu Supabase.

| Teste | Resultado esperado | Evidência sugerida |
| --- | --- | --- |
| Cadastro e confirmação | Conta confirmada permite login | Tela de boas-vindas |
| Login inválido | Erro sem acesso ao perfil | Mensagem de erro |
| Recuperação por e-mail | Link permite definir senha nova e entrar novamente | Tela de nova senha, sem expor tokens |
| Gravar perfil | Nome, nascimento e nickname persistem após recarregar | Tela de perfil e linha no banco |
| Upload de foto | Foto aparece no perfil e em boas-vindas | Tela e arquivo no bucket |
| Arquivo maior que 2 MB ou SVG | Arquivo recusado | Mensagem de validação |
| Logout e recarregamento | Retorno ao login sem dados privados | Tela de login |
| Duas contas diferentes | Cada conta acessa somente seus dados | Sessões separadas e verificação RLS |

Para verificar RLS, use duas sessões autenticadas com a chave pública e tente consultar o ID da outra conta: a consulta deve retornar zero linhas. Uma tentativa de inserir dados com o ID alheio deve falhar. Repita o teste tentando obter URL de arquivo da outra pasta. Não use o SQL Editor como prova de RLS, pois ele opera com privilégios elevados.

Os testes unitários cobrem entradas válidas, nomes vazios, nicknames inválidos, datas impossíveis/futuras e limites de foto. O teste Cypress cobre navegação pública. Os testes locais não substituem validação real de e-mail, políticas e persistência remota.

## 8. Conclusão

O projeto aplica a divisão de responsabilidades apresentada na pesquisa anterior: Ionic estrutura a interface, Vue gerencia os estados e interações, Capacitor prepara o empacotamento móvel e Supabase concentra os serviços de backend. O código contempla os fluxos solicitados; a conclusão da demonstração prática requer configurar o backend, executar os testes remotos e registrar as telas. Como evoluções, podem ser adicionados câmera nativa, deep links de recuperação e compilação em dispositivos reais.

## Referências

- Material-base: *Pesquisa Teórica: Ionic, Vue, Capacitor e Supabase*, Vinícius Cavilha, PDF fornecido.
- Ionic Vue: https://ionicframework.com/docs/vue/overview
- Vue: https://vuejs.org/guide/introduction.html
- Capacitor: https://capacitorjs.com/docs
- Supabase, recuperação de senha: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- Supabase, upload: https://supabase.com/docs/reference/javascript/storage-from-upload
- Supabase, URL assinada: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl
- Supabase, RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
