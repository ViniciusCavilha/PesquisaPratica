<template>
  <ion-page>
    <ion-header
      ><ion-toolbar
        ><ion-title>Conecta · Meu perfil</ion-title></ion-toolbar
      ></ion-header
    >
    <ion-content>
      <main class="layout">
        <header class="intro">
          <h1>Cadastro de usuário</h1>
          <p>Pesquisa prática com Ionic, Vue, Capacitor e Supabase.</p>
        </header>
        <section class="panel" :aria-busy="busy || loading">
          <p v-if="!supabase" class="notice">
            Configure o arquivo .env com a URL e a chave pública do Supabase
            para começar. Veja o README do projeto.
          </p>
          <p v-if="loading" role="status">Carregando sua sessão…</p>
          <p v-if="message" class="notice" role="status">{{ message }}</p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <template v-if="!loading && (!session || recovery)">
            <h2>{{ formTitle }}</h2>
            <form @submit.prevent="authenticate">
              <label v-if="!recovery"
                >E-mail<input
                  v-model.trim="email"
                  type="email"
                  autocomplete="email"
                  required
                  maxlength="254"
                  :disabled="busy"
              /></label>
              <label v-if="mode !== 'reset' || recovery"
                >{{ recovery ? "Nova senha" : "Senha"
                }}<input
                  v-model="password"
                  type="password"
                  :autocomplete="
                    mode === 'signup' || recovery
                      ? 'new-password'
                      : 'current-password'
                  "
                  required
                  minlength="8"
                  :disabled="busy"
                /><small>Mínimo de 8 caracteres.</small></label
              >
              <label v-if="mode === 'signup' || recovery"
                >Confirme a senha<input
                  v-model="confirmation"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  :disabled="busy"
              /></label>
              <ion-button
                type="submit"
                expand="block"
                :disabled="busy || !supabase"
                >{{ submitLabel }}</ion-button
              >
            </form>
            <div v-if="!recovery" class="links">
              <button
                v-if="mode === 'login'"
                @click="changeMode('reset')"
                :disabled="busy"
              >
                Esqueci minha senha</button
              ><button
                @click="changeMode(mode === 'login' ? 'signup' : 'login')"
                :disabled="busy"
              >
                {{
                  mode === "login" ? "Criar uma conta" : "Voltar para o login"
                }}
              </button>
            </div>
          </template>
          <template v-else-if="!loading && session">
            <nav aria-label="Área do usuário">
              <button
                @click="tab = 'welcome'"
                :aria-current="tab === 'welcome' ? 'page' : undefined"
              >
                Início</button
              ><button
                @click="tab = 'profile'"
                :aria-current="tab === 'profile' ? 'page' : undefined"
              >
                Meu perfil</button
              ><button @click="logout" :disabled="busy">Sair</button>
            </nav>
            <template v-if="tab === 'welcome'">
              <div class="avatar">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Sua foto de perfil"
                /><span v-else>{{
                  (profile.name || session.user.email || "U")
                    .charAt(0)
                    .toUpperCase()
                }}</span>
              </div>
              <h2>Bem-vindo{{ profile.name ? `, ${profile.name}` : "" }}!</h2>
              <p class="muted">
                {{
                  profile.nickname
                    ? `@${profile.nickname}`
                    : "Preencha seus dados na tela de perfil."
                }}
              </p>
              <p class="account">{{ session.user.email }}</p>
              <ion-button expand="block" @click="tab = 'profile'"
                >Editar meu perfil</ion-button
              >
            </template>
            <template v-else>
              <h2>Seu perfil</h2>
              <p class="muted">Conte um pouco sobre você.</p>
              <form @submit.prevent="saveProfile">
                <div class="avatar">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    alt="Sua foto de perfil"
                  /><span v-else>{{
                    (profile.name || "U").charAt(0).toUpperCase()
                  }}</span>
                </div>
                <label
                  >Foto de perfil<input
                    :key="fileInputKey"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    @change="selectPhoto"
                    :disabled="busy"
                  /><small>JPG, PNG ou WebP, até 2 MB.</small></label
                >
                <label
                  >Nome<input
                    v-model="profile.name"
                    autocomplete="name"
                    required
                    minlength="2"
                    maxlength="100"
                    :disabled="busy"
                /></label>
                <label
                  >Data de nascimento<input
                    v-model="birthDateInput"
                    type="text"
                    inputmode="numeric"
                    placeholder="DD/MM/AAAA"
                    maxlength="10"
                    pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
                    autocomplete="bday"
                    required
                    @input="formatBirthDate"
                    :disabled="busy"
                /><small>Digite dia, mês e ano. Exemplo: 15/08/2008.</small></label>
                <label
                  >Nickname<input
                    v-model.trim="profile.nickname"
                    autocomplete="nickname"
                    required
                    minlength="3"
                    maxlength="30"
                    pattern="[a-zA-Z0-9_]{3,30}"
                    :disabled="busy"
                  /><small
                    >Letras, números e sublinhado, sem espaços.</small
                  ></label
                >
                <ion-button type="submit" expand="block" :disabled="busy">{{
                  busy ? "Salvando…" : "Salvar perfil"
                }}</ion-button>
              </form>
            </template>
          </template>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import type { Session } from "@supabase/supabase-js";
