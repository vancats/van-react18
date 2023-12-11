import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
    return (
        <div>
            <Child />
        </div>
    )
}

function Child() {
    const [num] = useState(100)
    return <span>{num}</span>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App /> as any)
