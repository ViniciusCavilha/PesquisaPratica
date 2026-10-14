# Como entender o código

O projeto é um formulário conectado a um banco de dados. Para acompanhar o código, comece por estes arquivos:

1. `src/lib/supabase.ts`: cria a conexão usando a URL e a chave pública do `.env`.
2. `src/views/HomePage.vue`: contém as telas e as funções chamadas pelos botões.
3. `src/lib/validation.ts`: confere nome, data, nickname e tamanho/tipo da foto.
4. `supabase/schema.sql`: cria a tabela e define quem pode acessar os dados.

## O componente Vue

O `<template>` é a parte visual. O `<script setup>` contém as variáveis e funções. O CSS fica em `src/theme/variables.css`.

- `ref` guarda um valor que pode mudar, como o e-mail digitado.
- `reactive` faz o mesmo para um objeto com vários campos, como o perfil.
- `v-model` liga o campo do formulário à variável.
- `v-if` mostra um trecho da tela quando uma condição é verdadeira.
- `@click` executa uma função quando um botão é clicado.
- `@submit.prevent` trata o envio do formulário sem recarregar a página.
- `computed` calcula um valor a partir de outros, como o texto do botão.

No script, uma variável criada com `ref` é acessada com `.value`. No template isso não é necessário.

## Caminho de um login

O usuário digita e-mail e senha → o formulário chama `authenticate` → a função chama `signInWithPassword` → o Supabase retorna a sessão → a tela mostra as boas-vindas.

`async` e `await` são usados porque a resposta pela internet não chega imediatamente. O `try` contém a operação, o `catch` mostra o erro e o `finally` libera os botões mesmo se houver uma falha. A variável `busy` impede cliques repetidos durante a operação.

## Caminho de um perfil

`saveProfile` valida os dados. Se há uma foto selecionada, envia o arquivo para o Storage. Depois, `upsert` grava os campos e o caminho da foto no banco. Ele insere um registro novo ou atualiza o registro existente com o mesmo ID.

O banco guarda o **caminho**, não a própria imagem. Para exibi-la, o aplicativo pede uma URL temporária ao Storage. A foto antiga só é removida depois que o perfil foi salvo.

## Partes que exigem mais estudo

O gerenciamento da sessão e as regras RLS são mais difíceis que um formulário comum. `onAuthStateChange` avisa quando o usuário entra, sai ou abre um link de recuperação. O `setTimeout` agenda o carregamento do perfil para depois desse aviso, evitando uma chamada ao cliente enquanto o processamento interno da autenticação ainda está ocupado.

No SQL, `auth.uid()` representa a conta conectada. A política só permite acessar uma linha quando esse ID coincide com o ID do perfil. Esconder o botão na tela não protege o banco; por isso essas regras são necessárias.

## Exercícios para conferir se entendeu

1. Troque o título da página e identifique onde ele aparece.
2. Explique a diferença entre `session`, `profile` e `photo`.
3. Localize a função chamada pelo botão de salvar perfil.
4. Explique por que não salvamos a senha na tabela `profiles`.
5. Explique o que acontece quando a foto é enviada, mas a gravação no banco falha.
6. Com o Supabase configurado, salve um perfil e recarregue a página para confirmar a persistência.

Não é necessário decorar as chamadas da biblioteca. É necessário entender quais dados são enviados, onde são guardados e como os erros são tratados. Os testes locais não comprovam o funcionamento do backend sem configurá-lo e testá-lo com uma conta real.