import { supabase, redirectUrl } from "../lib/supabase";
import { validatePhoto, validateProfile } from "../lib/validation";
const session = ref<Session | null>(null);
const mode = ref<"login" | "signup" | "reset">("login");
const tab = ref<"welcome" | "profile">("welcome");
// ref guarda valores que atualizam a tela quando mudam.
const recovery = ref(false);
const loading = ref(true);
const busy = ref(false);
const error = ref("");
const message = ref("");
const email = ref("");
const password = ref("");
const confirmation = ref("");
const photo = ref<File | null>(null);
const avatarUrl = ref("");
const fileInputKey = ref(0);
const birthDateInput = ref("");

function formatBirthDate(event: Event) {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/\D/g, "").slice(0, 8);
  let formatted = digits.slice(0, 2);
  if (digits.length > 2) formatted += "/" + digits.slice(2, 4);
  if (digits.length > 4) formatted += "/" + digits.slice(4, 8);
  birthDateInput.value = formatted;
  input.value = formatted;
}
const profile = reactive({
  name: "",
  birth_date: "",
  nickname: "",
  avatar_path: "",
});
let unsubscribe: (() => void) | undefined;
// O título e o botão dependem do formulário aberto.
const formTitle = computed(() => {
  if (recovery.value) return "Redefina sua senha";
  if (mode.value === "signup") return "Criar conta";
  if (mode.value === "reset") return "Recuperar senha";
  return "Login";
});
const submitLabel = computed(() => {
  if (busy.value) return "Aguarde…";
  if (recovery.value) return "Salvar nova senha";
  if (mode.value === "signup") return "Criar conta";
  if (mode.value === "reset") return "Enviar link";
  return "Entrar";
});
function changeMode(next: typeof mode.value) {
  mode.value = next;
  error.value = "";
  message.value = "";
  password.value = "";
  confirmation.value = "";
}
function showError(value: unknown) {
  const raw =
    value instanceof Error
      ? value.message
      : (value as { message?: string })?.message || "Tente novamente.";
  error.value =
    raw === "Invalid login credentials"
      ? "E-mail ou senha incorretos."
      : raw === "Email not confirmed"
        ? "Confirme seu e-mail antes de entrar."
        : `Não foi possível concluir: ${raw}`;
}
// Busca somente o registro da conta que está conectada.
async function loadProfile(userId: string) {
  if (!supabase) return;
  const { data, error: failure } = await supabase
    .from("profiles")
    .select("name,birth_date,nickname,avatar_path")
    .eq("id", userId)
    .maybeSingle();
  if (failure) throw failure;
  if (session.value?.user.id !== userId) return;
  Object.assign(
    profile,
    data
      ? { ...data, avatar_path: data.avatar_path || "" }
      : { name: "", birth_date: "", nickname: "", avatar_path: "" },
  );
  avatarUrl.value = "";
  // O banco usa AAAA-MM-DD; o formulário mostra DD/MM/AAAA.
  birthDateInput.value = profile.birth_date.split("-").reverse().join("/");
  if (data?.avatar_path) {
    const result = await supabase.storage
      .from("avatars")
      .createSignedUrl(data.avatar_path, 3600);
    if (result.error) throw result.error;
    if (session.value?.user.id === userId)
      avatarUrl.value = result.data.signedUrl;
  }
}
onMounted(async () => {
  if (!supabase) {
    loading.value = false;
    return;
  }
  const { data } = supabase.auth.onAuthStateChange((event, current) => {
    session.value = current;
    if (event === "PASSWORD_RECOVERY") recovery.value = true;
    if (!current) {
      Object.assign(profile, {
        name: "",
        birth_date: "",
        nickname: "",
        avatar_path: "",
      });
      avatarUrl.value = "";
      photo.value = null;
      birthDateInput.value = "";
      recovery.value = false;
    }
    // Evita chamadas ao cliente enquanto o lock de Auth está no callback.
    if (current && (event === "SIGNED_IN" || event === "INITIAL_SESSION"))
      setTimeout(() => {
        loadProfile(current.user.id).catch(showError);
      }, 0);
  });
  unsubscribe = () => data.subscription.unsubscribe();
  try {
    const result = await supabase.auth.getSession();
    if (result.error) throw result.error;
    session.value = result.data.session;
  } catch (e) {
    showError(e);
  } finally {
    loading.value = false;
  }
});
onUnmounted(() => unsubscribe?.());
async function authenticate() {
  if (!supabase || busy.value) return;
  const client = supabase;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    if (
      (mode.value === "signup" || recovery.value) &&
      password.value !== confirmation.value
    )
      throw new Error("As senhas não coincidem.");
    if (recovery.value) {
      const result = await client.auth.updateUser({ password: password.value });
      if (result.error) throw result.error;
      recovery.value = false;
      message.value = "Senha atualizada com sucesso.";
    } else if (mode.value === "reset") {
      const result = await client.auth.resetPasswordForEmail(email.value, {
        redirectTo: redirectUrl,
      });
      if (result.error) throw result.error;
      message.value =
        "Se houver uma conta com esse e-mail, você receberá o link de recuperação. Abra o link neste navegador.";
    } else if (mode.value === "signup") {
      const result = await client.auth.signUp({
        email: email.value,
        password: password.value,
        options: { emailRedirectTo: redirectUrl },
      });
      if (result.error) throw result.error;
      message.value = result.data.session
        ? "Conta criada! Complete seu perfil."
        : "Confira seu e-mail para confirmar o cadastro antes de entrar.";
    } else {
      const result = await client.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (result.error) throw result.error;
      session.value = result.data.session;
      tab.value = "welcome";
      await loadProfile(result.data.user.id);
    }
    password.value = "";
    confirmation.value = "";
  } catch (e) {
    showError(e);
  } finally {
    busy.value = false;
  }
}
function selectPhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  photo.value = null;
  if (!file) return;
  const invalid = validatePhoto(file);
  if (invalid) {
    error.value = invalid;
    input.value = "";
    return;
  }
  error.value = "";
  photo.value = file;
}
async function saveProfile() {
  if (!supabase || !session.value || busy.value) return;
  const client = supabase;
  const userId = session.value.user.id;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    profile.birth_date = birthDateInput.value.split("/").reverse().join("-");
    const invalid = validateProfile(
      profile.name,
      profile.birth_date,
      profile.nickname,
    );
    if (invalid) throw new Error(invalid);
    let newPath = profile.avatar_path;
    const oldPath = profile.avatar_path;
    // Primeiro envia a foto. Depois salva o caminho junto com os dados.
    if (photo.value) {
      const ext = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      }[photo.value.type];
      newPath = `${userId}/${crypto.randomUUID()}.${ext}`;
      const upload = await client.storage
        .from("avatars")
        .upload(newPath, photo.value, { contentType: photo.value.type });
      if (upload.error) throw upload.error;
    }
    // upsert cria o perfil ou atualiza o registro se ele já existir.
    const result = await client
      .from("profiles")
      .upsert({
        id: userId,
        name: profile.name.trim(),
        birth_date: profile.birth_date,
        nickname: profile.nickname,
        avatar_path: newPath || null,
      });
    if (result.error) {
      if (newPath && newPath !== oldPath)
        await client.storage.from("avatars").remove([newPath]);
      throw result.error;
    }
    profile.avatar_path = newPath;
    photo.value = null;
    fileInputKey.value++;
    message.value = "Perfil salvo com sucesso!";
    if (oldPath && oldPath !== newPath) {
      const removal = await client.storage.from("avatars").remove([oldPath]);
      if (removal.error)
        message.value +=
          " A foto anterior não pôde ser removida do armazenamento.";
    }
    await loadProfile(userId);
  } catch (e) {
    showError(e);
  } finally {
    busy.value = false;
  }
}
async function logout() {
  if (!supabase || busy.value) return;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    const result = await supabase.auth.signOut();
    if (result.error) throw result.error;
    changeMode("login");
    tab.value = "welcome";
  } catch (e) {
    showError(e);
  } finally {
    busy.value = false;
  }
}
</script>
