import { createContainer, asValue, InjectionMode } from 'awilix';

/**
 * Builds the Awilix DI container.
 * Phase 0: skeleton only — more registrations added in Phase 1 (auth).
 *
 * Lifetime guide:
 *   singleton()  — stateless (DiceService, config)
 *   scoped()     — per-request (all Handlers/Services/Repositories)
 *   transient()  — rare (new instance every time)
 */
export function buildContainer() {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  // Registrations will be added here as features are built:
  //   container.register({ userRepository: asClass(UserRepository).scoped() });
  //   container.register({ authService: asClass(AuthService).scoped() });

  return container;
}

export type AppContainer = ReturnType<typeof buildContainer>;
