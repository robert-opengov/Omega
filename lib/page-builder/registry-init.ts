/**
 * Side-effect import that registers built-in page components.
 *
 * Both the editor and the renderer import this module so that
 * `pageComponentRegistry` is populated before they read from it. Idempotent.
 *
 * The registration runs unconditionally so stored layouts using an entry
 * always render. The palette filters individual entries by `featureFlag`
 * so a disabled module hides its widgets from the editor without breaking
 * existing pages mid-flight.
 */
import { registerBuiltins } from './register-builtins';

registerBuiltins();
