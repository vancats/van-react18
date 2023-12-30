import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
    const [num, updateNum] = useState(0)
    useEffect(() => {
        console.log('App mount')
    }, [])

    useEffect(() => {
        console.log('App mount or update')
    })

    useEffect(() => {
        console.log('num change create', num)
        return () => {
            console.log('num change destroy', num)
        }
    }, [num])

    return (
        <div onClick={() => updateNum(num => num + 1)}>
            {num % 2 === 0 ? <Child /> : 'noop'}
        </div>
    )
}

function Child() {
    useEffect(() => {
        console.log('child mount')
        return () => console.log('child unmount')
    }, [])

    return 'I am child'
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
