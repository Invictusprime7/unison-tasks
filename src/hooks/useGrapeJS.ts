import { useState, useEffect, useRef, useCallback } from 'react';
import { RPCHost } from '@/utils/rpc';

export interface GrapeJSComponent {
  type?: string;
  tagName?: string;
  content?: string;
  style?: Record<string, any>;
  attributes?: Record<string, any>;
  components?: GrapeJSComponent[];
  classes?: string[];
}

/**
 * Hook to manage GrapeJS editor in iframe with RPC communication
 */
export const useGrapeJS = () => {
  const [isReady, setIsReady] = useState(false);
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rpcRef = useRef<RPCHost | null>(null);

  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;

    // Initialize RPC
    const rpc = new RPCHost(window);
    rpcRef.current = rpc;
    rpc.setTarget(iframeRef.current.contentWindow);

    // Register handlers for iframe events
    rpc.register('editorReady', async () => {
      console.log('[useGrapeJS] Editor ready');
      setIsReady(true);
      return { received: true };
    });

    rpc.register('editorChanged', async ({ html, css }: { html: string; css: string }) => {
      setHtml(html);
      setCss(css);
      return { received: true };
    });

    rpc.register('console', async ({ type, args }: { type: string; args: any[] }) => {
      console.log(`[GrapeJS ${type}]:`, ...args);
      return { received: true };
    });

    return () => {
      rpc.destroy();
    };
  }, []);

  // API Methods
  const getHtml = useCallback(async (): Promise<string> => {
    if (!rpcRef.current || !isReady) return '';
    return await rpcRef.current.call('getHtml', {});
  }, [isReady]);

  const getCss = useCallback(async (): Promise<string> => {
    if (!rpcRef.current || !isReady) return '';
    return await rpcRef.current.call('getCss', {});
  }, [isReady]);

  const getJs = useCallback(async (): Promise<string> => {
    if (!rpcRef.current || !isReady) return '';
    return await rpcRef.current.call('getJs', {});
  }, [isReady]);

  const setComponents = useCallback(async (components: GrapeJSComponent[]) => {
    if (!rpcRef.current || !isReady) return;
    await rpcRef.current.call('setComponents', { components });
  }, [isReady]);

  const getComponents = useCallback(async (): Promise<any> => {
    if (!rpcRef.current || !isReady) return [];
    return await rpcRef.current.call('getComponents', {});
  }, [isReady]);

  const addComponents = useCallback(async (components: GrapeJSComponent[], options?: any) => {
    if (!rpcRef.current || !isReady) return;
    await rpcRef.current.call('addComponents', { components, options });
  }, [isReady]);

  const setStyle = useCallback(async (style: string) => {
    if (!rpcRef.current || !isReady) return;
    await rpcRef.current.call('setStyle', { style });
  }, [isReady]);

  const getStyle = useCallback(async (): Promise<string> => {
    if (!rpcRef.current || !isReady) return '';
    return await rpcRef.current.call('getStyle', {});
  }, [isReady]);

  const clear = useCallback(async () => {
    if (!rpcRef.current || !isReady) return;
    await rpcRef.current.call('clear', {});
    setHtml('');
    setCss('');
  }, [isReady]);

  const undo = useCallback(async () => {
    if (!rpcRef.current || !isReady) return;
    await rpcRef.current.call('undo', {});
  }, [isReady]);

  const redo = useCallback(async () => {
    if (!rpcRef.current || !isReady) return;
    await rpcRef.current.call('redo', {});
  }, [isReady]);

  const setDevice = useCallback(async (device: string) => {
    if (!rpcRef.current || !isReady) return;
    await rpcRef.current.call('setDevice', { device });
  }, [isReady]);

  const getDevice = useCallback(async (): Promise<string> => {
    if (!rpcRef.current || !isReady) return 'Desktop';
    return await rpcRef.current.call('getDevice', {});
  }, [isReady]);

  return {
    iframeRef,
    isReady,
    html,
    css,
    // API methods
    getHtml,
    getCss,
    getJs,
    setComponents,
    getComponents,
    addComponents,
    setStyle,
    getStyle,
    clear,
    undo,
    redo,
    setDevice,
    getDevice,
  };
};
