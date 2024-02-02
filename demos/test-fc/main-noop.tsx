import React from 'react'
// @ts-ignore
import ReactNoopRenderer from 'react-noop-renderer'

function App() {
    return (
        <>
            <Child />
            <div>hello workd</div>
        </>
    )
}

function Child() {
    return 'child'
}

const root = ReactNoopRenderer.createRoot()
root.render(<App />)
