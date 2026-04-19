import { ContextInjected, TcbExtendedContext } from '@cloudbase/functions-typings';
import { CloudBase } from '@cloudbase/node-sdk';
export type TcbContext = ContextInjected<TcbExtendedContext>;
import { McpServer, McpTransportConfig } from './mcp';
export declare function setDefaultEnvId(envId: string): void;
export declare function getEnvId(context: TcbContext): string;
export declare function getOpenAPIBaseURL(context: TcbContext): string;
export declare function setDefaultAccessToken(accessToken: string): void;
export declare function getAccessToken(context: TcbContext): string;
export declare function replaceEnvId(context: TcbContext, urlTemplate: string): string;
export declare function replaceReadMe(agentSetting: string): string;
export declare function checkIsInCBR(): boolean;
export interface FileInfo {
    cloudId: string;
    fileName: string;
    bytes: number;
    type: string;
}
export declare function getFileInfo(tcbapp: CloudBase, files: string[]): Promise<FileInfo[]>;
export declare function dealMcpServerList(context: TcbContext, mcpServers: McpServer[]): McpTransportConfig[];
