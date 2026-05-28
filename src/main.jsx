import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx' // <--- 대문자 App.jsx가 아닌 소문자 app.jsx 경로로 완벽하게 일치시킵니다.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)