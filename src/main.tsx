import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './styles.css';
import App from './App';
import { installPublicPathRuntime } from './runtimePaths';

installPublicPathRuntime();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
