import type { Container } from 'hostConfig'
import type { Props } from 'shared/ReactType'

export const elementPropsKey = '__props'
const validSyntheticEvents = ['click']

type EventCallback = (e: Event) => void
interface Paths {
    bubble: EventCallback[]
    capture: EventCallback[]
}
interface SyntheticEvent extends Event {
    __stopPropagation: boolean
}

export interface DOMElement extends Element {
    [elementPropsKey]: Props
}

export function updateFiberProps(node: DOMElement, props: Props) {
    node[elementPropsKey] = props
}

function getEventCallbackFromEventType(eventType: string): string[] | undefined {
    return {
        click: ['onClickCapture', 'onClick'],
    }[eventType]
}

export function initEvent(container: Container, eventType: string) {
    if (!validSyntheticEvents.includes(eventType)) {
        console.warn(`当前不支持${eventType}事件`)
        return
    }
    if (__DEV__) {
        console.log('初始化事件', eventType)
    }

    container.addEventListener(eventType, e => {
        dispatchEvent(container, eventType, e)
    })
}

function dispatchEvent(container: Container, eventType: string, event: Event) {
    const targetElement = event.target
    if (targetElement === null) {
        console.warn('事件不存在target', event)
    }

    // 1. 收集沿途事件
    const { bubble, capture } = collectPaths(targetElement as DOMElement, container, eventType)

    // 2. 创建合成事件
    const syntheticEvent = createSyntheticEvent(event)

    // 3. 遍历 capture
    triggerEventFlow(capture, syntheticEvent)

    if (!syntheticEvent.__stopPropagation) {
        // 4. 遍历 bubble
        triggerEventFlow(bubble, syntheticEvent)
    }
}

function collectPaths(targetElement: DOMElement, container: Container, eventType: string) {
    const paths: Paths = {
        bubble: [],
        capture: [],
    }

    while (targetElement && targetElement !== container) {
        const elementProps = targetElement[elementPropsKey]
        if (elementProps) {
            const callbackNameList = getEventCallbackFromEventType(eventType)
            if (callbackNameList) {
                callbackNameList.forEach((callbackName, i) => {
                    const eventCallback = elementProps[callbackName]
                    if (eventCallback) {
                        if (i === 0) {
                            paths.capture.unshift(eventCallback)
                        }
                        else {
                            paths.bubble.push(eventCallback)
                        }
                    }
                })
            }
        }
        targetElement = targetElement.parentNode as DOMElement
    }
    return paths
}

function createSyntheticEvent(event: Event) {
    const syntheticEvent = event as SyntheticEvent
    syntheticEvent.__stopPropagation = false
    const originStopPropagation = syntheticEvent.stopPropagation

    // 覆盖默认方法
    syntheticEvent.stopPropagation = () => {
        syntheticEvent.__stopPropagation = true
        if (originStopPropagation) {
            originStopPropagation()
        }
    }
    return syntheticEvent
}

function triggerEventFlow(paths: EventCallback[], syntheticEvent: SyntheticEvent) {
    for (let i = 0; i < paths.length; i++) {
        const callback = paths[i]
        callback.call(null, syntheticEvent)

        if (syntheticEvent.__stopPropagation) {
            break
        }
    }
}
