export function isE2EMockModeEnabled() {
  const envMock = process.env.NEXT_PUBLIC_E2E_MOCK === '1';
  const browserMock =
    typeof window !== 'undefined' &&
    window.localStorage.getItem('crm:e2e:mock') === '1';

  return envMock || browserMock;
}
