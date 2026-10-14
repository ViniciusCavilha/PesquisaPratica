import { describe, expect, test } from 'vitest';
import { validatePhoto, validateProfile } from '../../src/lib/validation';
describe('Validações do perfil', () => {
  test('aceita dados válidos', () => expect(validateProfile('Ana Silva', '2000-02-29', 'ana_01')).toBe(''));
  test.each(['2099-01-01', '2001-02-29', '', '1899-12-31'])('recusa nascimento inválido %s', date => expect(validateProfile('Ana', date, 'ana')).not.toBe(''));
  test('recusa nickname com espaços', () => expect(validateProfile('Ana', '2000-01-01', 'ana silva')).not.toBe(''));
  test('recusa nome vazio', () => expect(validateProfile(' ', '2000-01-01', 'ana')).not.toBe(''));
  test('recusa SVG e arquivo grande', () => {
    expect(validatePhoto({ type: 'image/svg+xml', size: 100 })).not.toBe('');
    expect(validatePhoto({ type: 'image/png', size: 2097153 })).not.toBe('');
  });
  test('aceita imagem no limite', () => expect(validatePhoto({ type: 'image/jpeg', size: 2097152 })).toBe(''));
});
