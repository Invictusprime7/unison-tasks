import React from 'react';
import Editor from '@monaco-editor/react';

// Simple wrapper component for Monaco Editor that ensures consistent rendering
const MonacoEditor: React.FC<React.ComponentProps<typeof Editor>> = (props) => {
  return <Editor {...props} />;
};

export default MonacoEditor;
