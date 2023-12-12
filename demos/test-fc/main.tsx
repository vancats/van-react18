import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
    const [num, setNum] = useState(100)
    // @ts-ignore
    window.setNum = setNum
    return num < 10 ? <Child /> : <div>{num}</div>
}

function Child() {
    return <span>vancats</span>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
