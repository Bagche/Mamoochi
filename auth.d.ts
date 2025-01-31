declare module "#auth-utils" {
  interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatar?: string;
    email?: string;
    about: string;
  }

  interface UserSession {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extended?: any;
    loggedInAt: number;
    secure?: Record<string, unknown>;
  }
}

export {};
