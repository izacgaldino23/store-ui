import type { I18nProvider } from '@refinedev/core';

const translations: Record<string, string> = {
  'pages.login.title': 'Entrar',
  'pages.login.fields.email': 'Email / Usuário',
  'pages.login.fields.password': 'Senha',
  'pages.login.buttons.rememberMe': 'Lembrar-me',
  'pages.login.buttons.forgotPassword': 'Esqueceu a senha?',
  'pages.login.signin': 'Entrar',
  'pages.login.buttons.noAccount': 'Não tem conta?',
  'pages.login.signup': 'Cadastre-se',
  'pages.login.divider': 'ou',
  'pages.login.errors.requiredEmail': 'Email é obrigatório',
  'pages.login.errors.validEmail': 'Email inválido',
  'pages.login.errors.requiredPassword': 'Senha é obrigatória',
  'pages.login.buttons.haveAccount': 'Já tem conta?',
  'pages.login.buttons.submit': 'Entrar',
  'pages.register.title': 'Criar conta',
  'pages.register.email': 'Email',
  'pages.register.fields.email': 'Email',
  'pages.register.errors.requiredEmail': 'Email é obrigatório',
  'pages.register.errors.validEmail': 'Email inválido',
  'pages.register.fields.password': 'Senha',
  'pages.register.errors.requiredPassword': 'Senha é obrigatória',
  'pages.register.buttons.submit': 'Cadastrar',
  'pages.register.buttons.haveAccount': 'Já tem conta?',
  'pages.register.signin': 'Entrar',
};

export const i18nProvider: I18nProvider = {
  translate: (key: string, defaultMessage?: string) => {
    return translations[key] || defaultMessage || key;
  },
  changeLocale: () => Promise.resolve(),
  getLocale: () => 'pt-BR',
};
