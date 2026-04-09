import { gabConfig } from '@/config/gab.config';
import { NextAuthAdapter } from './adapters/gab-v1/auth.adapter';
import { GabDataV1Adapter } from './adapters/gab-v1/data.v1.adapter';
import { GabSchemaV1Adapter } from './adapters/gab-v1/schema.v1.adapter';
import { GabChildTableV1Adapter } from './adapters/gab-v1/child-table.v1.adapter';

export const authPort = new NextAuthAdapter(gabConfig.apiUrl, gabConfig.clientId);

export const gabDataRepo = new GabDataV1Adapter(authPort, gabConfig.apiUrl);

export const gabSchemaRepo = new GabSchemaV1Adapter(authPort, gabConfig.apiUrl);

export const gabChildTableRepo = new GabChildTableV1Adapter(authPort, gabConfig.apiUrl);

// When V2 is ready, swap the adapter implementations here:
// export const authPort = new SsoAuthAdapter(gabConfig);
// export const gabDataRepo = new GabDataV2Adapter(authPort, gabConfig.apiUrl);
