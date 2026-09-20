import type { AuthService } from '../authService';

// El sandbox no pasa por aquí en la práctica: AuthScreen.tsx sigue
// entrando con los botones de perfil de demo (setActiveUser + login de
// userSlice), sin llamar a authService — así el comportamiento actual no
// cambia. Este mock solo completa el par mock/real que sigue el resto de
// los servicios del proyecto, para cuando algo (tests, una vista futura)
// necesite ejercitar la interfaz sin backend real.
let fakeSession: { userId: string } | null = null;

export const mockAuthService: AuthService = {
  async signUp() {
    fakeSession = { userId: 'sandbox-fake-user' };
    return fakeSession;
  },
  async signIn() {
    fakeSession = { userId: 'sandbox-fake-user' };
    return fakeSession;
  },
  async signOut() {
    fakeSession = null;
  },
  async getSession() {
    return fakeSession;
  },
};
