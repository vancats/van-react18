const supportSymbol = typeof Symbol === 'function' && Symbol.for

export const REACT_ELEMENT_TYPE = supportSymbol ? Symbol.for('react.element') : 0xEAC7

export const REACT_FRAGMENT_TYPE = supportSymbol ? Symbol.for('react.fragment') : 0xEACB

export const REACT_CONTEXT_TYPE = supportSymbol ? Symbol.for('react.context') : 0xEACC
export const REACT_PROVIDER_TYPE = supportSymbol ? Symbol.for('react.provider') : 0xEAC2
