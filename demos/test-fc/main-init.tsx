import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
    const [num, setNum] = useState(100)

    const arr = num % 2 === 0
        ? [
            <li key="1">1</li>,
            <li key="2">2</li>,
            <li key="3">3</li>,
        ]
        : [
            <li key="3">3</li>,
            <li key="2">2</li>,
            <li key="1">1</li>,
        ]

    const arr2 = <>
        <li>4</li>
        <li>5</li>
    </>

    const arr3 = <ul
        onClickCapture={() => {
            setNum((num) => num + 1)
            setNum((num) => num + 1)
            setNum((num) => num + 1)
        }}
    >
        {num}
        {arr2}
        <li>6</li>
        <li>7</li>
        {arr}
    </ul>
    return arr3
}

function Child() {
    return <span>vancats</span>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
