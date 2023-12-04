export type Container = Element
export type Instance = Element

export const createInstance = (type: string): Instance => {
    const element = document.createElement(type)
    // TODO 处理 props
    return element
}

export const createTextInstance = (context: string) => {
    return document.createTextNode(context)
}

export const appendInitialChild = (parent: Instance | Container, child: Instance) => {
    parent.appendChild(child)
}

export const appendChildToContainer = appendInitialChild
