import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // <--- 대문자 App.jsx 경로를 정확하게 매칭합니다.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
