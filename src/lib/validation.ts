export function validateProfile(
  name: string,
  birthDate: string,
  nickname: string,
): string {
  if (name.trim().length < 2 || name.trim().length > 100)
    return "Informe um nome entre 2 e 100 caracteres.";
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(nickname))
    return "Use de 3 a 30 letras, números ou _ no nickname.";
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const invalidDateMessage =
    "Informe uma data de nascimento válida, sem datas futuras.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return invalidDateMessage;
  if (birthDate < "1900-01-01" || birthDate > today) return invalidDateMessage;
  if (Number.isNaN(Date.parse(birthDate))) return invalidDateMessage;
  // O JavaScript pode transformar 30 de fevereiro em uma data de março.
  // A comparação abaixo impede que essa data impossível seja aceita.
  if (new Date(birthDate).toISOString().slice(0, 10) !== birthDate)
    return invalidDateMessage;
  return "";
}
export function validatePhoto(file: { type: string; size: number }): string {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Escolha uma imagem JPG, PNG ou WebP.";
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) return "A foto deve ter no máximo 2 MB.";
  return "";
}
