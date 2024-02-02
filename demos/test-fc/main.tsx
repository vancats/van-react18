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
    // return arr3

    return (
        <ul onClick={() => setNum(50)}>
            {new Array(num).fill(0).map((_, i) => {
                return <TimeChild key={i}>{i}</TimeChild>
            })}
        </ul>
    )
}

function Child() {
    return <span>vancats</span>
}

function TimeChild({ children }) {
    const now = performance.now()
    while (performance.now() - now < 4) {
        //
    }
    return <li>
        {children}
    </li>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
