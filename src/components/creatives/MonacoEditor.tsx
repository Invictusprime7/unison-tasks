import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

// Enhanced Monaco Editor with React/TypeScript support and live preview capabilities
const MonacoEditor: React.FC<React.ComponentProps<typeof Editor>> = (props) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure TypeScript compiler options for React
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
      lib: ['es2020', 'dom', 'dom.iterable'],
    });

    // Configure JSX/TSX support
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
      lib: ['es2020', 'dom', 'dom.iterable'],
    });

    // Add React type definitions for IntelliSense
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare module 'react' {
        export interface FC<P = {}> {
          (props: P): JSX.Element | null;
        }
        export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
        export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        export function useRef<T>(initialValue: T): { current: T };
        export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
        export function useMemo<T>(factory: () => T, deps: any[]): T;
        export interface CSSProperties {
          [key: string]: any;
        }
        export namespace JSX {
          interface Element {}
          interface IntrinsicElements {
            [elemName: string]: any;
          }
        }
      }
      `,
      'ts:react.d.ts'
    );

    // Enable better error detection
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Call original onMount if provided
    if (props.onMount) {
      props.onMount(editor, monaco);
    }
  };

  return (
    <Editor
      {...props}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        ...props.options,
      }}
    />
  );
};

export default MonacoEditor;
