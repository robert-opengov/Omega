import { gabConfig } from '@/config/gab.config';
import { NextAuthAdapter } from './adapters/gab-v1/auth.adapter';
import { GabDataV1Adapter } from './adapters/gab-v1/data.v1.adapter';
import { GabSchemaV1Adapter } from './adapters/gab-v1/schema.v1.adapter';
import { GabChildTableV1Adapter } from './adapters/gab-v1/child-table.v1.adapter';

// ---------------------------------------------------------------------------
// Composition Root — the single place where ports are wired to adapters.
//
// To connect to V2, create adapters in lib/core/adapters/gab-v2/ that
// implement the same port interfaces, set GAB_API_VERSION=v2 in your
// environment, and add the conditional import below.
//
// Example (when V2 is ready):
//   import { GabAuthV2Adapter } from './adapters/gab-v2/auth.adapter';
//   const authPort = apiVersion === 'v2'
//     ? new GabAuthV2Adapter(gabConfig.apiUrl)
//     : new NextAuthAdapter(gabConfig.apiUrl, gabConfig.clientId);
// ---------------------------------------------------------------------------

const apiVersion = process.env.GAB_API_VERSION || 'v1';

function buildAuthPort() {
  // if (apiVersion === 'v2') {
  //   return new GabAuthV2Adapter(gabConfig.apiUrl);
  // }
  return new NextAuthAdapter(gabConfig.apiUrl, gabConfig.clientId);
}

export const authPort = buildAuthPort();

export const gabDataRepo = new GabDataV1Adapter(authPort, gabConfig.apiUrl);

export const gabSchemaRepo = new GabSchemaV1Adapter(authPort, gabConfig.apiUrl);

export const gabChildTableRepo = new GabChildTableV1Adapter(authPort, gabConfig.apiUrl);
