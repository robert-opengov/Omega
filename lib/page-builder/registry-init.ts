/**
 * Side-effect import that registers built-in page components.
 *
 * Both the editor and the renderer import this module so that
 * `pageComponentRegistry` is populated before they read from it. Idempotent.
 */
import { registerBuiltins } from './register-builtins';

registerBuiltins();
